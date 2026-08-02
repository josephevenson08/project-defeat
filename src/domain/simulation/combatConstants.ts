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
  /**
   * NOT the blue post's 31.5. That post is dated October 2006, before original TBC shipped, and
   * patch 2.1.0 then cut the parry rating cost by 25% — 31.5 * 0.75 = 23.625. TBC Classic ran on
   * post-2.1 mechanics throughout, and wowsims/tbc hardcodes `ParryRatingPerParryChance = 23.6538`.
   * Every other value in this table matches wowsims to a rounding; parry was the lone outlier at
   * 33% too expensive, which is what gave it away.
   */
  parry: 23.65,
  block: 7.9,
  resilience: 39.4,
} as const

/**
 * Defense Rating needed for one point of Defense Skill at level 70. The blue post's 2.4 is this
 * number rounded; wowsims carries the exact 2.3654.
 */
export const DEFENSE_RATING_PER_SKILL_POINT = 2.3654

/**
 * One point of Defense Skill moves *five* things at once by this fraction: it adds to the player's
 * dodge, parry and block, adds to the attacker's miss chance, and subtracts from the attacker's
 * crit chance. Hence 490 Defense Skill for uncrittable against a level 73 boss — that boss crits
 * for 5.6% raw, and 0.056 / 0.0004 = 140 points above the free 350 a level 70 already has.
 */
export const AVOIDANCE_PER_DEFENSE_SKILL_POINT = 0.0004

/**
 * A crushing blow lands for 150% damage on a flat 15% of swings, and — unlike every other outcome —
 * **no amount of Defense Rating reduces it**. The only defence is pushing it off the bottom of the
 * ordered table with miss/dodge/parry/block, which is precisely why TBC Warriors could reach
 * uncrushable through Shield Block and Paladins and Druids could not.
 */
export const CRUSHING_BLOW_CHANCE = 0.15
export const CRUSHING_BLOW_DAMAGE_MULTIPLIER = 1.5

/** An attacker must be at least this many levels above the defender to crush at all. */
export const CRUSHING_BLOW_LEVEL_GAP = 3

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
