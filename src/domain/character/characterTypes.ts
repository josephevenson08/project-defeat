import type { StatBlock } from '../stats/statTypes'

export type TbcClass =
  | 'Druid'
  | 'Hunter'
  | 'Mage'
  | 'Paladin'
  | 'Priest'
  | 'Rogue'
  | 'Shaman'
  | 'Warlock'
  | 'Warrior'

export type TbcSpec =
  | 'Balance'
  | 'Feral'
  | 'Restoration'
  | 'Beast Mastery'
  | 'Marksmanship'
  | 'Survival'
  | 'Arcane'
  | 'Fire'
  | 'Frost'
  | 'Holy'
  | 'Protection'
  | 'Retribution'
  | 'Discipline'
  | 'Shadow'
  | 'Assassination'
  | 'Combat'
  | 'Subtlety'
  | 'Elemental'
  | 'Enhancement'
  | 'Affliction'
  | 'Demonology'
  | 'Destruction'
  | 'Arms'
  | 'Fury'

export type Faction = 'Alliance' | 'Horde'

export type TbcRace =
  | 'Human'
  | 'Dwarf'
  | 'Night Elf'
  | 'Gnome'
  | 'Draenei'
  | 'Orc'
  | 'Undead'
  | 'Tauren'
  | 'Troll'
  | 'Blood Elf'

export type CharacterRole = 'Physical DPS' | 'Caster DPS' | 'Healer' | 'Tank'

export type CharacterProfile = {
  faction: Faction
  race: TbcRace
  className: TbcClass
  spec: TbcSpec
}

export type ClassSpecOption = {
  className: TbcClass
  specs: readonly TbcSpec[]
  baseStats: StatBlock
}
