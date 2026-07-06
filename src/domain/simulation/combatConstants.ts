/**
 * TBC Classic (Burning Crusade, level cap 70) combat-rating and attack-table constants.
 * Sourced from the official Blizzard "Combat Ratings: Level 70 Conversions" blue post plus
 * cross-referenced community math (see notes on individual exports for anything less certain).
 * Do NOT reuse Wrath/Cata-era numbers here — several of these constants changed across expansions
 * (e.g. avoidance diminishing returns did not exist until patch 3.0.2, well after TBC).
 */

/** Rating needed for +1% of the named effect, at level 70. */
export const RATING_PER_PERCENT = {
  meleeHit: 15.8,
  spellHit: 12.6,
  meleeCrit: 22.1,
  spellCrit: 22.1,
  meleeHaste: 15.8,
  spellHaste: 15.8,
  dodge: 18.9,
  parry: 31.5,
  block: 7.9,
  resilience: 39.4,
} as const

/** Rating needed for one point of Expertise Skill (not directly a percent). Community math, not from the official blue post, but consistent across independent sources. */
export const EXPERTISE_RATING_PER_SKILL_POINT = 3.9423

/** Each Expertise Skill point reduces the target's dodge AND parry chance by this fraction, simultaneously, until each hits zero. */
export const EXPERTISE_PERCENT_PER_SKILL_POINT = 0.0025

/** Level*5, and TBC removed weapon-skill-from-gear entirely, so this is always the attacker's effective weapon skill at level 70. */
export const PLAYER_LEVEL_70_SKILL = 350

/** Standard "14 attack power = 1 DPS" white-damage normalization constant (melee and, per this model, ranged). */
export const AP_PER_DPS = 14

/** Direct-damage spell coefficient = castTime / this baseline (3.5s). */
export const SPELL_COEFFICIENT_BASE_CAST_TIME = 3.5

/** Instant-cast spells use this fixed cast time in the coefficient formula instead of 0. */
export const SPELL_COEFFICIENT_INSTANT_BASELINE = 1.5

/** DoT coefficient = duration / this baseline (15s). */
export const DOT_COEFFICIENT_BASE_DURATION = 15

/** Standard TBC baseline spell crit damage multiplier (talents can raise this per-spec; not modeled here). */
export const SPELL_CRIT_DAMAGE_MULTIPLIER = 1.5

/** Standard melee/ranged crit damage multiplier (2x normal damage). */
export const MELEE_CRIT_DAMAGE_MULTIPLIER = 2

/** Armor damage-reduction hard cap. */
export const ARMOR_MITIGATION_CAP = 0.75

/** DR% = armor / (armor + K), where K depends on the ATTACKER's level (confirmed via algebraic cross-check of two independently phrased community formulas). */
export function armorMitigationConstant(attackerLevel: number) {
  return 467.5 * attackerLevel - 22167.5
}

export function ratingToFraction(rating: number, ratingPerPercent: number) {
  return rating / ratingPerPercent / 100
}
