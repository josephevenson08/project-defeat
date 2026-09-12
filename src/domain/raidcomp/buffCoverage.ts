import type { Buff, BuffProvider, TargetDebuff } from '../buffs/buffTypes'
import { describeProvider } from '../buffs/buffTypes'
import { getBuffScope, isPartyScoped } from '../buffs/buffScope'
import { sampleBuffs } from '../buffs/sampleBuffs'
import { sampleTargetDebuffs } from '../buffs/sampleTargetDebuffs'
import type { CharacterRole } from '../character/characterTypes'
import { getRoleForSpec } from '../character/tbcClasses'
import { getRaidBuild } from './raidBuilds'
import { filledSlots } from './rosterTypes'
import type { RaidGroup, Roster, RosterSlot } from './rosterTypes'

/**
 * Whether a seat brings a given buff or debuff.
 *
 * The reason `providedByClass` and `providedBySpec` are typed rather than parsed out of a display
 * string: this comparison has to be exact. A near-miss does not throw, it silently under-reports
 * coverage, and a raid leader goes recruiting for a seat they already filled.
 */
export function slotProvides(slot: RosterSlot, provider: BuffProvider): boolean {
  if (slot.className !== provider.providedByClass) return false
  return provider.providedBySpec === undefined || slot.spec === provider.providedBySpec
}

export type CoveredEntry<T> = {
  entry: T
  /** How many seats bring it. More than one is redundancy, worth seeing before a raid night. */
  providedBy: number
}

export type MissingEntry<T> = {
  entry: T
  /** "any Shaman", "an Elemental Shaman" — what a raid leader would go looking for. */
  needs: string
}

export type CoverageSection<T> = {
  covered: readonly CoveredEntry<T>[]
  missing: readonly MissingEntry<T>[]
}

/**
 * Everything one seat brings, split by how far each part reaches.
 *
 * The group rows underneath each party deliberately show **party-scoped buffs only**, because that is
 * what the seating decides. The cost is that a player's other contributions are invisible exactly
 * where you are looking while seating them — a Druid's Faerie Fire lands on the boss, so it is
 * correctly absent from "what group 1 receives", and correctly puzzling if you are checking whether
 * your Druid brought it.
 *
 * This is the per-seat answer to that: what does *this player* bring, all of it, in one place.
 */
export type SeatContributions = {
  party: readonly Buff[]
  raidWide: readonly Buff[]
  debuffs: readonly TargetDebuff[]
}

export function seatContributions(slot: RosterSlot): SeatContributions {
  return {
    party: PARTY_BUFFS.filter((buff) => slotProvides(slot, buff)),
    raidWide: RAID_WIDE_BUFFS.filter((buff) => slotProvides(slot, buff)),
    debuffs: sampleTargetDebuffs.filter((debuff) => slotProvides(slot, debuff)),
  }
}

/** What one group's own members bring to that group. Party-scoped buffs only reach this far. */
export type GroupCoverage = {
  groupIndex: number
  filled: number
  /** Party-scoped buffs this group's own members provide — the ones the seating decides. */
  partyBuffs: readonly Buff[]
  /** Party-scoped buffs nobody in this group brings, so this group simply does without. */
  missingPartyBuffs: readonly Buff[]
}

export type CoverageReport = {
  filled: number
  size: number
  remaining: number
  roleCounts: Record<CharacterRole, number>
  /** Raid-wide reach: Greater Blessings, single-target utility, and the six target debuffs. */
  raidWide: CoverageSection<Buff>
  debuffs: CoverageSection<TargetDebuff>
  /**
   * Party-scoped buffs, judged across the whole raid — "is anyone bringing this at all".
   *
   * Kept separate from `groups` because the two answer different questions and a raid leader needs
   * both: having a Shaman somewhere means the raid *has* Strength of Earth, while the per-group view
   * says which four groups are not getting it.
   */
  partyScoped: CoverageSection<Buff>
  groups: readonly GroupCoverage[]
}

/**
 * What a roster is missing, phrased as something to go and find.
 *
 * A class-wide buff says "any" because that is the useful distinction — any Shaman brings Strength of
 * Earth, but only an Elemental one brings Totem of Wrath.
 */
function describeNeed(provider: BuffProvider): string {
  const who = describeProvider(provider)
  return provider.providedBySpec ? `an ${who}`.replace(/^an (?![AEIOU])/, 'a ') : `any ${who}`
}

