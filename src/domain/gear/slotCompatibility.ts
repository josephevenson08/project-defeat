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

/**
 * A one-handed weapon lives in the catalogue under `Main Hand`, but a dual-wielding spec can equip it
 * in either hand, so it has to be offered for the off hand too. Only genuine one-handers qualify:
 * two-handers, main-hand-only weapons and shields must not leak across.
 *
 * Whether the character may dual-wield at all is decided by slot visibility for the spec, not here.
 */
function isOffHandEligible(item: GearItem) {
  return item.slot === 'Main Hand' && item.handType === 'One Hand'
}

export function isItemCompatibleWithGearSlot(item: GearItem, gearSlot: GearSlot) {
  if (gearSlot === 'Off Hand' && isOffHandEligible(item)) return true
  return getPairedGearSlots(gearSlot).includes(item.slot)
}

export function isUniqueRestricted(item: GearItem) {
  return item.unique === true || item.uniqueEquipped === true
}

export function isItemBlockedByUniqueInGear(item: GearItem, targetSlot: GearSlot, gear: EquippedGear) {
  if (!isUniqueRestricted(item)) return false

  return getPairedGearSlots(targetSlot).some((slot) => slot !== targetSlot && gear[slot].item.id === item.id)
}

/**
 * Picks the starting item for a slot: the highest item level among the legal options.
 *
 * "First match" was fine against a 230-item hand-written catalogue, but the ingested one spans all of
 * Classic as well as TBC, and first-match handed a Phase 2 TBC planner a Molten Core helm at item
 * level 76. Highest item level is not a claim about what is best — set bonuses, sockets and stat
 * weights all matter more — it just guarantees the starting state is era-appropriate rather than
 * whatever happens to sort first.
 */
export function getDefaultItemForSlot(slot: GearSlot, items: readonly GearItem[]) {
  let best: GearItem | undefined
  for (const item of items) {
    if (!isItemCompatibleWithGearSlot(item, slot)) continue
    if (!best || (item.itemLevel ?? 0) > (best.itemLevel ?? 0)) best = item
  }
  return best
}
