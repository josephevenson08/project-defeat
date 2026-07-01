export { defaultGear } from '../../domain/gear/defaultGear'
export { gearSlots } from '../../domain/gear/gearSlots'
export { getItemById, getItemsForSlot, sampleItems as placeholderGear } from '../../domain/gear/sampleItems'
export { getItemsForSlotAndCharacter, isItemAllowedForCharacter, normalizeGearForCharacter } from '../../domain/gear/characterItemRules'
export {
  getPairedGearSlots,
  isItemBlockedByUniqueInGear,
  isItemCompatibleWithGearSlot,
  isPairedGearSlot,
} from '../../domain/gear/slotCompatibility'
