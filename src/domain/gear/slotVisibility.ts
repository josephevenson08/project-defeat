import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { gearSlots, type GearSlot } from './gearSlots'

// Only Shaman, Paladin, and Druid have a Relic (Totem/Libram/Idol) slot in TBC.
const relicClasses: readonly TbcClass[] = ['Shaman', 'Paladin', 'Druid']

export function getVisibleGearSlotsForSpec(className: TbcClass, _specName: TbcSpec): readonly GearSlot[] {
  // Ranged and Relic are the same physical equipment slot in real TBC: Shaman/Paladin/Druid
  // use it for a Totem/Libram/Idol, so their Ranged slot never applies.
  if (relicClasses.includes(className)) {
    return gearSlots.filter((slot) => slot !== 'Ranged')
  }

  return gearSlots.filter((slot) => slot !== 'Relic')
}

const relicDisplayNames: Partial<Record<TbcClass, string>> = {
  Shaman: 'Totem',
  Paladin: 'Libram',
  Druid: 'Idol',
}

export function getGearSlotDisplayName(slot: GearSlot, className: TbcClass, _specName: TbcSpec) {
  if (slot === 'Relic') return relicDisplayNames[className] ?? slot
  return slot
}
