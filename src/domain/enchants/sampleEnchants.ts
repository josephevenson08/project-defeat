import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/tbcClasses'
import type { GearSlot } from '../gear/gearSlots'
import type { GearItem } from '../gear/itemTypes'
import type { Enchant } from './enchantTypes'

export const sampleEnchants: readonly Enchant[] = [
  { id: 'glyph-of-ferocity', name: 'Glyph of Ferocity', slot: 'Head', source: 'Reputation', roles: ['Physical DPS'], stats: { attackPower: 34, hitRating: 16 } },
  { id: 'glyph-of-power', name: 'Glyph of Power', slot: 'Head', source: 'Reputation', roles: ['Caster DPS'], stats: { spellPower: 22, spellHitRating: 14 } },
  { id: 'glyph-of-renewal', name: 'Glyph of Renewal', slot: 'Head', source: 'Reputation', roles: ['Healer'], stats: { healingPower: 28, mp5: 4 } },
  { id: 'greater-stats-chest', name: 'Enchant Chest - Exceptional Stats', slot: 'Chest', source: 'Other', stats: { strength: 6, agility: 6, stamina: 6, intellect: 6, spirit: 6 } },
  { id: 'assault-wrists', name: 'Enchant Bracer - Assault', slot: 'Wrists', source: 'Other', roles: ['Physical DPS'], stats: { attackPower: 24 } },
  { id: 'spellpower-wrists', name: 'Enchant Bracer - Spellpower', slot: 'Wrists', source: 'Other', roles: ['Caster DPS'], stats: { spellPower: 15 } },
  { id: 'superior-healing-wrists', name: 'Enchant Bracer - Superior Healing', slot: 'Wrists', source: 'Other', roles: ['Healer'], stats: { healingPower: 20 } },
  {
    id: 'major-spellpower-weapon',
    name: 'Enchant Weapon - Major Spellpower',
    slot: 'Main Hand',
    source: 'Other',
    roles: ['Caster DPS', 'Healer'],
    allowedSlots: ['Main Hand', 'Off Hand'],
    allowedWeaponTypes: ['Dagger', 'Mace', 'Sword', 'Staff'],
    stats: { spellPower: 40 },
  },
  {
    id: 'major-healing-weapon',
    name: 'Enchant Weapon - Major Healing',
    slot: 'Main Hand',
    source: 'Other',
    roles: ['Healer'],
    allowedSlots: ['Main Hand', 'Off Hand'],
    allowedWeaponTypes: ['Dagger', 'Mace', 'Sword', 'Staff'],
    stats: { healingPower: 55 },
  },
  {
    id: 'mongoose-main-hand',
    name: 'Enchant Weapon - Mongoose',
    slot: 'Main Hand',
    source: 'Other',
    roles: ['Physical DPS'],
    allowedSlots: ['Main Hand', 'Off Hand'],
    allowedWeaponTypes: ['Axe', 'Dagger', 'Fist Weapon', 'Mace', 'Sword'],
    stats: { agility: 20, hasteRating: 10 },
  },
  {
    id: 'major-agility-weapon',
    name: 'Enchant Weapon - Major Agility',
    slot: 'Main Hand',
    source: 'Other',
    roles: ['Physical DPS'],
    allowedSlots: ['Main Hand', 'Off Hand'],
    allowedWeaponTypes: ['Axe', 'Dagger', 'Fist Weapon', 'Mace', 'Sword'],
    needsVerification: true,
    notes: 'Starter enchant option; verify final TBC source and ranking before treating as BiS.',
    stats: { agility: 20 },
  },
  { id: 'surefooted-feet', name: 'Enchant Boots - Surefooted', slot: 'Feet', source: 'Other', roles: ['Physical DPS'], stats: { hitRating: 10, critRating: 5 } },
  { id: 'healing-hands', name: 'Enchant Gloves - Major Healing', slot: 'Hands', source: 'Other', roles: ['Healer'], stats: { healingPower: 35 } },
  {
    id: 'defense-shield',
    name: 'Enchant Shield - Defense',
    slot: 'Off Hand',
    source: 'Other',
    roles: ['Tank'],
    allowedWeaponTypes: ['Shield'],
    stats: { defenseRating: 18 },
  },
  {
    id: 'intellect-shield',
    name: 'Enchant Shield - Intellect',
    slot: 'Off Hand',
    source: 'Other',
    roles: ['Healer'],
    allowedWeaponTypes: ['Shield'],
    needsVerification: true,
    notes: 'Starter enchant option; verify final TBC value before treating as BiS.',
    stats: { intellect: 12 },
  },
]

function enchantFitsSlot(enchant: Enchant, slot: GearSlot) {
  return (enchant.allowedSlots ?? [enchant.slot]).includes(slot)
}

function enchantFitsCharacter(enchant: Enchant, character: CharacterProfile | undefined) {
  if (!character) return true
  if (enchant.allowedClasses && !enchant.allowedClasses.includes(character.className)) return false
  if (enchant.allowedSpecs && !enchant.allowedSpecs.includes(character.spec)) return false
  if (enchant.roles && !enchant.roles.includes(getRoleForSpec(character.className, character.spec))) return false
  return true
}

function enchantFitsItem(enchant: Enchant, item: GearItem | undefined) {
  if (!item || !enchant.allowedWeaponTypes) return true
  return item.weaponType ? enchant.allowedWeaponTypes.includes(item.weaponType) : true
}

export function getEnchantsForSlot(slot: GearSlot, character?: CharacterProfile, item?: GearItem) {
  return sampleEnchants.filter((enchant) => enchantFitsSlot(enchant, slot) && enchantFitsCharacter(enchant, character) && enchantFitsItem(enchant, item))
}

export function getEnchantById(id: string | undefined) {
  return sampleEnchants.find((enchant) => enchant.id === id)
}
