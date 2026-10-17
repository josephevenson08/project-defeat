import type { Buff, TargetDebuff } from '../buffs/buffTypes'
import { anniversaryRaidWide, castOnAnyGroup, getBuffScope, isPartyScoped } from '../buffs/buffScope'
import { sampleBuffs } from '../buffs/sampleBuffs'
import { sampleTargetDebuffs } from '../buffs/sampleTargetDebuffs'
import { describeNeed, slotProvides } from './buffCoverage'
import { raidBuilds, type RaidBuild } from './raidBuilds'
import { filledSlots, type RaidGroup, type Roster, type RosterSlot } from './rosterTypes'

/**
 * The advice under the raid table (port step 5, from the decided Raid Composition design): what one
 * more seat would add to each group, and what the raid is missing with who fixes it. Both read the
 * same "someone here can cast it" counting as `computeCoverage`, so the advice and the coverage lists
 * can never disagree.
 */

const PARTY_BUFFS = sampleBuffs.filter((buff) => isPartyScoped(buff.id))
const WIDE_BUFFS = sampleBuffs.filter((buff) => !isPartyScoped(buff.id))

/** How far a buff reaches, in the words the page tags it with. */
export type BuffReach = 'Party' | 'Any group' | 'Raid' | 'Single' | 'Boss'

export function buffReach(id: string): BuffReach {
  if (isPartyScoped(id)) return 'Party'
  if (castOnAnyGroup(id)) return 'Any group'
  if (id in anniversaryRaidWide) return 'Raid'
  const scope = getBuffScope(id)
  if (scope === 'Single') return 'Single'
  if (scope === 'Target') return 'Boss'
  return 'Raid'
}

const seated = (group: RaidGroup) => group.filter((slot): slot is RosterSlot => slot !== undefined)

/** The party buffs nobody in this group brings, so the group does without them. */
export function lackingPartyBuffs(group: RaidGroup): Buff[] {
  const members = seated(group)
  return PARTY_BUFFS.filter((buff) => !members.some((slot) => slotProvides(slot, buff)))
}

export type SeatSuggestion = {
  build: RaidBuild
  /** The party buffs this build would bring the group that it lacks now. */
  gains: readonly Buff[]
  /** The group's first open seat, or -1 when it is full (then the suggestion is "if one seat changed"). */
  openSeat: number
}

/**
 * The one build that would bring this group the most party buffs it lacks. Ties go to the first in
 * the palette's order, so the answer is stable; undefined when the group already has every one.
 */
export function bestAddition(group: RaidGroup): SeatSuggestion | undefined {
  const lacking = lackingPartyBuffs(group)
  let best: SeatSuggestion | undefined
  for (const build of raidBuilds) {
    const gains = lacking.filter((buff) => slotProvides({ className: build.className, spec: build.spec }, buff))
    if (gains.length > (best?.gains.length ?? 0)) best = { build, gains, openSeat: group.indexOf(undefined) }
  }
  return best
}

export type RaidGap = {
  entry: Buff | TargetDebuff
  reach: BuffReach
  /** "an Enhancement Shaman", "any Druid": what a raid leader would go looking for. */
  needs: string
}

export type GroupGaps = {
  groupIndex: number
  lacking: readonly Buff[]
  /** The same buffs grouped by who would bring them, in the order they first appear. */
  byNeed: readonly { needs: string; buffs: readonly Buff[] }[]
}

/**
 * What the raid is missing, and who fixes it: every buff and debuff nobody seated can cast, then each
 * group's missing party buffs grouped by the build that would bring them. An empty roster has every
 * gap, so the caller says that in a sentence instead of listing the whole catalogue.
 */
export function raidGaps(roster: Roster): { raid: readonly RaidGap[]; groups: readonly GroupGaps[] } {
  const slots = filledSlots(roster)
  const nobody = (entry: Buff | TargetDebuff) => !slots.some((slot) => slotProvides(slot, entry))
  const gap = (entry: Buff | TargetDebuff): RaidGap => ({ entry, reach: buffReach(entry.id), needs: describeNeed(entry) })

  const raid = [...PARTY_BUFFS, ...WIDE_BUFFS, ...sampleTargetDebuffs].filter(nobody).map(gap)

  const groups = roster.groups
    .map((group, groupIndex) => {
      const lacking = lackingPartyBuffs(group)
      const byNeed: { needs: string; buffs: Buff[] }[] = []
      for (const buff of lacking) {
        const needs = describeNeed(buff)
        const entry = byNeed.find((row) => row.needs === needs)
        if (entry) entry.buffs.push(buff)
        else byNeed.push({ needs, buffs: [buff] })
      }
      return { groupIndex, lacking, byNeed }
    })
    .filter((group) => group.lacking.length > 0)

  return { raid, groups }
}

/** How many party-scoped buffs there are to receive: the denominator of every group's coverage. */
export const partyBuffCount = PARTY_BUFFS.length
