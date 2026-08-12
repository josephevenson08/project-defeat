import { gearSlots } from './gearSlots'
import type { EquippedGear, GearItem } from './itemTypes'
import { getItemsForSlot } from './itemCatalogue'
import { isObtainable } from './obtainability'
import { getDefaultItemForSlot, isUniqueRestricted } from './slotCompatibility'

/**
 * The starting gear set.
 *
 * Slots are filled in order, and any unique item already placed is withheld from later slots. Without
 * that, the paired slots both take the single highest-item-level option and the app opens in a state
 * it will not let you create by hand — two copies of a unique ring, trinket or weapon.
 */
export const defaultGear = gearSlots.reduce((gear, slot) => {
  const usedUniqueIds = new Set(
    Object.values(gear)
      .map((equipped) => equipped.item)
      .filter(isUniqueRestricted)
      .map((item) => item.id),
  )

  // Obtainability is filtered here as well as in `isItemAllowedForCharacter`, because this set is
  // built before any character exists and so never passes through that gate. It is the reason the
  // app used to open holding Kael'thas's encounter weapons.
  const candidates = getItemsForSlot(slot).filter((item: GearItem) => !usedUniqueIds.has(item.id) && isObtainable(item))
  const item = getDefaultItemForSlot(slot, candidates)
  if (!item) throw new Error(`Missing sample item for ${slot}`)

  gear[slot] = { item, gemIds: item.sockets?.map(() => '') ?? [] }
  return gear
}, {} as EquippedGear)
