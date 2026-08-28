/**
 * Rogue poisons, which are the first thing on the physical path that is neither physical nor a swing.
 *
 * **They roll on the spell table and they are Nature damage**, which makes them the second
 * unmitigated source this model has after Retribution's seals — and the reason that distinction was
 * built. A poison that took armour mitigation would lose about a quarter of itself silently against
 * this app's 7,700-armour target.
 *
 * Every constant is read from wowsims/tbc `sim/rogue/poisons.go` at the pinned commit 3301fca5, and
 * the hand each poison sits on from `sim/rogue/presets.go`.
 */

/**
 * **Instant Poison on the main hand, Deadly Poison on the off hand.**
 *
 * Upstream reads this from `Consumes.MainHandImbue` and `Consumes.OffHandImbue` — a player choice,
 * and this app has no weapon-imbue slot to read, exactly the gap Windfury Weapon already names. So a
 * pairing has to be assumed, and rather than reason about which is better this takes the one
 * `presets.go` ships as `FullConsumes`: `WeaponImbueRogueInstantPoison` main hand,
 * `WeaponImbueRogueDeadlyPoison` off hand.
 *
 * **The hand matters, and not only for flavour.** `GetMeleeProcMaskForHands` builds each poison's
 * proc mask from the hands carrying it, so Instant procs off main-hand hits and Deadly off off-hand
 * hits. Swapping them would change both rates, because the two weapons swing at different speeds.
 */
export const INSTANT_POISON_HAND = 'Main Hand'
export const DEADLY_POISON_HAND = 'Off Hand'

/** Instant Poison, spell 26891: a 20% chance on a landed hit for 146-194 Nature damage. */
export const INSTANT_POISON = {
  spellId: 26891,
  baseProcChance: 0.2,
  damage: { min: 146, max: 194 },
} as const

/**
 * Deadly Poison, spell 27186: a 30% chance to apply a stacking damage-over-time effect.
 *
 * **The application itself deals no damage** — upstream gives it `OutcomeFuncMagicHit()` with no
 * base damage, and its only job is to apply, refresh or add a stack. All the damage is in the dot:
 * four ticks three seconds apart, `180/4` a tick, multiplied by the stack count.
 */
export const DEADLY_POISON = {
  spellId: 27186,
  baseProcChance: 0.3,
  ticks: 4,
  tickSeconds: 3,
  damagePerTickPerStack: 180 / 4,
  maxStacks: 5,
} as const

/** Improved Poisons adds 2% to both poisons' proc chance a rank. */
export const IMPROVED_POISONS_PER_RANK = 0.02
/** Vile Poisons multiplies poison damage by 4% a rank. */
export const VILE_POISONS_PER_RANK = 0.04
/** Master Poisoner adds 5% spell hit a rank, to poisons only. */
export const MASTER_POISONER_HIT_PER_RANK = 0.05

export type RoguePoisonInput = {
  /** Landed main-hand swings a second. Instant Poison procs off these. */
  mainHandSwingsPerSecond: number
  /** Landed off-hand swings a second. Deadly Poison procs off these. */
  offHandSwingsPerSecond: number
  /** Chance a poison lands, from the spell table. Poisons are spells, not swings. */
  spellHitChance: number
  /** Spell crit chance, as a fraction. Instant Poison can crit; the dot cannot. */
  spellCritChance: number
  /** Crit multiplier for a spell — 1.5 in TBC before talents. */
  spellCritMultiplier: number
  /** Improved Poisons ranks, as added proc chance. 0 when untalented. */
  bonusProcChance: number
  /** Vile Poisons, as a factor. 1 when untalented. */
  damageMultiplier: number
}

export type RoguePoisonEstimate = {
  instantProcsPerSecond: number
  instantDps: number
  deadlyProcsPerSecond: number
  /** The stacks the dot actually holds in steady state. */
  deadlyStacks: number
  deadlyDps: number
  totalDps: number
}

/**
 * Both poisons, priced per second.
 *
 * **Deadly Poison's steady state is the interesting half.** The dot lasts 12 seconds, every
 * application refreshes it and adds a stack, and it caps at five. So the question is whether the
 * off-hand procs fast enough to reach the cap before the dot falls off — and against a raid boss with
 * a dual-wielding rogue it does, comfortably: a 30% chance on roughly one off-hand swing a second
 * reaches five stacks in about seventeen seconds and then never drops.
 *
 * That is modelled as **the stacks the proc rate can sustain**, capped at five, rather than assumed
 * to be five. A slow off-hand or a heavily missing rogue genuinely holds fewer, and asserting the cap
 * would hide that. The ramp itself is not modelled — the first seventeen seconds of a several-minute
 * fight, in the understating direction.
 *
 * **The dot cannot crit.** Upstream gives its ticks `OutcomeFuncTick()`, which is a plain hit; only
 * Instant Poison rolls `OutcomeFuncMagicHitAndCrit`. Handing the dot a crit multiplier would be the
 * kind of quiet overstatement this table exists to make visible.
 */
export function estimateRoguePoisons(input: RoguePoisonInput): RoguePoisonEstimate {
  const hit = Math.max(0, Math.min(1, input.spellHitChance))
  const instantChance = INSTANT_POISON.baseProcChance + Math.max(0, input.bonusProcChance)
  const deadlyChance = DEADLY_POISON.baseProcChance + Math.max(0, input.bonusProcChance)

  // The swing has to land before the poison can roll: upstream checks `Landed()` first.
  const instantProcsPerSecond = Math.max(0, input.mainHandSwingsPerSecond) * instantChance * hit
  const deadlyProcsPerSecond = Math.max(0, input.offHandSwingsPerSecond) * deadlyChance * hit

  const instantAverage = (INSTANT_POISON.damage.min + INSTANT_POISON.damage.max) / 2
  const critBonus = 1 + input.spellCritChance * (input.spellCritMultiplier - 1)
  const instantDps = instantProcsPerSecond * instantAverage * critBonus * input.damageMultiplier

  /*
   * Stacks the proc rate sustains: an application every `1/rate` seconds against a 12-second window
   * holds about `rate * duration` stacks, capped at the five upstream allows.
   */
  const dotSeconds = DEADLY_POISON.ticks * DEADLY_POISON.tickSeconds
  const deadlyStacks = Math.min(DEADLY_POISON.maxStacks, deadlyProcsPerSecond * dotSeconds)
  // Ticks run whenever the dot is up, which a sustained proc rate keeps it. Damage scales by stacks.
  const dotUp = deadlyProcsPerSecond > 0 ? 1 : 0
  const deadlyDps =
    (dotUp * deadlyStacks * DEADLY_POISON.damagePerTickPerStack) / DEADLY_POISON.tickSeconds * input.damageMultiplier

  return {
    instantProcsPerSecond,
    instantDps: Math.max(0, instantDps),
    deadlyProcsPerSecond,
    deadlyStacks,
    deadlyDps: Math.max(0, deadlyDps),
    totalDps: Math.max(0, instantDps) + Math.max(0, deadlyDps),
  }
}
