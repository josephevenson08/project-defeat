import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { gearSlots, type GearSlot } from './gearSlots'

// Only Shaman, Paladin, and Druid have a Relic (Totem/Libram/Idol) slot in TBC.
const relicClasses: readonly TbcClass[] = ['Shaman', 'Paladin', 'Druid']

export function getVisibleGearSlotsForSpec(className: TbcClass, _specName: TbcSpec): readonly GearSlot[] {
  if (className === 'Shaman') {
    return gearSlots.filter((slot) => slot !== 'Ranged')
  }

  if (!relicClasses.includes(className)) {
    return gearSlots.filter((slot) => slot !== 'Relic')
  }

  return gearSlots
}

export function getGearSlotDisplayName(slot: GearSlot, className: TbcClass, _specName: TbcSpec) {
  if (className === 'Shaman' && slot === 'Relic') return 'Totem'
  return slot
}
