import { gearSlots } from './gearSlots'
import type { EquippedGear, GearItem } from './itemTypes'
import { getItemsForSlot } from './itemCatalogue'
import { isObtainable } from './obtainability'
import { EMPTY_OFF_HAND, getDefaultItemForSlot, isUniqueRestricted, twoHanderOccupiesOffHand } from './slotCompatibility'

/**
 * The starting gear set.
 *
 * Slots are filled in order, and any unique item already placed is withheld from later slots. Without
 * that, the paired slots both take the single highest-item-level option and the app opens in a state
 * it will not let you create by hand — two copies of a unique ring, trinket or weapon.
 *
 * The two-hander rule is applied *after* the reduce rather than inside it, so it cannot depend on
 * whether `gearSlots` happens to list Main Hand before Off Hand.
 */
const filledGear = gearSlots.reduce((gear, slot) => {
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

/*
 * Highest-item-level-per-slot picks each hand independently, so it happily paired a two-handed
 * weapon with a one-hander. That is not a legal TBC set, and it was not cosmetic: the off-hand's
 * stats were counted and the simulator added a phantom off-hand's white damage on top of it.
 */
export const defaultGear: EquippedGear = twoHanderOccupiesOffHand(filledGear['Main Hand']?.item)
  ? { ...filledGear, 'Off Hand': { item: EMPTY_OFF_HAND, gemIds: [] } }
  : filledGear
