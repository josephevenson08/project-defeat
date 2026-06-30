import { emptyStats, type StatBlock } from '../stats/statTypes'
import type { CharacterRole, ClassSpecOption, TbcClass, TbcSpec } from './characterTypes'

function stats(values: Partial<StatBlock>): StatBlock {
  return { ...emptyStats, ...values }
}

export const tbcClasses: readonly ClassSpecOption[] = [
  { className: 'Druid', specs: ['Balance', 'Feral', 'Restoration'], baseStats: stats({ strength: 52, agility: 58, stamina: 72, intellect: 82, spirit: 78, spellPower: 72, healingPower: 86, armor: 950 }) },
  { className: 'Hunter', specs: ['Beast Mastery', 'Marksmanship', 'Survival'], baseStats: stats({ strength: 48, agility: 102, stamina: 70, intellect: 58, spirit: 42, attackPower: 88, rangedAttackPower: 124, critRating: 24, hitRating: 16 }) },
  { className: 'Mage', specs: ['Arcane', 'Fire', 'Frost'], baseStats: stats({ stamina: 52, intellect: 104, spirit: 74, spellPower: 132, spellCritRating: 22, spellHitRating: 18 }) },
  { className: 'Paladin', specs: ['Holy', 'Protection', 'Retribution'], baseStats: stats({ strength: 76, stamina: 84, intellect: 72, spirit: 48, attackPower: 92, healingPower: 92, defenseRating: 20, blockRating: 18, armor: 1200 }) },
  { className: 'Priest', specs: ['Discipline', 'Holy', 'Shadow'], baseStats: stats({ stamina: 58, intellect: 98, spirit: 92, spellPower: 96, healingPower: 124, spellCritRating: 14, spellHitRating: 12, mp5: 8 }) },
  { className: 'Rogue', specs: ['Assassination', 'Combat', 'Subtlety'], baseStats: stats({ strength: 62, agility: 112, stamina: 68, attackPower: 132, critRating: 30, hitRating: 20, expertiseRating: 8 }) },
  { className: 'Shaman', specs: ['Elemental', 'Enhancement', 'Restoration'], baseStats: stats({ strength: 66, agility: 64, stamina: 74, intellect: 80, spirit: 52, attackPower: 84, spellPower: 86, healingPower: 98, spellCritRating: 18, hitRating: 12 }) },
  { className: 'Warlock', specs: ['Affliction', 'Demonology', 'Destruction'], baseStats: stats({ stamina: 76, intellect: 96, spirit: 68, spellPower: 126, spellCritRating: 19, spellHitRating: 20 }) },
  { className: 'Warrior', specs: ['Arms', 'Fury', 'Protection'], baseStats: stats({ strength: 92, agility: 54, stamina: 82, attackPower: 120, critRating: 18, hitRating: 12, defenseRating: 24, armor: 1400 }) },
]

export const tbcClassNames = tbcClasses.map((entry) => entry.className)

export function getClassDefinition(className: TbcClass) {
  return tbcClasses.find((entry) => entry.className === className) ?? tbcClasses[0]
}

export function getRoleForSpec(className: TbcClass, spec: TbcSpec): CharacterRole {
  if (className === 'Warrior' && spec === 'Protection') return 'Tank'
  if (className === 'Paladin' && spec === 'Protection') return 'Tank'
  if (className === 'Druid' && spec === 'Balance') return 'Caster DPS'
  if (className === 'Druid' && spec === 'Restoration') return 'Healer'
  if (className === 'Druid' && spec === 'Feral') return 'Physical DPS'
  if (className === 'Paladin' && spec === 'Holy') return 'Healer'
  if (className === 'Priest' && (spec === 'Discipline' || spec === 'Holy')) return 'Healer'
  if (className === 'Shaman' && spec === 'Restoration') return 'Healer'
  if (className === 'Hunter') return 'Physical DPS'
  if (className === 'Rogue') return 'Physical DPS'
  if (className === 'Warrior') return 'Physical DPS'
  if (className === 'Paladin' && spec === 'Retribution') return 'Physical DPS'
  if (className === 'Shaman' && spec === 'Enhancement') return 'Physical DPS'
  return 'Caster DPS'
}
