import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { RaidPlayerSize } from '../raids/raidTypes'

/**
 * One seat in a raid, identified only by what the player brings.
 *
 * Deliberately not a *person*. A raid leader planning a composition is asking "do I have a Shaman
 * for Bloodlust", not "is Dave online" — and a name field would invite storing other people's
 * details in a local-first app that has never held any. Seats are interchangeable within a spec, so
 * the roster is a plain list and two Fury Warriors are genuinely identical entries.
 */
export type RosterSlot = {
  className: TbcClass
  spec: TbcSpec
}

/**
 * A planned raid. Order carries no meaning — coverage is a set question — but it is kept stable so
 * the list does not reshuffle under the player as they add seats.
 */
export type Roster = {
  size: RaidPlayerSize
  slots: readonly RosterSlot[]
}

export const emptyRoster = (size: RaidPlayerSize): Roster => ({ size, slots: [] })

/** Karazhan is the only 10-player raid in Phase 2; everything else is 25. */
export const RAID_SIZES: readonly RaidPlayerSize[] = [10, 25]
