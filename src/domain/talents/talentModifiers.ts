import rawTalentEffects from './talentEffects.json' with { type: 'json' }
import { getTalentData } from './sampleTalents'
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
  /**
   * Multiplies all physical damage, ungated. Shaman's Weapon Mastery.
   *
   * Separate from `twoHandedDamageMultiplier` on purpose: Warrior's Two-Handed Weapon Specialization
   * applies only while a two-hander is held, and upstream gates it on `HandType`. One shared field
   * would either hand a dual-wielding Shaman a gate it does not have, or strip Warrior's.
   */
  physicalDamageMultiplier: number
  /** Flat attack power added before any multiplier. Druid's Predatory Strikes. */
  flatAttackPower: number
  /** Added to ranged crit chance only. Hunter's Lethal Shots. */
  rangedCritChance: number
  /** Multiplies ranged white damage. Hunter's Ranged Weapon Specialization. 1 when untalented. */
  rangedDamageMultiplier: number
  /** Multiplies ranged attack speed. Hunter's Serpent's Swiftness. 1 when untalented. */
  rangedAttackSpeedMultiplier: number
  /**
   * Expertise **skill points**, added directly to the attack table's own figure.
   *
   * Skill points rather than rating: the table divides rating by a constant to get points anyway, and
   * upstream grants these talents in points. Converting to rating and back would make the value
   * depend on `EXPERTISE_RATING_PER_SKILL_POINT`, which is not what the talent says.
   */
  expertiseSkillPoints: number
  /** Added to the raw spell crit chance, as a fraction. Arcane Instability, Force of Will, Backlash. */
  spellCritChance: number
  /**
   * Added to the hit chance derived from **rating**, as a fraction, not to the final chance.
   *
   * That placement is the whole point: `computeSpellHitChance` floors the miss chance at 1%, so
   * talent hit has to enter on the same side of that floor as rating does. Added to the result
   * instead, a fully hit-capped caster would be pushed past 100%.
   */
  spellHitChance: number
  /** Multiplies spell damage. Arcane Instability, Playing with Fire. 1 when untalented. */
  spellDamageMultiplier: number
  /**
   * Share of out-of-combat Spirit regen that keeps running **while casting**, as a fraction.
   *
   * The one field here that changes a stat's whole worth rather than a number's size. wowsims applies
   * Spirit regen mid-cast only when `SpiritRegenRateCasting` is non-zero, and that comes solely from
   * talents — Meditation, Arcane Meditation, Intensity. Untalented it is 0, which is why this project
   * correctly priced Spirit at nothing for healers. With points in it, Spirit starts mattering.
   */
  spiritRegenWhileCasting: number
  /**
   * Defense **skill points**, added to the figure derived from Defense rating. Anticipation.
   *
   * Skill points for the same reason `expertiseSkillPoints` uses them: the tank table converts rating
   * to points anyway, and upstream grants this talent in points. One point moves miss, dodge, parry,
   * block and the boss's crit all at once, which is why it is the most valuable of the three.
   */
  defenseSkillPoints: number
  /** Added to the parry chance, as a fraction. Deflection. Warrior and Paladin alike. */
  parryChance: number
  /** Added to the block chance, as a fraction. Warrior's Shield Specialization only — see the ingest. */
  blockChance: number
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
  expertiseSkillPoints: 0,
  physicalDamageMultiplier: 1,
  rangedCritChance: 0,
  flatAttackPower: 0,
  rangedDamageMultiplier: 1,
  rangedAttackSpeedMultiplier: 1,
  spellCritChance: 0,
  spellHitChance: 0,
  spellDamageMultiplier: 1,
  spiritRegenWhileCasting: 0,
  defenseSkillPoints: 0,
  parryChance: 0,
  blockChance: 0,
}

/** Which `TalentModifiers` field each extracted effect kind feeds, and how it combines. */
const ADDITIVE_BY_KIND: Partial<Record<string, keyof TalentModifiers>> = {
  meleeCritChance: 'meleeCritChance',
  meleeHitChance: 'meleeHitChance',
  targetDodgeReduction: 'targetDodgeReduction',
  rageProcsPerMinute: 'rageProcsPerMinute',
  ragePerSecondFlat: 'flatRagePerSecond',
  expertiseSkill: 'expertiseSkillPoints',
  rangedCritChance: 'rangedCritChance',
  flatAttackPower: 'flatAttackPower',
  spellCritChance: 'spellCritChance',
  spellHitChance: 'spellHitChance',
  spiritRegenWhileCasting: 'spiritRegenWhileCasting',
  defenseSkill: 'defenseSkillPoints',
  parryChance: 'parryChance',
  blockChance: 'blockChance',
}

const MULTIPLICATIVE_BY_KIND: Partial<Record<string, keyof TalentModifiers>> = {
  attackPowerMultiplier: 'attackPowerMultiplier',
  offHandDamageMultiplier: 'offHandDamageMultiplier',
  twoHandedDamageMultiplier: 'twoHandedDamageMultiplier',
  physicalDamageMultiplier: 'physicalDamageMultiplier',
  rangedDamageMultiplier: 'rangedDamageMultiplier',
  rangedAttackSpeedMultiplier: 'rangedAttackSpeedMultiplier',
  flurryHaste: 'flurryBonus',
  rageGeneratedMultiplier: 'rageGeneratedMultiplier',
  spellDamageMultiplier: 'spellDamageMultiplier',
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

/**
 * The classes whose talent effects have been ingested.
 *
 * Everything else derives identity modifiers, which is correct but **silent**: a Mage spending all 41
 * points sees the estimate move by exactly nothing. That is the failure this file keeps guarding
 * against in other forms — a real limitation with no way for the reader to learn it — so the class
 * list is exported for the interface to say so out loud.
 */
export const classesWithTalentEffects: readonly string[] = rawTalentEffects.classes

/** Whether a spec's talents can reach the simulation at all yet. */
export function classHasTalentEffects(className: string): boolean {
  return classesWithTalentEffects.includes(className)
}

/** The talents this pass deliberately does not model, and why. Surfaced so the gap stays visible. */
export const unmodelledTalents: readonly { talent: string; reason: string }[] = rawTalentEffects.skipped

/**
 * The unmodelled talents this particular build has actually spent points in.
 *
 * Returns the **specific talent names**, not the grouped labels the ingest files them under: a player
 * who took Impale wants to read "Impale", not "Mace/Sword/Poleaxe Specialization". Several skipped
 * entries cover more than one talent, which is why the labels are split before matching.
 *
 * Empty when nothing applies, and that emptiness is the point — warning someone about talents they do
 * not have is noise, and noise is how a caveat stops being read.
 */
export function unmodelledTalentsInBuild(className: string, points: TalentPoints): readonly string[] {
  const data = getTalentData(className)
  if (!data) return []

  const spent = new Set<string>()
  for (const tree of data.trees) {
    for (const talent of tree.talents) {
      if ((points[talent.id] ?? 0) > 0) spent.add(talent.name)
    }
  }
  if (spent.size === 0) return []

  const taken: string[] = []
  for (const entry of rawTalentEffects.skipped) {
    // Only this class's skips. Warrior and Rogue share talent names, so an unfiltered match would
    // warn a Warrior about a Rogue talent they cannot have taken.
    if (entry.className !== className) continue
    for (const name of entry.talent.split('/').map((part) => part.trim())) {
      if (spent.has(name)) taken.push(name)
    }
  }
  return taken
}
