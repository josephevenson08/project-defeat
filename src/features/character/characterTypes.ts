import type { StatBlock } from '../stats/statsTypes'

export type CharacterClass = 'Warrior' | 'Mage' | 'Hunter' | 'Warlock'

export type CharacterSpec =
  | 'Arms'
  | 'Fury'
  | 'Protection'
  | 'Arcane'
  | 'Fire'
  | 'Frost'
  | 'Beast Mastery'
  | 'Marksmanship'
  | 'Survival'
  | 'Affliction'
  | 'Demonology'
  | 'Destruction'

export type Race = 'Human' | 'Orc' | 'Troll' | 'Undead'

export type CharacterProfile = {
  className: CharacterClass
  spec: CharacterSpec
  race: Race
}

export type CharacterClassDefinition = {
  className: CharacterClass
  specs: CharacterSpec[]
  baseStats: StatBlock
  role: 'Melee DPS' | 'Caster DPS' | 'Ranged DPS' | 'Tank'
}
