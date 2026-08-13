export { defaultGear } from '../../domain/gear/defaultGear'
export { gearSlots } from '../../domain/gear/gearSlots'
export { allItems as placeholderGear, getItemById, getItemsForSlot } from '../../domain/gear/itemCatalogue'
export { applyWeaponSlotRules, getItemsForSlotAndCharacter, isItemAllowedForCharacter, normalizeGearForCharacter } from '../../domain/gear/characterItemRules'
export { getGearSlotDisplayName, getVisibleGearSlotsForSpec } from '../../domain/gear/slotVisibility'
export {
  getPairedGearSlots,
  isItemBlockedByUniqueInGear,
  isItemCompatibleWithGearSlot,
  isPairedGearSlot,
} from '../../domain/gear/slotCompatibility'
