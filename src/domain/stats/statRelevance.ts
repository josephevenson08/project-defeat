import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import type { StatBlock } from './statTypes'

/**
 * Which stats actually mean something for a given spec.
 *
 * The rail shows 26 rows. On a Fury Warrior roughly half of them carry nothing — the entire Spell
 * group, Feral attack power, and six defensive rows reading 0 — on the one surface that is always on
 * screen. Worse than uninformative: a Warrior showing **Healing Power 411** reads as a bug rather
 * than as an irrelevant row.
 *
 * Two rules keep this honest rather than opinionated:
 *
 * 1. **Nothing is deleted, only defaulted away.** The rail has a "show all" toggle, so a spec where
 *    this file's judgement is arguable — Enhancement Shaman does get something from spell power —
 *    costs one click, not a missing number.
 * 2. **Attributes and Armor are never hidden.** The in-game character sheet shows all five
 *    attributes and Armor to every class, so hiding them would be a bigger surprise than the noise
 *    it saves.
 */

/** Stats no spec should ever have hidden — the top of the character sheet, in the game and here. */
const ALWAYS_SHOWN: ReadonlySet<keyof StatBlock> = new Set([
  'strength',
  'agility',
  'stamina',
  'intellect',
  'spirit',
  'armor',
])

/** Melee/ranged output. Shown to the roles that swing something. */
const PHYSICAL: ReadonlySet<keyof StatBlock> = new Set([
  'attackPower',
  'rangedAttackPower',
  'feralAttackPower',
  'hitRating',
  'critRating',
  'hasteRating',
  'expertiseRating',
  'armorPenetration',
])

/** Spell output and mana. Shown to the roles that cast. */
const SPELL: ReadonlySet<keyof StatBlock> = new Set([
  'spellPower',
  'healingPower',
  'spellHitRating',
  'spellCritRating',
  'spellHasteRating',
  'mp5',
])

/** Mitigation and avoidance beyond plain armor. Tanks only. */
const DEFENSIVE: ReadonlySet<keyof StatBlock> = new Set([
  'defenseRating',
  'dodgeRating',
  'parryRating',
  'blockRating',
  'blockValue',
  'resilienceRating',
])

const ROLE_GROUPS: Record<CharacterRole, ReadonlyArray<ReadonlySet<keyof StatBlock>>> = {
  'Physical DPS': [PHYSICAL],
  'Caster DPS': [SPELL],
  Healer: [SPELL],
  // A tank both swings and is hit, so it is the one role that needs two of the three.
  Tank: [PHYSICAL, DEFENSIVE],
}

/**
 * Whether one stat is worth showing for this character.
 *
 * The two class-specific carve-outs are stats that are structurally zero for everyone else rather
 * than merely small: `feralAttackPower` only exists in Druid forms, and `rangedAttackPower` only
 * drives damage for a Hunter — every other class's ranged slot is a stat stick they never fire.
 */
function isStatRelevant(stat: keyof StatBlock, role: CharacterRole, className: TbcClass, spec: TbcSpec): boolean {
  if (ALWAYS_SHOWN.has(stat)) return true

  if (stat === 'feralAttackPower') return className === 'Druid' && spec === 'Feral'
  if (stat === 'rangedAttackPower') return className === 'Hunter'
  // Healing power on a Shadow Priest is the same kind of noise it is on a Warrior.
  if (stat === 'healingPower') return role === 'Healer'

  return ROLE_GROUPS[role].some((group) => group.has(stat))
}

/** How the rail filters each of its groups; a group left with no rows disappears entirely. */
export function relevantStats(
  stats: ReadonlyArray<keyof StatBlock>,
  role: CharacterRole,
  className: TbcClass,
  spec: TbcSpec,
): ReadonlyArray<keyof StatBlock> {
  return stats.filter((stat) => isStatRelevant(stat, role, className, spec))
}
