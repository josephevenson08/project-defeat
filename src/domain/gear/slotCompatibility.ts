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

/**
 * The off-hand placeholder, for when a two-handed weapon leaves that hand genuinely empty.
 *
 * `EquippedGear` is a `Record<GearSlot, EquippedSlot>` — every slot must hold something, so there is
 * no way to express "nothing" without one of these. It carries no stats, no armour type, no weapon
 * type and no item level, which is what makes it inert everywhere it is read: `calculateStats` sums
 * an empty stat block, `deriveItemArmor` has no armour class to derive from, and `isDualWield` finds
 * no weapon type and correctly answers no.
 *
 * It is a model construct rather than game data, hence a `Common` "Empty" with an obvious id — it
 * should never be mistaken for a catalogue item.
 */
export const EMPTY_OFF_HAND: GearItem = {
  id: 'empty-off-hand',
  name: 'Empty',
  slot: 'Off Hand',
  quality: 'Common',
  stats: {},
}

export function isEmptySlotItem(item: GearItem | undefined) {
  return item?.id === EMPTY_OFF_HAND.id
}

/**
 * A two-handed weapon occupies both hands, so nothing may sit in the off hand alongside it.
 *
 * This is a rule about a *combination*, which is why it could not live in
 * `isItemAllowedForCharacter` — that function judges one item against a character and never sees the
 * rest of the set. Without it, `defaultGear` filled each slot independently by item level and **18
 * of the 27 specs opened with an impossible pairing**: a Fury Warrior holding a two-handed sword and
 * a one-handed mace, every caster holding a staff and a sword. The off-hand's stats were counted,
 * and `isDualWield` then added a whole phantom off-hand's white damage on top.
 */
export function twoHanderOccupiesOffHand(mainHandItem: GearItem | undefined) {
  return mainHandItem?.handType === 'Two Hand'
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
