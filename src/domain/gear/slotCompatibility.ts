import type { GearSlot } from './gearSlots'
import type { EquippedGear, GearItem } from './itemTypes'

const fingerSlots = ['Finger 1', 'Finger 2'] as const satisfies readonly GearSlot[]
const trinketSlots = ['Trinket 1', 'Trinket 2'] as const satisfies readonly GearSlot[]

export function getPairedGearSlots(slot: GearSlot): readonly GearSlot[] {
  if (fingerSlots.includes(slot as (typeof fingerSlots)[number])) return fingerSlots
  if (trinketSlots.includes(slot as (typeof trinketSlots)[number])) return trinketSlots
  return [slot]
}

export function isPairedGearSlot(slot: GearSlot) {
  return getPairedGearSlots(slot).length > 1
}

export function isItemCompatibleWithGearSlot(item: GearItem, gearSlot: GearSlot) {
  return getPairedGearSlots(gearSlot).includes(item.slot)
}

export function isUniqueRestricted(item: GearItem) {
  return item.unique === true || item.uniqueEquipped === true
}

export function isItemBlockedByUniqueInGear(item: GearItem, targetSlot: GearSlot, gear: EquippedGear) {
  if (!isUniqueRestricted(item)) return false

  return getPairedGearSlots(targetSlot).some((slot) => slot !== targetSlot && gear[slot].item.id === item.id)
}

export function getDefaultItemForSlot(slot: GearSlot, items: readonly GearItem[]) {
  return items.find((item) => item.slot === slot) ?? items.find((item) => isItemCompatibleWithGearSlot(item, slot))
}
