import { EXPERTISE_PERCENT_PER_SKILL_POINT, PLAYER_LEVEL_70_SKILL } from './combatConstants'

export type WhiteAttackTable = {
  miss: number
  dodge: number
  parry: number
  glance: number
  block: number
  crit: number
  hit: number
}

export type GlanceDamageRange = {
  low: number
  high: number
}

/** TargetLevel*5 minus the attacker's effective weapon skill (always level*5 at 70, since TBC removed weapon skill from gear). */
export function computeSkillDiff(targetLevel: number, attackerSkill: number = PLAYER_LEVEL_70_SKILL) {
  return targetLevel * 5 - attackerSkill
}

export function computeBaseMissChance(skillDiff: number) {
  const perPoint = skillDiff >= 11 ? 0.002 : 0.001
  return Math.max(0, 0.05 + skillDiff * perPoint)
}

/**
 * Dual-wield adds a large miss penalty on top of the single-weapon base. Sources disagree on the
 * exact mechanism (flat +19% vs. a `p*0.8+0.2` transform) but agree on the resulting ballpark
 * (high-20s% total miss vs. a raid boss), so this is flagged as an approximation.
 */
export function applyDualWieldMissPenalty(baseMissChance: number) {
  return baseMissChance + 0.19
}

export function computeDodgeChance(skillDiff: number, expertiseSkillPoints = 0) {
  const base = 0.05 + skillDiff * 0.001
  return Math.max(0, base - expertiseSkillPoints * EXPERTISE_PERCENT_PER_SKILL_POINT)
}

export function computeParryChance(skillDiff: number, expertiseSkillPoints = 0) {
  const perPoint = skillDiff >= 11 ? 0.006 : 0.001
  const base = 0.05 + skillDiff * perPoint
  return Math.max(0, base - expertiseSkillPoints * EXPERTISE_PERCENT_PER_SKILL_POINT)
}

/** Approximate coefficients; one alternate source's numbers diverge meaningfully at this skill differential, so treat as needsVerification. */
export function computeGlanceChance(skillDiff: number) {
  return Math.max(0, 0.06 + skillDiff * 0.012)
}

export function computeGlanceDamageRange(skillDiff: number): GlanceDamageRange {
  const low = skillDiff >= 11 ? 1.4 - 0.05 * skillDiff : 1.3 - 0.05 * skillDiff
  const high = skillDiff >= 11 ? 1.3 - 0.03 * skillDiff : 1.2 - 0.03 * skillDiff
  return {
    low: Math.min(0.91, Math.max(0.01, low)),
    high: Math.min(0.99, Math.max(0.2, high)),
  }
}

/** A mob/boss's own chance to block the player's attack; capped at a flat 5%. */
export function computeTargetBlockChance(skillDiff: number) {
  return Math.min(0.05, Math.max(0, 0.05 + skillDiff * 0.001))
}

/** Crit suppression vs a higher-level target: -0.04% raw crit per point of skill deficit. */
export function applyMeleeCritSuppression(rawCritChance: number, skillDiff: number) {
  return Math.max(0, rawCritChance - skillDiff * 0.0004)
}

export type WhiteAttackTableInputs = {
  skillDiff: number
  dualWield: boolean
  expertiseSkillPoints: number
  missReduction: number
  rawCritChance: number
}

/**
 * Builds the full white (auto-attack) table in fixed precedence order — Miss, Dodge, Parry,
 * Glance, Block, Crit, Hit — truncating lower-precedence entries once the running total reaches 100%.
 */
export function buildWhiteAttackTable(inputs: WhiteAttackTableInputs): WhiteAttackTable {
  const { skillDiff, dualWield, expertiseSkillPoints, missReduction, rawCritChance } = inputs

  let missChance = computeBaseMissChance(skillDiff)
  if (dualWield) missChance = applyDualWieldMissPenalty(missChance)
  missChance = Math.max(0, missChance - missReduction)

  const dodgeChance = computeDodgeChance(skillDiff, expertiseSkillPoints)
  const parryChance = computeParryChance(skillDiff, expertiseSkillPoints)
  const glanceChance = computeGlanceChance(skillDiff)
  const blockChance = computeTargetBlockChance(skillDiff)
  const critChance = applyMeleeCritSuppression(rawCritChance, skillDiff)

  let remaining = 1
  const take = (amount: number) => {
    const taken = Math.max(0, Math.min(amount, remaining))
    remaining -= taken
    return taken
  }

  const miss = take(missChance)
  const dodge = take(dodgeChance)
  const parry = take(parryChance)
  const glance = take(glanceChance)
  const block = take(blockChance)
  const crit = take(critChance)
  const hit = remaining

  return { miss, dodge, parry, glance, block, crit, hit }
}

/**
 * Ranged attacks from outside melee range cannot be dodged, parried, or blocked; this models the
 * common "hunter kiting a raid boss" case as a simplified miss/crit/hit-only table.
 */
export function buildRangedAttackTable(inputs: { skillDiff: number; missReduction: number; rawCritChance: number }): Pick<WhiteAttackTable, 'miss' | 'crit' | 'hit'> {
  const missChance = Math.max(0, computeBaseMissChance(inputs.skillDiff) - inputs.missReduction)
  const critChance = applyMeleeCritSuppression(inputs.rawCritChance, inputs.skillDiff)

  let remaining = 1
  const take = (amount: number) => {
    const taken = Math.max(0, Math.min(amount, remaining))
    remaining -= taken
    return taken
  }

  const miss = take(missChance)
  const crit = take(critChance)
  const hit = remaining

  return { miss, crit, hit }
}
