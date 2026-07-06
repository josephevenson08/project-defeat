/**
 * Base spell miss chance (0 spell hit rating) by attacker-to-target level difference. The +2 level
 * anchor is less firmly sourced than the others (flagged); the +3 anchor is the one that matters
 * for standard raid-boss encounters (level 70 caster vs. level 73 boss).
 */
const BASE_SPELL_MISS_BY_LEVEL_DIFF: Record<number, number> = {
  0: 0.04,
  1: 0.06,
  2: 0.11,
  3: 0.17,
  5: 0.39,
}

export function computeBaseSpellMissChance(levelDiff: number) {
  if (levelDiff in BASE_SPELL_MISS_BY_LEVEL_DIFF) return BASE_SPELL_MISS_BY_LEVEL_DIFF[levelDiff]
  if (levelDiff <= 0) return BASE_SPELL_MISS_BY_LEVEL_DIFF[0]
  if (levelDiff >= 5) return BASE_SPELL_MISS_BY_LEVEL_DIFF[5]
  if (levelDiff < 3) return BASE_SPELL_MISS_BY_LEVEL_DIFF[2]
  return BASE_SPELL_MISS_BY_LEVEL_DIFF[3] + (BASE_SPELL_MISS_BY_LEVEL_DIFF[5] - BASE_SPELL_MISS_BY_LEVEL_DIFF[3]) * ((levelDiff - 3) / 2)
}

/** Spell hit has a hard 1% miss floor (99% max hit) regardless of hit rating. */
export function computeSpellHitChance(levelDiff: number, spellHitChanceFromRating: number) {
  const baseMiss = computeBaseSpellMissChance(levelDiff)
  const miss = Math.max(0.01, baseMiss - spellHitChanceFromRating)
  return 1 - miss
}

/**
 * No evidence found of level-based spell crit suppression in TBC (unlike melee); spell crit and
 * spell hit appear to be independent, unsuppressed rolls. Flagged as absence-of-evidence, not proof.
 */
export function computeSpellCritChance(rawSpellCritChance: number) {
  return Math.max(0, rawSpellCritChance)
}
