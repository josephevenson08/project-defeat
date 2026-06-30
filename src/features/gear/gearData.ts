import type { EquippedGear, GearItem, GearSlot } from './gearTypes'

export const gearSlots: GearSlot[] = ['Head', 'Chest', 'Hands', 'Legs', 'Weapon', 'Trinket 1', 'Trinket 2']

export const placeholderGear: GearItem[] = [
  {
    id: 'initiates-warhelm',
    name: "Initiate's Warhelm",
    slot: 'Head',
    source: 'Prototype starter set',
    stats: { strength: 18, stamina: 14, critRating: 8 },
  },
  {
    id: 'runed-battle-vest',
    name: 'Runed Battle Vest',
    slot: 'Chest',
    source: 'Prototype starter set',
    stats: { agility: 12, stamina: 20, hitRating: 8 },
  },
  {
    id: 'gloves-of-focus',
    name: 'Gloves of Focus',
    slot: 'Hands',
    source: 'Prototype starter set',
    stats: { intellect: 14, spellPower: 22, critRating: 6 },
  },
  {
    id: 'legguards-of-practice',
    name: 'Legguards of Practice',
    slot: 'Legs',
    source: 'Prototype starter set',
    stats: { strength: 10, agility: 10, stamina: 18 },
  },
  {
    id: 'training-sword',
    name: 'Training Sword',
    slot: 'Weapon',
    source: 'Prototype weapon rack',
    stats: { attackPower: 40, critRating: 10 },
  },
  {
    id: 'apprentice-focus-staff',
    name: 'Apprentice Focus Staff',
    slot: 'Weapon',
    source: 'Prototype weapon rack',
    stats: { spellPower: 54, hitRating: 10 },
  },
  {
    id: 'badge-of-momentum',
    name: 'Badge of Momentum',
    slot: 'Trinket 1',
    source: 'Prototype trinket table',
    stats: { attackPower: 32, hitRating: 8 },
  },
  {
    id: 'charm-of-embers',
    name: 'Charm of Embers',
    slot: 'Trinket 2',
    source: 'Prototype trinket table',
    stats: { spellPower: 30, critRating: 8 },
  },
]

export const gearBySlot = gearSlots.reduce<Record<GearSlot, GearItem[]>>((result, slot) => {
  result[slot] = placeholderGear.filter((item) => item.slot === slot)
  return result
}, {} as Record<GearSlot, GearItem[]>)

export const defaultGear: EquippedGear = {
  Head: placeholderGear.find((item) => item.id === 'initiates-warhelm')!,
  Chest: placeholderGear.find((item) => item.id === 'runed-battle-vest')!,
  Hands: placeholderGear.find((item) => item.id === 'gloves-of-focus')!,
  Legs: placeholderGear.find((item) => item.id === 'legguards-of-practice')!,
  Weapon: placeholderGear.find((item) => item.id === 'training-sword')!,
  'Trinket 1': placeholderGear.find((item) => item.id === 'badge-of-momentum')!,
  'Trinket 2': placeholderGear.find((item) => item.id === 'charm-of-embers')!,
}
