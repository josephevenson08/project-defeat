import type { CharacterClass, CharacterClassDefinition, Race } from './characterTypes'

export const races: Race[] = ['Human', 'Orc', 'Troll', 'Undead']

export const characterClasses: CharacterClassDefinition[] = [
  {
    className: 'Warrior',
    specs: ['Arms', 'Fury', 'Protection'],
    role: 'Melee DPS',
    baseStats: {
      strength: 92,
      agility: 54,
      stamina: 82,
      intellect: 20,
      spirit: 32,
      attackPower: 120,
      spellPower: 0,
      critRating: 18,
      hitRating: 12,
    },
  },
  {
    className: 'Mage',
    specs: ['Arcane', 'Fire', 'Frost'],
    role: 'Caster DPS',
    baseStats: {
      strength: 18,
      agility: 34,
      stamina: 52,
      intellect: 104,
      spirit: 74,
      attackPower: 0,
      spellPower: 132,
      critRating: 22,
      hitRating: 18,
    },
  },
  {
    className: 'Hunter',
    specs: ['Beast Mastery', 'Marksmanship', 'Survival'],
    role: 'Ranged DPS',
    baseStats: {
      strength: 48,
      agility: 102,
      stamina: 70,
      intellect: 58,
      spirit: 42,
      attackPower: 112,
      spellPower: 0,
      critRating: 24,
      hitRating: 16,
    },
  },
  {
    className: 'Warlock',
    specs: ['Affliction', 'Demonology', 'Destruction'],
    role: 'Caster DPS',
    baseStats: {
      strength: 24,
      agility: 32,
      stamina: 76,
      intellect: 96,
      spirit: 68,
      attackPower: 0,
      spellPower: 126,
      critRating: 19,
      hitRating: 20,
    },
  },
]

export function getClassDefinition(className: CharacterClass) {
  return characterClasses.find((entry) => entry.className === className) ?? characterClasses[0]
}
