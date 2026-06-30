import type { GearSlot } from './gearSlots'
import type { GearItem } from './itemTypes'

export const sampleItems: readonly GearItem[] = [
  { id: 'prototype-adventurer-helm', name: 'Prototype Adventurer Helm', slot: 'Head', quality: 'Rare', source: 'Other', phase: 1, stats: { stamina: 18, critRating: 8 }, sockets: ['Meta', 'Red'], socketBonus: { hitRating: 4 } },
  { id: 'seer-pendant', name: "Seer's Pendant", slot: 'Neck', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { intellect: 14, spellPower: 18, spellCritRating: 6 } },
  { id: 'battle-tuned-shoulderguards', name: 'Battle-Tuned Shoulderguards', slot: 'Shoulders', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { strength: 14, agility: 10, attackPower: 22 } },
  { id: 'cloak-of-practice', name: 'Cloak of Practice', slot: 'Back', quality: 'Uncommon', source: 'Quest', phase: 1, stats: { stamina: 12, dodgeRating: 6 } },
  { id: 'runed-battle-vest', name: 'Runed Battle Vest', slot: 'Chest', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { agility: 12, stamina: 20, hitRating: 8 }, sockets: ['Red', 'Yellow', 'Blue'], socketBonus: { critRating: 4 } },
  { id: 'spellfire-training-robe', name: 'Spellfire Training Robe', slot: 'Chest', quality: 'Rare', source: 'Crafted', phase: 1, stats: { intellect: 18, spellPower: 34, spellHitRating: 8 }, sockets: ['Red', 'Yellow'], socketBonus: { spellPower: 5 } },
  { id: 'bulwark-chestguard', name: 'Bulwark Chestguard', slot: 'Chest', quality: 'Rare', source: 'Heroic Dungeon', phase: 1, stats: { stamina: 32, defenseRating: 18, armor: 620 } },
  { id: 'wrists-of-focus', name: 'Wrists of Focus', slot: 'Wrists', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { spellPower: 16, spellHitRating: 8 } },
  { id: 'gloves-of-focus', name: 'Gloves of Focus', slot: 'Hands', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { intellect: 14, spellPower: 22, spellCritRating: 6 } },
  { id: 'healers-grace-gloves', name: "Healer's Grace Gloves", slot: 'Hands', quality: 'Rare', source: 'Reputation', phase: 1, stats: { intellect: 14, healingPower: 38, mp5: 4 } },
  { id: 'girdle-of-testing', name: 'Girdle of Testing', slot: 'Waist', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { strength: 12, hitRating: 8, expertiseRating: 6 } },
  { id: 'legguards-of-practice', name: 'Legguards of Practice', slot: 'Legs', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { strength: 10, agility: 10, stamina: 18 }, sockets: ['Red', 'Blue'], socketBonus: { stamina: 4 } },
  { id: 'boots-of-surefooting', name: 'Boots of Surefooting', slot: 'Feet', quality: 'Rare', source: 'Crafted', phase: 1, stats: { stamina: 16, hitRating: 10, critRating: 6 } },
  { id: 'band-of-balance', name: 'Band of Balance', slot: 'Finger 1', quality: 'Rare', source: 'Quest', phase: 1, unique: true, stats: { spellPower: 14, healingPower: 22, mp5: 3 } },
  { id: 'signet-of-pressure', name: 'Signet of Pressure', slot: 'Finger 2', quality: 'Rare', source: 'Dungeon', phase: 1, unique: true, stats: { attackPower: 28, critRating: 8 } },
  { id: 'badge-of-momentum', name: 'Badge of Momentum', slot: 'Trinket 1', quality: 'Rare', source: 'Vendor', phase: 1, unique: true, stats: { attackPower: 32, hitRating: 8 } },
  { id: 'charm-of-embers', name: 'Charm of Embers', slot: 'Trinket 2', quality: 'Rare', source: 'Dungeon', phase: 1, unique: true, stats: { spellPower: 30, spellCritRating: 8 } },
  { id: 'training-sword', name: 'Training Sword', slot: 'Main Hand', quality: 'Rare', source: 'Vendor', phase: 1, stats: { attackPower: 40, critRating: 10 } },
  { id: 'apprentice-focus-staff', name: 'Apprentice Focus Staff', slot: 'Main Hand', quality: 'Rare', source: 'Vendor', phase: 1, stats: { spellPower: 54, spellHitRating: 10 } },
  { id: 'shield-of-rehearsal', name: 'Shield of Rehearsal', slot: 'Off Hand', quality: 'Rare', source: 'Dungeon', phase: 1, stats: { stamina: 18, defenseRating: 12, blockRating: 10, blockValue: 24, armor: 900 } },
  { id: 'orb-of-prototype-power', name: 'Orb of Prototype Power', slot: 'Off Hand', quality: 'Rare', source: 'Quest', phase: 1, stats: { intellect: 12, spellPower: 24 } },
  { id: 'practice-longbow', name: 'Practice Longbow', slot: 'Ranged', quality: 'Rare', source: 'Vendor', phase: 1, stats: { rangedAttackPower: 36, hitRating: 8 } },
  { id: 'totem-of-testing', name: 'Totem of Testing', slot: 'Relic', quality: 'Rare', source: 'Quest', phase: 1, allowedClasses: ['Shaman'], stats: { spellPower: 12, healingPower: 20 } },
  { id: 'idol-of-testing', name: 'Idol of Testing', slot: 'Relic', quality: 'Rare', source: 'Quest', phase: 1, allowedClasses: ['Druid'], stats: { attackPower: 16, healingPower: 18 } },
  { id: 'libram-of-testing', name: 'Libram of Testing', slot: 'Relic', quality: 'Rare', source: 'Quest', phase: 1, allowedClasses: ['Paladin'], stats: { defenseRating: 8, healingPower: 18 } },
]

export function getItemsForSlot(slot: GearSlot) {
  return sampleItems.filter((item) => item.slot === slot)
}

export function getItemById(id: string) {
  return sampleItems.find((item) => item.id === id)
}
