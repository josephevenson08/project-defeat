import type { GearSlot } from '../gear/gearSlots'
import type { Enchant } from './enchantTypes'

export const sampleEnchants: readonly Enchant[] = [
  { id: 'glyph-of-ferocity', name: 'Glyph of Ferocity', slot: 'Head', source: 'Reputation', stats: { attackPower: 34, hitRating: 16 } },
  { id: 'glyph-of-power', name: 'Glyph of Power', slot: 'Head', source: 'Reputation', stats: { spellPower: 22, spellHitRating: 14 } },
  { id: 'greater-stats-chest', name: 'Enchant Chest - Exceptional Stats', slot: 'Chest', source: 'Other', stats: { strength: 6, agility: 6, stamina: 6, intellect: 6, spirit: 6 } },
  { id: 'assault-wrists', name: 'Enchant Bracer - Assault', slot: 'Wrists', source: 'Other', stats: { attackPower: 24 } },
  { id: 'spellpower-wrists', name: 'Enchant Bracer - Spellpower', slot: 'Wrists', source: 'Other', stats: { spellPower: 15 } },
  { id: 'major-spellpower-weapon', name: 'Enchant Weapon - Major Spellpower', slot: 'Main Hand', source: 'Other', stats: { spellPower: 40 } },
  { id: 'mongoose-main-hand', name: 'Enchant Weapon - Mongoose', slot: 'Main Hand', source: 'Other', stats: { agility: 20, hasteRating: 10 } },
  { id: 'surefooted-feet', name: 'Enchant Boots - Surefooted', slot: 'Feet', source: 'Other', stats: { hitRating: 10, critRating: 5 } },
  { id: 'healing-hands', name: 'Enchant Gloves - Major Healing', slot: 'Hands', source: 'Other', stats: { healingPower: 35 } },
  { id: 'defense-shield', name: 'Enchant Shield - Defense', slot: 'Off Hand', source: 'Other', stats: { defenseRating: 18 } },
]

export function getEnchantsForSlot(slot: GearSlot) {
  return sampleEnchants.filter((enchant) => enchant.slot === slot)
}

export function getEnchantById(id: string | undefined) {
  return sampleEnchants.find((enchant) => enchant.id === id)
}
