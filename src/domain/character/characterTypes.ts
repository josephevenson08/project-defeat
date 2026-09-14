import type { Profession } from '../professions/professionTypes'


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
  /**
   * The primary professions this character carries, at most two.
   *
   * **Optional, and absent is a real answer rather than a gap.** A character with no professions is
   * a character who gets no profession-locked enchant, which is what the game does — so this
   * defaults to nothing rather than to a guess, and every existing saved build loads unchanged.
   *
   * In The Burning Crusade exactly one profession puts an always-on stat bonus on the character
   * sheet, and it is Enchanting's two ring enchants. Everything else a profession gives is access —
   * bind-on-pickup gear, or a consumable only you can make — which is why this field only has to
   * reach the enchant filter. `professionPayoffs.ts` carries the full picture and the sourcing.
   */
  professions?: readonly Profession[]
}

export type ClassSpecOption = {
  className: TbcClass
  specs: readonly TbcSpec[]
}
