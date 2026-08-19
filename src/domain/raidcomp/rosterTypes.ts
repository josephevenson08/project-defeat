import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { RaidPlayerSize } from '../raids/raidTypes'

/**
 * One seat in a raid, identified only by what the player brings.
 *
 * Deliberately not a *person*. A raid leader planning a composition is asking "do I have a Shaman in
 * group 3 for totems", not "is Dave online" — and a name field would invite storing other people's
 * details in a local-first app that has never held any.
 */
export type RosterSlot = {
  className: TbcClass
  spec: TbcSpec
}

/** TBC parties are five, always. A 25-player raid is five of them; a 10-player raid is two. */
export const PARTY_SIZE = 5

/**
 * A planned raid, as groups rather than a flat list.
 *
 * **The group structure is not presentation, it is the model.** 24 of the 33 raid buffs are
 * party-scoped in TBC — every totem, every aura, both shouts — so which group a Shaman sits in
 * decides who actually gets Strength of Earth. A flat roster cannot answer the question the tool
 * exists to answer, which is why this changed shape once the scopes were sourced.
 *
 * A group is a fixed-length array with `undefined` for an empty seat, rather than a short array, so
 * that "group 2, seat 4" stays meaningful while the roster is half-built — a raid leader fills these
 * out of order.
 */
export type RaidGroup = readonly (RosterSlot | undefined)[]

export type Roster = {
  size: RaidPlayerSize
  groups: readonly RaidGroup[]
}

export const groupCountFor = (size: RaidPlayerSize) => size / PARTY_SIZE

export function emptyRoster(size: RaidPlayerSize): Roster {
  return {
    size,
    groups: Array.from({ length: groupCountFor(size) }, () => Array.from({ length: PARTY_SIZE }, () => undefined)),
  }
}

/** Every filled seat, flattened. Order is group order, which is what the roster reads as on screen. */
export function filledSlots(roster: Roster): RosterSlot[] {
  return roster.groups.flatMap((group) => group.filter((slot): slot is RosterSlot => slot !== undefined))
}

/**
 * Resizes without discarding what fits.
 *
 * Going 25 → 10 drops groups 3-5, and there is no honest way around that; going 10 → 25 keeps both
 * groups and adds three empty ones. Silently clearing the roster on a mis-click would be worse than
 * either.
 */
export function resizeRoster(roster: Roster, size: RaidPlayerSize): Roster {
  const target = groupCountFor(size)
  const groups = Array.from(
    { length: target },
    (_, index) => roster.groups[index] ?? Array.from({ length: PARTY_SIZE }, () => undefined),
  )
  return { size, groups }
}

/** Places a spec in the first free seat of a group, or returns the roster unchanged when it is full. */
export function addToGroup(roster: Roster, groupIndex: number, slot: RosterSlot): Roster {
  const group = roster.groups[groupIndex]
  if (!group) return roster
  const seat = group.indexOf(undefined)
  if (seat === -1) return roster

  const groups = roster.groups.map((candidate, index) =>
    index === groupIndex ? candidate.map((existing, position) => (position === seat ? slot : existing)) : candidate,
  )
  return { ...roster, groups }
}

/** Clears one seat. Seats are addressed rather than searched, so removing is unambiguous. */
export function clearSeat(roster: Roster, groupIndex: number, seatIndex: number): Roster {
  const groups = roster.groups.map((group, index) =>
    index === groupIndex ? group.map((existing, position) => (position === seatIndex ? undefined : existing)) : group,
  )
  return { ...roster, groups }
}

/** Karazhan is the only 10-player raid in Phase 2; everything else is 25. */
export const RAID_SIZES: readonly RaidPlayerSize[] = [10, 25]
