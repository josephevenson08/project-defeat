import { MELEE_CRIT_DAMAGE_MULTIPLIER } from './combatConstants'

/**
 * Rage income from auto attacks.
 *
 * Rage was the one resource `computeUsageRate` could not turn into a sustained rate, so every
 * rage-costed ability without a cooldown reported `unmodelled` and contributed nothing — Heroic
 * Strike, which is a large slice of real Fury damage, most of all. The blocker was never the
 * arithmetic; it was that nothing computed rage *income*. This does.
 *
 * Every constant below is read from wowsims/tbc `sim/core/rage.go` at the same commit the item
 * catalogue is pinned to (3301fca5), not from recall:
 *
 * ```go
 * const RageFactor = 274.7
 * HitFactor = 3.5 / 2   // main hand;  1.75 / 2 off hand
 * if crit { HitFactor *= 2 }
 * generatedRage = damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier
 * ```
 *
 * Four details from that source that a from-memory implementation gets wrong:
 *
 * - **A miss generates nothing at all**, but a **dodge or parry still generates rage**, computed on
 *   the damage the swing *would* have done. wowsims swaps in `PreoutcomeDamage` for exactly this.
 * - **The hit-factor term uses the weapon's base swing speed**, not its hasted speed. Haste raises
 *   rage income by swinging more often, not by making each swing worth more.
 * - **Main-hand specials generate no rage.** The rage aura returns early on
 *   `ProcMaskMeleeMHSpecial`, which is what makes Heroic Strike suppress the rage of the swing it
 *   replaces — see `HEROIC_STRIKE_SUPPRESSES_SWING_RAGE`.
 * - **`damage` is damage actually dealt**, so it is post-armor. Feeding this pre-mitigation damage
 *   overstates rage income by the whole armor mitigation, which against a raid boss is roughly a
 *   third.
 */

/** wowsims `RageFactor`. The divisor that turns damage dealt into rage. */
export const RAGE_CONVERSION_FACTOR = 274.7

/** Damage-proportional term: `damage * 3.75 / RageFactor`. */
export const RAGE_PER_POINT_OF_DAMAGE = 3.75 / RAGE_CONVERSION_FACTOR

/** Swing-speed term, halved exactly as wowsims writes it (`3.5 / 2`, `1.75 / 2`). */
export const MAIN_HAND_HIT_FACTOR = 3.5 / 2
export const OFF_HAND_HIT_FACTOR = 1.75 / 2

/**
 * wowsims passes `EndlessRage ? 1.25 : 1`. This is the default when no talents are supplied; talents
 * now reach the simulation, so a Fury build passes 1.25 through `WhiteSwingRageInput.rageMultiplier`.
 */
export const RAGE_MULTIPLIER_UNTALENTED = 1

/**
 * Rage from damage **taken**, from wowsims `sim/core/rage.go`: `damage * 2.5 / RageFactor`.
 *
 * Note what is absent — `OnSpellHitTaken` applies no `rageMultiplier`, so **Endless Rage does not
 * touch this**. Its tooltip says "more rage from damage dealt", and upstream takes that literally.
 */
export const RAGE_PER_POINT_OF_DAMAGE_TAKEN = 2.5 / RAGE_CONVERSION_FACTOR

/** Sustained rage per second from taking `damagePerSecond` of incoming damage. */
export function rageFromDamageTaken(damagePerSecond: number): number {
  return Math.max(0, damagePerSecond) * RAGE_PER_POINT_OF_DAMAGE_TAKEN
}

/** Rage costs are only meaningful against the cap; a rotation cannot bank more than this. */
export const MAX_RAGE = 100

/*
 * Bloodrage, from wowsims `sim/warrior/bloodrage.go` at the pinned commit.
 *
 * An *ability* rather than a talent, which is why it lives here and not in the talent effects: every
 * warrior has it from level 10, so it is baseline rage income the model was simply missing. Upstream
 * grants 10 rage instantly, plus 3 per rank of Improved Bloodrage, then ten 1-rage ticks a second
 * apart, on a 60-second cooldown.
 *
 * Reduced to a sustained rate on the assumption it is pressed on cooldown, which is what upstream
 * does whenever rage is under 70. That is the same approximation `effectUptime` makes for an on-use
 * trinket, and it is the honest one for an ability with no reason to hold.
 */
export const BLOODRAGE_INSTANT_RAGE = 10
export const BLOODRAGE_RAGE_PER_IMPROVED_RANK = 3
export const BLOODRAGE_TICKS = 10
export const BLOODRAGE_RAGE_PER_TICK = 1
export const BLOODRAGE_COOLDOWN_SECONDS = 60

/**
 * Sustained rage per second from Bloodrage on cooldown.
 *
 * Untalented that is `(10 + 10) / 60`, a third of a rage per second — worth stating plainly because
 * it is far smaller than the ability's 20-rage burst makes it feel, and the gap this was reached for
 * is measured in whole rage per second.
 */
