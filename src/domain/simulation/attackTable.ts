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

export type DefenderAvoidanceBaseline = {
  /** The attacker's chance to miss the player outright. */
  miss: number
  /** Added to the player's Agility- and rating-derived dodge. Negative against a higher-level attacker — dodge has no flat base of its own. */
  dodgeLevelPenalty: number
  /** Only reachable by a parry-capable class. */
  parry: number
  /** Only reachable with a shield equipped. */
  block: number
}

/**
 * The **defender** side of the table: what happens when the boss swings at the player.
 *
 * This is deliberately not `computeDodgeChance`/`computeParryChance` run backwards. Those are the
 * attacker-side helpers — the target's chance to avoid the *player's* swing — and reusing them here
 * is exactly the bug this function replaces. The two directions are genuinely different tables in
 * TBC, and the level gap enters them with **opposite sign**: a level 70 player fighting a level 73
 * boss is the under-skilled party both ways, so the boss avoids more and the player avoids less.
 *
 * Miss, parry and block each start at a flat 5% and lose 0.2% per attacker level above the player,
 * bottoming out at the +3 row (the game's table has no entries beyond that). Dodge has no flat base
 * at all — it is built from Agility and dodge rating, and the level gap only ever subtracts.
 *
 * Sourced from wowsims/tbc `sim/core/target.go`, `NewAttackTable()`'s defender branch. The -0.2% per
 * level is the same 0.04%-per-skill-point figure that Defense Skill uses, with the sign flipped
 * (3 levels * 5 skill * 0.04% = 0.6%), which is a useful internal consistency check.
 */
export function buildDefenderAvoidanceBaseline(attackerLevel: number, defenderLevel = 70): DefenderAvoidanceBaseline {
  const levelsAbove = Math.min(3, Math.max(0, attackerLevel - defenderLevel))
  const perLevel = 0.002
  const base = 0.05 - levelsAbove * perLevel

  return {
    miss: base,
    dodgeLevelPenalty: -levelsAbove * perLevel,
    parry: base,
    block: base,
  }
}

export type SpecialAttackTable = Pick<WhiteAttackTable, 'miss' | 'dodge' | 'parry' | 'block' | 'crit' | 'hit'>

/**
 * "Yellow" instant special attacks (Mortal Strike, Sinister Strike, Shield Slam...) differ from
 * white swings in two ways that both matter a lot:
 *
 * 1. **They cannot glance.** Glancing blows only ever apply to auto-attacks, so a special keeps its
 *    full damage on an ordinary hit where a white swing would have been reduced.
 * 2. **They do not take the dual-wield miss penalty.** That penalty applies to white swings only, so
 *    a dual-wielding rogue's specials miss at the normal single-weapon rate, not the ~24% white rate.
 *
 * Getting either wrong would systematically misprice every melee spec's yellow damage, so this is a
 * separate table rather than a flag on the white one.
 */
export function buildSpecialAttackTable(inputs: Omit<WhiteAttackTableInputs, 'dualWield'>): SpecialAttackTable {
  const { skillDiff, expertiseSkillPoints, missReduction, rawCritChance } = inputs

  const missChance = Math.max(0, computeBaseMissChance(skillDiff) - missReduction)
  const dodgeChance = computeDodgeChance(skillDiff, expertiseSkillPoints)
  const parryChance = computeParryChance(skillDiff, expertiseSkillPoints)
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
  const block = take(blockChance)
  const crit = take(critChance)
  const hit = remaining

  return { miss, dodge, parry, block, crit, hit }
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
