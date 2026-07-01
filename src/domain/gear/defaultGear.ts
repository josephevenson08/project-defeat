import { gearSlots } from './gearSlots'
import type { EquippedGear } from './itemTypes'
import { getItemsForSlot } from './sampleItems'
import { getDefaultItemForSlot } from './slotCompatibility'

export const defaultGear = gearSlots.reduce((gear, slot) => {
  const item = getDefaultItemForSlot(slot, getItemsForSlot(slot))
  if (!item) throw new Error(`Missing sample item for ${slot}`)
  gear[slot] = { item, gemIds: item.sockets?.map(() => '') ?? [] }
  return gear
}, {} as EquippedGear)
