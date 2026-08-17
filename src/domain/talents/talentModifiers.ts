import rawTalentEffects from './talentEffects.json' with { type: 'json' }
import type { TalentPoints } from './talentTypes'

/**
 * What a talent build changes about the character, collapsed into one record.
 *
 * Shaped after `aggregateTargetDebuffs` rather than after `StatBlock`, and that is the load-bearing
 * choice. `StatBlock` holds flat amounts and *ratings*; almost nothing a talent does fits there. A
 * talent grants crit **chance**, not crit rating — the conversion only runs one way — and multiplies
 * damage, attack speed and rage income, none of which is a stat at all. The debuff record already
 * solved the same problem: a small typed set of fields, each applied at one named point in the
 * calculation, where a field with nothing to apply to contributes nothing by construction.
 *
 * Every field is an identity value when no points are spent, so an empty tree — which is the default
 * — has to reproduce the previous numbers exactly. A test pins that.
 */
export type TalentModifiers = {
  /** Added to the raw melee crit chance, as a fraction. Cruelty. */
  meleeCritChance: number
  /** Added to the melee hit chance, as a fraction. Precision. */
  meleeHitChance: number
  /** Subtracted from the target's dodge chance, as a fraction. Weapon Mastery. */
  targetDodgeReduction: number
  /** Multiplies total attack power. Improved Berserker Stance. 1 when untalented. */
  attackPowerMultiplier: number
  /** Multiplies off-hand white damage. Dual Wield Specialization. 1 when untalented. */
  offHandDamageMultiplier: number
  /** Multiplies all physical damage, but only behind a two-handed main hand. 1 when untalented. */
  twoHandedDamageMultiplier: number
  /** Multiplies rage generated from damage. Endless Rage. 1 when untalented. */
  rageGeneratedMultiplier: number
  /** Rage per second that does not depend on swinging. Anger Management. */
  flatRagePerSecond: number
  /** Procs per minute, each granting 1 rage. Unbridled Wrath. */
  rageProcsPerMinute: number
  /** Melee speed multiplier while the Flurry aura holds a stack. 1 when untalented. */
  flurryBonus: number
}

export const noTalentModifiers: TalentModifiers = {
  meleeCritChance: 0,
  meleeHitChance: 0,
  targetDodgeReduction: 0,
  attackPowerMultiplier: 1,
  offHandDamageMultiplier: 1,
  twoHandedDamageMultiplier: 1,
  rageGeneratedMultiplier: 1,
  flatRagePerSecond: 0,
  rageProcsPerMinute: 0,
  flurryBonus: 1,
}

/** Which `TalentModifiers` field each extracted effect kind feeds, and how it combines. */
const ADDITIVE_BY_KIND: Partial<Record<string, keyof TalentModifiers>> = {
  meleeCritChance: 'meleeCritChance',
  meleeHitChance: 'meleeHitChance',
  targetDodgeReduction: 'targetDodgeReduction',
  rageProcsPerMinute: 'rageProcsPerMinute',
  ragePerSecondFlat: 'flatRagePerSecond',
}

const MULTIPLICATIVE_BY_KIND: Partial<Record<string, keyof TalentModifiers>> = {
  attackPowerMultiplier: 'attackPowerMultiplier',
  offHandDamageMultiplier: 'offHandDamageMultiplier',
  physicalDamageMultiplier: 'twoHandedDamageMultiplier',
  flurryHaste: 'flurryBonus',
  rageGeneratedMultiplier: 'rageGeneratedMultiplier',
}

/*
 * Every `kind` the ingest can emit has to appear in exactly one of the two maps above. A kind in
 * neither is silently dropped — Endless Rage was, and the only reason it surfaced is that a test
 * asserted its value rather than just asserting DPS went up. This check turns that class of mistake
 * from a wrong number into a failed import.
 */
