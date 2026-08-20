import type { CharacterRole, ClassSpecOption, TbcClass, TbcSpec } from './characterTypes'

export const tbcClasses: readonly ClassSpecOption[] = [
  { className: 'Druid', specs: ['Balance', 'Feral', 'Restoration'] },
  { className: 'Hunter', specs: ['Beast Mastery', 'Marksmanship', 'Survival'] },
  { className: 'Mage', specs: ['Arcane', 'Fire', 'Frost'] },
  { className: 'Paladin', specs: ['Holy', 'Protection', 'Retribution'] },
  { className: 'Priest', specs: ['Discipline', 'Holy', 'Shadow'] },
  { className: 'Rogue', specs: ['Assassination', 'Combat', 'Subtlety'] },
  { className: 'Shaman', specs: ['Elemental', 'Enhancement', 'Restoration'] },
  { className: 'Warlock', specs: ['Affliction', 'Demonology', 'Destruction'] },
  { className: 'Warrior', specs: ['Arms', 'Fury', 'Protection'] },
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
