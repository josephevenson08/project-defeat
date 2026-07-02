import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { gearSlots, type GearSlot } from './gearSlots'

export function getVisibleGearSlotsForSpec(className: TbcClass, _specName: TbcSpec): readonly GearSlot[] {
  if (className === 'Shaman') {
    return gearSlots.filter((slot) => slot !== 'Ranged')
  }

  return gearSlots
}

export function getGearSlotDisplayName(slot: GearSlot, className: TbcClass, _specName: TbcSpec) {
  if (className === 'Shaman' && slot === 'Relic') return 'Totem'
  return slot
}