const DISPATCHED_KINDS = new Set([...Object.keys(ADDITIVE_BY_KIND), ...Object.keys(MULTIPLICATIVE_BY_KIND)])
const undispatched = rawTalentEffects.effects.map((effect) => effect.kind).filter((kind) => !DISPATCHED_KINDS.has(kind))
if (undispatched.length > 0) {
  throw new Error(
    `talentModifiers: ingested effect kinds with no destination: ${[...new Set(undispatched)].join(', ')}. ` +
      'Add each to ADDITIVE_BY_KIND or MULTIPLICATIVE_BY_KIND, or it will contribute nothing.',
  )
}

/**
 * Collapses a point allocation into the modifiers it produces.
 *
 * Reads the ingested effects rather than a hand-written table, so the numbers stay traceable to
 * `sim/warrior/talents.go` at the pinned commit. A talent with no ingested effect contributes
 * nothing — which is correct rather than lossy, because the ingest reports what it skipped and why.
 */
export function deriveTalentModifiers(points: TalentPoints): TalentModifiers {
  const modifiers: TalentModifiers = { ...noTalentModifiers }

  for (const effect of rawTalentEffects.effects) {
    const rank = points[effect.talentId] ?? 0
    if (rank <= 0) continue

    const additive = ADDITIVE_BY_KIND[effect.kind]
    if (additive) {
      // A flat effect is granted whole for having any rank at all; a per-rank one scales.
      modifiers[additive] += effect.flatValue ?? (effect.perRank ?? 0) * rank
      continue
    }

    const multiplicative = MULTIPLICATIVE_BY_KIND[effect.kind]
    if (multiplicative) {
      modifiers[multiplicative] *= effect.flatValue ?? 1 + (effect.perRank ?? 0) * rank
    }
  }

  return modifiers
}

/**
 * Flurry's expected attack-speed multiplier, in closed form.
 *
 * **This is the one piece the ingest cannot hand over.** wowsims models Flurry as a 3-stack aura on
 * an event timeline: any melee crit sets the stacks to 3, and only a white hit removes one. This
 * simulator has no timeline, so the aura has to become an expected value — the same judgement
 * `effectUptime` already makes for item procs, and it needs stating rather than hiding.
 *
 * Treat the stack count as a Markov chain stepped by each white swing. With crit chance `c` and
 * `q = 1 - c`, a swing either crits (→ 3 stacks) or does not (→ one fewer). The stationary
 * distribution is
 *
 *     π₃ = c,  π₂ = qc,  π₁ = q²c,  π₀ = q³
 *
 * which sums to `c(1 + q + q²) + q³ = (1 - q³) + q³ = 1`, so it is a genuine distribution rather
 * than an approximation that happens to look like one. The aura is active whenever stacks > 0, so a
 * swing is hasted with probability `1 - q³`.
 *
 * The multiplier is then time-weighted rather than swing-weighted, because a hasted swing occupies
 * less of the fight: the mean interval is `π₀·T + (1 - π₀)·T/bonus`, so speed scales by
 * `1 / (π₀ + (1 - π₀)/bonus)`.
 *
 * **It is deliberately a lower bound.** Special attacks also refresh the stacks to 3 and never
 * consume one, and a miss or dodge does not appear to consume one either — both push real uptime
 * above this. Understating is the honest direction for a number that exists to correct an
 * already-understated DPS figure.
 */
export function flurrySpeedMultiplier(flurryBonus: number, meleeCritChance: number): number {
  if (flurryBonus <= 1) return 1

  const crit = Math.min(1, Math.max(0, meleeCritChance))
  const noCrit = 1 - crit
  const idleShare = noCrit ** 3

  return 1 / (idleShare + (1 - idleShare) / flurryBonus)
}

/** The talents this pass deliberately does not model, and why. Surfaced so the gap stays visible. */
export const unmodelledTalents: readonly { talent: string; reason: string }[] = rawTalentEffects.skipped