/*
 * `providerBudget` lived here and capped each exclusive group by how many of its class were seated.
 * It went with the exclusivity capping on 2026-09-12, when this screen moved to Wowhead's model. The
 * constraint itself still lives in `buffExclusivity.ts`, which is where it belongs — it is a sourced
 * game rule, and this screen having stopped applying it does not make it less true.
 */

function sectionFor<T extends BuffProvider & { id: string }>(
  entries: readonly T[],
  slots: readonly RosterSlot[],
): CoverageSection<T> {
  /*
   * **Counted as "someone here can cast this", not "this will be up."**
   *
   * This used to apply exclusivity first, so one Paladin covered one Greater Blessing rather than
   * six. That is the more truthful answer to "what will my raid actually have", and it is not the
   * question this screen was rebuilt to answer: the owner asked for Wowhead's raid-composition model
   * on 2026-09-12, and Wowhead counts a lone Holy Paladin as providing all six Blessings at 1 each —
   * verified against the live page rather than assumed.
   *
   * The tradeoff is real and is stated on the surface rather than hidden: a thin roster reads better
   * here than it will play. `buffExclusivity.ts` still holds the sourced constraint, and the panel
   * marks the buffs that compete, so nothing about which Blessings collide has been forgotten — only
   * the capping has, deliberately.
   */
  const covered: CoveredEntry<T>[] = []
  const missing: MissingEntry<T>[] = []

  for (const entry of entries) {
    const providedBy = slots.filter((slot) => slotProvides(slot, entry)).length

    if (providedBy > 0) covered.push({ entry, providedBy })
    else missing.push({ entry, needs: describeNeed(entry) })
  }

  return { covered, missing }
}



const PARTY_BUFFS = sampleBuffs.filter((buff) => isPartyScoped(buff.id))
const RAID_WIDE_BUFFS = sampleBuffs.filter((buff) => !isPartyScoped(buff.id))

function coverageForGroup(group: RaidGroup, groupIndex: number): GroupCoverage {
  const seated = group.filter((slot): slot is RosterSlot => slot !== undefined)

  /*
   * Every party buff anyone seated here can cast, matching the raid-wide count above rather than
   * capping by exclusivity — see `sectionFor`. A group holding one Paladin lists every aura, the
   * same way Wowhead's per-group row does.
   */
  const partyBuffs: Buff[] = []
  const missingPartyBuffs: Buff[] = []

  for (const buff of PARTY_BUFFS) {
    if (seated.some((slot) => slotProvides(slot, buff))) partyBuffs.push(buff)
    else missingPartyBuffs.push(buff)
  }

  return { groupIndex, filled: seated.length, partyBuffs, missingPartyBuffs }
}

/**
 * Buff and debuff coverage for a planned roster, split by how far each buff actually reaches.
 *
 * **Every buff counts here, including the fifteen marked `notModelled`.** That flag means the
 * *simulator* cannot express the effect as a stat change; it says nothing about whether the buff
 * matters, and to a raid leader Bloodlust matters enormously. This is the surface where that dataset
 * is worth all 33 entries rather than the 18 `calculateStats` can apply.
 *
 * Nothing here is invented: the buffs, the debuffs and their scopes are all read from Wowhead spell
 * tooltips, each entry carrying the spell id its numbers came from.
 */
export function computeCoverage(roster: Roster): CoverageReport {
  const slots = filledSlots(roster)

  const roleCounts: Record<CharacterRole, number> = {
    'Physical DPS': 0,
    'Caster DPS': 0,
    Healer: 0,
    Tank: 0,
  }
  /*
   * Role comes from the **build** where a seat names one, not from the spec.
   *
   * This is the whole reason Feral splits in two: `getRoleForSpec` classifies Druid/Feral as Physical
   * DPS, so a bear seated as a tank was counted as DPS and the tank tally read zero with a tank in
   * the raid. Buff coverage still matches on the spec — a bear and a cat bring the same totem — but
   * *role* is exactly the axis the split exists to separate.
   */
  for (const slot of slots) {
    const build = slot.buildId ? getRaidBuild(slot.buildId) : undefined
    roleCounts[build?.role ?? getRoleForSpec(slot.className, slot.spec)]++
  }

  const raidWide = sectionFor(RAID_WIDE_BUFFS, slots)
  const partyScoped = sectionFor(PARTY_BUFFS, slots)
  const debuffs = sectionFor(sampleTargetDebuffs, slots)

  return {
    filled: slots.length,
    size: roster.size,
    remaining: roster.size - slots.length,
    roleCounts,
    raidWide,
    partyScoped,
    debuffs,
    groups: roster.groups.map(coverageForGroup),
  }
}

export { getBuffScope }