export function bloodrageRagePerSecond(improvedBloodrageRank = 0): number {
  const instant = BLOODRAGE_INSTANT_RAGE + BLOODRAGE_RAGE_PER_IMPROVED_RANK * improvedBloodrageRank
  return (instant + BLOODRAGE_TICKS * BLOODRAGE_RAGE_PER_TICK) / BLOODRAGE_COOLDOWN_SECONDS
}

/**
 * Whether Heroic Strike replacing a main-hand swing also suppresses that swing's rage.
 *
 * It does, in the game and in wowsims. Kept as a named constant because the feedback loop it creates
 * — spending rage reduces rage income — is the single easiest thing to leave out of a rage model,
 * and leaving it out silently overstates every rage dump.
 */
export const HEROIC_STRIKE_SUPPRESSES_SWING_RAGE = true

/** The share of swings ending in each outcome. Mirrors the attack table's shape. */
export type SwingOutcomeMix = {
  miss: number
  dodge: number
  parry: number
  glance: number
  block: number
  crit: number
  hit: number
}

export type WhiteSwingRageInput = {
  /**
   * What one landed, non-crit, non-glancing swing deals **after armor**. The outcome mix below is
   * applied to this, so it should not already be averaged over outcomes.
   */
  damagePerLandedSwing: number
  swingsPerSecond: number
  /** The weapon's base, unhasted speed — the hit-factor term does not scale with haste. */
  baseSwingSpeed: number
  isOffHand: boolean
  outcomes: SwingOutcomeMix
  /** Average damage multiplier of a glancing blow, which is below 1. */
  glanceMultiplier: number
  /**
   * Endless Rage, as `1.25`. Defaults to 1.
   *
   * Applies to the swing-speed term **only**, not to the whole swing — see `rageFromOneSwing`.
   */
  rageMultiplier?: number
}

/** Rage a single swing of this weapon generates on average, including the zero from a miss. */
export function rageFromOneSwing(input: WhiteSwingRageInput): number {
  const { outcomes, glanceMultiplier } = input
  const hitFactor = input.isOffHand ? OFF_HAND_HIT_FACTOR : MAIN_HAND_HIT_FACTOR

  // Everything that is not a miss generates. Dodge and parry pay out on the damage the swing would
  // have dealt, which is why they carry a full multiplier here rather than zero.
  const nonMiss = Math.max(0, 1 - outcomes.miss)

  const damageWeightedOutcomes =
    outcomes.hit +
    outcomes.block +
    outcomes.dodge +
    outcomes.parry +
    outcomes.glance * glanceMultiplier +
    outcomes.crit * MELEE_CRIT_DAMAGE_MULTIPLIER

  const fromDamage = input.damagePerLandedSwing * damageWeightedOutcomes * RAGE_PER_POINT_OF_DAMAGE
  /*
   * Doubled on a crit, so a crit contributes the base factor twice: once as a non-miss, once again.
   *
   * `rageMultiplier` (Endless Rage) belongs to **this term only**, which is easy to get wrong. The
   * tooltip reads "you generate 25% more rage from damage dealt", but upstream writes
   * `damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier` — so the damage-proportional
   * half is untouched and only the swing-speed half scales. Applying it to the whole swing
   * overstates the talent, which an earlier version of this code did.
   */
  const fromSwingSpeed =
    hitFactor * input.baseSwingSpeed * (input.rageMultiplier ?? RAGE_MULTIPLIER_UNTALENTED) * (nonMiss + outcomes.crit)

  return fromDamage + fromSwingSpeed
}

/** Sustained rage per second from a weapon swinging at `swingsPerSecond`. */
export function ragePerSecondFromWeapon(input: WhiteSwingRageInput): number {
  return rageFromOneSwing(input) * input.swingsPerSecond
}

/**
 * How often a rage dump that replaces a main-hand swing can be used, per second.
 *
 * Solved rather than iterated. Each use costs `cost` rage *and* removes `ragePerSuppressedSwing`
 * from income, because the swing it replaces is a main-hand special and generates none:
 *
 * ```
 * uses * cost = surplus - uses * ragePerSuppressedSwing
 * uses = surplus / (cost + ragePerSuppressedSwing)
 * ```
 *
 * Ignoring the second term is what makes a naive rage model too generous: at Phase 2 gear the
 * suppressed swing is worth a meaningful fraction of the ability's own cost.
 *
 * Capped at one per main-hand swing, since it is an on-next-swing ability rather than something that
 * can be pressed freely.
 */
export function rageDumpUsesPerSecond(options: {
  surplusRagePerSecond: number
  cost: number
  ragePerSuppressedSwing: number
  mainHandSwingsPerSecond: number
}): number {
  const { surplusRagePerSecond, cost, ragePerSuppressedSwing, mainHandSwingsPerSecond } = options
  if (surplusRagePerSecond <= 0 || cost <= 0) return 0

  const effectiveCost = cost + (HEROIC_STRIKE_SUPPRESSES_SWING_RAGE ? ragePerSuppressedSwing : 0)
  if (effectiveCost <= 0) return 0

  return Math.min(surplusRagePerSecond / effectiveCost, mainHandSwingsPerSecond)
}
