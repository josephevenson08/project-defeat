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
  /**
   * Which raid build this seat signed up as — `druid-feral-tank` versus `druid-feral-cat`.
   *
   * Optional so that rosters saved before builds existed still load: absent means "the only build
   * for this spec", which is true for 24 of the 27. **Coverage never reads it.** A bear and a cat are
   * the same talent tree, so they bring the same buffs, and matching on the build rather than the
   * spec would have quietly split Leader of the Pack in two.
   */
  buildId?: string
  /**
   * Optional, and it stays optional deliberately.
   *
   * Coverage never reads it — a Shaman brings Strength of Earth whether or not you typed "Dave" — so
   * an unnamed roster is fully functional and naming is purely for the raid reading the exported
   * chart. Keeping it out of the coverage model is also what stops the tool quietly becoming a
   * roster-management database for other people's details.
   */
  playerName?: string
}

/** A seat's address. Drag-and-drop moves between two of these, so it is worth naming. */
export type SeatRef = {
  groupIndex: number
  seatIndex: number
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

/** Reads one seat, or undefined if the address is out of range or empty. */
export function seatAt(roster: Roster, ref: SeatRef): RosterSlot | undefined {
  return roster.groups[ref.groupIndex]?.[ref.seatIndex]
}

function writeSeat(roster: Roster, ref: SeatRef, slot: RosterSlot | undefined): Roster {
  const groups = roster.groups.map((group, groupIndex) =>
    groupIndex === ref.groupIndex
      ? group.map((existing, seatIndex) => (seatIndex === ref.seatIndex ? slot : existing))
      : group,
  )
  return { ...roster, groups }
}

/**
 * Moves a seat, **swapping** when the destination is occupied rather than refusing or overwriting.
 *
 * Swap is the behaviour a raid leader expects from dragging one player onto another: they are
 * trading places. Refusing would make reorganising a full raid impossible without first emptying a
 * seat, and overwriting would silently delete somebody — the one outcome that loses work.
 */
export function moveSeat(roster: Roster, from: SeatRef, to: SeatRef): Roster {
  if (from.groupIndex === to.groupIndex && from.seatIndex === to.seatIndex) return roster

  const moving = seatAt(roster, from)
  if (!moving) return roster

  const displaced = seatAt(roster, to)
  return writeSeat(writeSeat(roster, to, moving), from, displaced)
}

/** Sets or clears a seat's player name. An empty string clears it rather than storing "". */
export function renameSeat(roster: Roster, ref: SeatRef, playerName: string): Roster {
  const slot = seatAt(roster, ref)
  if (!slot) return roster

  const trimmed = playerName.trim()
  const { playerName: _previous, ...rest } = slot
  return writeSeat(roster, ref, trimmed ? { ...rest, playerName: trimmed } : rest)
}

/** Karazhan is the only 10-player raid in Phase 2; everything else is 25. */
export const RAID_SIZES: readonly RaidPlayerSize[] = [10, 25]
