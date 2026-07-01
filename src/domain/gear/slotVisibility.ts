import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { gearSlots, type GearSlot } from './gearSlots'

export function getVisibleGearSlotsForSpec(className: TbcClass, specName: TbcSpec): readonly GearSlot[] {
  if (className === 'Shaman' && specName === 'Enhancement') {
    return gearSlots.filter((slot) => slot !== 'Ranged')
  }

  return gearSlots
}

export function getGearSlotDisplayName(slot: GearSlot, className: TbcClass, specName: TbcSpec) {
  if (className === 'Shaman' && specName === 'Enhancement' && slot === 'Relic') return 'Totem'
  return slot
}
