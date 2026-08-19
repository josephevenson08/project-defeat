import type { Buff, BuffProvider, TargetDebuff } from '../buffs/buffTypes'
import { describeProvider } from '../buffs/buffTypes'
import { getBuffScope, isPartyScoped } from '../buffs/buffScope'
import { sampleBuffs } from '../buffs/sampleBuffs'
import { sampleTargetDebuffs } from '../buffs/sampleTargetDebuffs'
import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import { getRoleForSpec, tbcClasses } from '../character/tbcClasses'
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

/** What one group's own members bring to that group. Party-scoped buffs only reach this far. */
export type GroupCoverage = {
  groupIndex: number
  filled: number
  /** Party-scoped buffs this group's own members provide — the ones the seating decides. */
  partyBuffs: readonly Buff[]
  /** Party-scoped buffs nobody in this group brings, so this group simply does without. */
  missingPartyBuffs: readonly Buff[]
}

export type Suggestion = {
  className: TbcClass
  specs: readonly TbcSpec[]
  anySpec: boolean
  wouldAdd: readonly string[]
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
  suggestions: readonly Suggestion[]
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

function sectionFor<T extends BuffProvider>(entries: readonly T[], slots: readonly RosterSlot[]): CoverageSection<T> {
  const covered: CoveredEntry<T>[] = []
  const missing: MissingEntry<T>[] = []

  for (const entry of entries) {
    const providedBy = slots.filter((slot) => slotProvides(slot, entry)).length
    if (providedBy > 0) covered.push({ entry, providedBy })
    else missing.push({ entry, needs: describeNeed(entry) })
  }

  return { covered, missing }
}

function suggestionsFor(missingProviders: readonly BuffProvider[], names: readonly string[]): Suggestion[] {
  const suggestions: Suggestion[] = []

  for (const definition of tbcClasses) {
    /*
     * Specs of a class are grouped by the exact set they would add, because listing them separately
     * is noise dressed as choice. An empty roster otherwise opens with three consecutive Paladin
     * rows each claiming the identical blessings, which tells a raid leader nothing except that they
     * need *a* Paladin. Grouping only collapses rows that are genuinely identical.
     */
    const byAddedSet = new Map<string, { specs: TbcSpec[]; wouldAdd: string[] }>()

    for (const spec of definition.specs) {
      const slot: RosterSlot = { className: definition.className, spec }
      /*
       * Spec-specific entries first. The three Shaman specs each add the same class totems plus one
       * thing only they bring — Totem of Wrath, Unleashed Rage, Mana Tide — and the panel truncates,
       * so in data order all three rendered an identical prefix and looked like a duplication bug
       * while actually describing three different recruitment problems.
       */
      const wouldAdd = missingProviders
        .map((provider, index) =>
          slotProvides(slot, provider) ? { name: names[index], specific: provider.providedBySpec !== undefined } : undefined,
        )
        .filter((hit): hit is { name: string; specific: boolean } => hit !== undefined)
        .sort((a, b) => Number(b.specific) - Number(a.specific))
        .map((hit) => hit.name)

      if (wouldAdd.length === 0) continue

      const key = wouldAdd.join(' ')
      const group = byAddedSet.get(key)
      if (group) group.specs.push(spec)
      else byAddedSet.set(key, { specs: [spec], wouldAdd })
    }

    for (const { specs, wouldAdd } of byAddedSet.values()) {
      suggestions.push({
        className: definition.className,
        specs,
        anySpec: specs.length === definition.specs.length,
        wouldAdd,
      })
    }
  }

  return suggestions.sort(
    (a, b) =>
      b.wouldAdd.length - a.wouldAdd.length ||
      a.className.localeCompare(b.className) ||
      a.specs[0].localeCompare(b.specs[0]),
  )
}

/** "Any Paladin", "Elemental Shaman", "Feral or Restoration Druid" — the label the panel shows. */
export function describeSuggestion(suggestion: Suggestion): string {
  if (suggestion.anySpec) return `Any ${suggestion.className}`
  const specs = [...suggestion.specs].sort()
  const joined = specs.length === 1 ? specs[0] : `${specs.slice(0, -1).join(', ')} or ${specs[specs.length - 1]}`
  return `${joined} ${suggestion.className}`
}

const PARTY_BUFFS = sampleBuffs.filter((buff) => isPartyScoped(buff.id))
const RAID_WIDE_BUFFS = sampleBuffs.filter((buff) => !isPartyScoped(buff.id))

function coverageForGroup(group: RaidGroup, groupIndex: number): GroupCoverage {
  const seated = group.filter((slot): slot is RosterSlot => slot !== undefined)
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

  const missingProviders = [
    ...raidWide.missing.map((entry) => entry.entry),
    ...partyScoped.missing.map((entry) => entry.entry),
    ...debuffs.missing.map((entry) => entry.entry),
  ]

  return {
    filled: slots.length,
    size: roster.size,
    remaining: roster.size - slots.length,
    roleCounts,
    raidWide,
    partyScoped,
    debuffs,
    groups: roster.groups.map(coverageForGroup),
    suggestions: suggestionsFor(missingProviders, missingProviders.map((entry) => entry.name)),
  }
}

export { getBuffScope }
