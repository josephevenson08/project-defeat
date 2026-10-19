import type { CharacterRole } from '../character/characterTypes'
import { buffReach, describeNeed, PARTY_SIZE, slotProvides, type BuffReach, type Roster, type RosterSlot, type SeatRef } from '../raidcomp'
import { exclusiveGroupFor, exclusiveGroups } from './buffExclusivity'
import type { Buff, TargetDebuff } from './buffTypes'
import { sampleBuffs } from './sampleBuffs'
import { sampleTargetDebuffs } from './sampleTargetDebuffs'

/**
 * Buffs from your raid (port step 6, the Buffs tab's design C): who in the raid brings each buff to
 * you, from your seat in it, and what is missing.
 *
 * The same counting as Raid Composition's coverage (`slotProvides`, each buff's reach from its
 * tooltip), read from one seat: a party buff reaches you only from your own group; a buff cast on
 * any group, a raid-wide one and a boss debuff reach you from anyone. One provider gives one buff of
 * an exclusive set (one aura per Paladin, one air totem per Shaman, one shout per Warrior), and each
 * Paladin gives the one Greater Blessing they are assigned.
 */

export type BuffEntry = { kind: 'buff'; entry: Buff } | { kind: 'debuff'; entry: TargetDebuff }

/** Every buff and boss debuff, counted or not, in the data's order. */
export const allBuffEntries: readonly BuffEntry[] = [
  ...sampleBuffs.map((entry): BuffEntry => ({ kind: 'buff', entry })),
  ...sampleTargetDebuffs.map((entry): BuffEntry => ({ kind: 'debuff', entry })),
]

/** The five Greater Blessings, in the exclusivity data's order. */
export const BLESSING_IDS: readonly string[] = exclusiveGroups.find((group) => group.id === 'paladin-blessings')?.buffIds ?? []
export const isBlessing = (id: string) => BLESSING_IDS.includes(id)

/** How far an entry reaches: a debuff sits on the boss. */
export const reachOf = (item: BuffEntry): BuffReach => (item.kind === 'debuff' ? 'Boss' : buffReach(item.entry.id))

/** A seat in the raid, with you in yours. */
export type RaidSeat = { ref: SeatRef; slot: RosterSlot; you: boolean }

export const seatKey = (ref: SeatRef) => `${ref.groupIndex}-${ref.seatIndex}`

/** Your seat when none was picked: the first seat of your own build, else the first empty seat, else the first. */
export function defaultSeat(roster: Roster, you: RosterSlot): SeatRef {
  const find = (test: (slot: RosterSlot | undefined) => boolean) => {
    for (const [groupIndex, group] of roster.groups.entries()) {
      for (let seatIndex = 0; seatIndex < PARTY_SIZE; seatIndex++) if (test(group[seatIndex])) return { groupIndex, seatIndex }
    }
    return undefined
  }
  return (
    find((slot) => slot?.className === you.className && slot.spec === you.spec) ??
    find((slot) => slot === undefined) ?? { groupIndex: 0, seatIndex: 0 }
  )
}

/** A seat that exists in this roster, or the default one. */
export function seatIn(roster: Roster, you: RosterSlot, seat: SeatRef | undefined): SeatRef {
  return seat && seat.groupIndex < roster.groups.length && seat.seatIndex >= 0 && seat.seatIndex < PARTY_SIZE
    ? seat
    : defaultSeat(roster, you)
}

/** The raid's groups with you sitting in your seat (whoever sat there gives it up). */
export function seatsWithYou(roster: Roster, seat: SeatRef, you: RosterSlot): (RaidSeat | undefined)[][] {
  return roster.groups.map((group, groupIndex) =>
    Array.from({ length: PARTY_SIZE }, (_, seatIndex) => {
      const ref = { groupIndex, seatIndex }
      if (groupIndex === seat.groupIndex && seatIndex === seat.seatIndex) return { ref, slot: you, you: true }
      const slot = group[seatIndex]
      return slot ? { ref, slot, you: false } : undefined
    }),
  )
}

/** The raid's Paladins in seat order, you among them when you are one. */
export function raidPaladins(seats: readonly (RaidSeat | undefined)[][]): RaidSeat[] {
  return seats.flat().filter((seat): seat is RaidSeat => seat?.slot.className === 'Paladin')
}

const buffById = new Map(sampleBuffs.map((buff) => [buff.id, buff]))
const fitsRole = (buff: Buff | undefined, role: CharacterRole) => !buff?.roles || buff.roles.includes(role)

/**
 * The order a raid hands out Greater Blessings for your role: Kings, then the counted Blessings your
 * role uses (Might for a melee player or a tank, Wisdom for a caster or healer), then the uncounted
 * ones it uses (Salvation, or Sanctuary for a tank). A Paladin blesses a class, so this is what they
 * would put on yours.
 */
export function blessingOrder(role: CharacterRole): string[] {
  const fitting = BLESSING_IDS.filter((id) => fitsRole(buffById.get(id), role))
  const counted = (id: string) => !buffById.get(id)?.notModelled
  return [
    ...fitting.filter((id) => id === 'blessing-of-kings'),
    ...fitting.filter((id) => id !== 'blessing-of-kings' && counted(id)),
    ...fitting.filter((id) => id !== 'blessing-of-kings' && !counted(id)),
  ]
}

/**
 * Each Paladin's Blessing, by seat: what was assigned before where that seat still holds a Paladin,
 * otherwise the next in the role's order, and none once the order runs out. Two Paladins cannot give
 * the same Greater Blessing to one class, so a kept assignment that collides gives way.
 */
export function assignBlessings(
  paladins: readonly RaidSeat[],
  role: CharacterRole,
  kept: Readonly<Record<string, string | null>> = {},
): Record<string, string | null> {
  const given = new Set<string>()
  const result: Record<string, string | null> = {}
  for (const paladin of paladins) {
    const key = seatKey(paladin.ref)
    if (!(key in kept)) continue
    const blessing = kept[key]
    result[key] = blessing && !given.has(blessing) ? blessing : null
    if (blessing) given.add(blessing)
  }
  const order = blessingOrder(role)
  for (const paladin of paladins) {
    const key = seatKey(paladin.ref)
    if (key in result) continue
    const next = order.find((id) => !given.has(id)) ?? null
    result[key] = next
    if (next) given.add(next)
  }
  return result
}

/** Gives a Paladin a Blessing (null takes it away); a Blessing another Paladin gives swaps with theirs. */
export function giveBlessing(
  blessings: Readonly<Record<string, string | null>>,
  key: string,
  blessing: string | null,
): { blessings: Record<string, string | null>; swappedWith?: string } {
  const next = { ...blessings }
  const other = blessing ? Object.keys(next).find((k) => k !== key && next[k] === blessing) : undefined
  if (other) next[other] = next[key] ?? null
  next[key] = blessing
  return { blessings: next, ...(other ? { swappedWith: other } : {}) }
}

/** Whether a buff reaches you, and from whom; or, when it does not, why. */
export type RaidCoverage = {
  got: boolean
  /** Who gives it to you: you first, then your group, then the rest of the raid. */
  by: readonly RaidSeat[]
  /** When providers are in reach but each already gives another buff of the same set (or no Paladin is assigned it). */
  givingInstead?: readonly string[]
  /** When nobody in reach could give it: "an Enhancement Shaman in your group". */
  needs?: string
  /** A Blessing nobody is assigned, and whether the raid has a Paladin at all. */
  noPaladin?: 'unassigned' | 'none'
}

/** Who gives what to you, from your seat in the raid. */
export function raidCoverage(
  seats: readonly (RaidSeat | undefined)[][],
  seat: SeatRef,
  blessings: Readonly<Record<string, string | null>>,
): Record<string, RaidCoverage> {
  const everyone = seats.flat().filter((x): x is RaidSeat => x !== undefined)
  const near = (x: RaidSeat) => (x.you ? 2 : x.ref.groupIndex === seat.groupIndex ? 1 : 0)
  const inReach = (item: BuffEntry) =>
    everyone
      .filter((x) => reachOf(item) !== 'Party' || x.ref.groupIndex === seat.groupIndex)
      .filter((x) => slotProvides(x.slot, item.entry))
      .sort((a, b) => near(b) - near(a))

  const result: Record<string, RaidCoverage> = {}
  for (const item of allBuffEntries) {
    const id = item.entry.id
    if (isBlessing(id)) continue
    const by = inReach(item)
    result[id] = by.length
      ? { got: true, by }
      : { got: false, by: [], needs: reachOf(item) === 'Party' ? `${describeNeed(item.entry)} in your group` : describeNeed(item.entry) }
  }

  // One provider, one buff of an exclusive set, handed out in the set's own order.
  for (const group of exclusiveGroups) {
    if (group.id === 'paladin-blessings') continue
    const used = new Map<string, string>()
    for (const id of group.buffIds) {
      const coverage = result[id]
      if (!coverage?.got) continue
      const free = coverage.by.filter((x) => !used.has(seatKey(x.ref)))
      if (free.length) {
        used.set(seatKey(free[0].ref), id)
        result[id] = { got: true, by: free }
      } else {
        result[id] = { got: false, by: [], givingInstead: [...new Set(coverage.by.map((x) => used.get(seatKey(x.ref)) ?? ''))].filter(Boolean) }
      }
    }
  }

  // Blessings: what the raid's Paladins are assigned.
  const paladins = raidPaladins(seats)
  for (const id of BLESSING_IDS) {
    const giver = paladins.find((x) => blessings[seatKey(x.ref)] === id)
    result[id] = giver ? { got: true, by: [giver] } : { got: false, by: [], noPaladin: paladins.length ? 'unassigned' : 'none' }
  }
  return result
}

/** The counted buffs and boss debuffs a raid gives you, for your role: what the stat bar and the simulator count. */
export function raidBuffIds(coverage: Readonly<Record<string, RaidCoverage>>, role: CharacterRole) {
  return {
    buffIds: sampleBuffs.filter((buff) => !buff.notModelled && fitsRole(buff, role) && coverage[buff.id]?.got).map((buff) => buff.id),
    debuffIds: sampleTargetDebuffs.filter((debuff) => !debuff.notModelled && coverage[debuff.id]?.got).map((debuff) => debuff.id),
  }
}

/** The set an exclusive buff belongs to, for its tooltip ("Air totem: one per Shaman"). */
export { exclusiveGroupFor }
