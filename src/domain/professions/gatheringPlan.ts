/**
 * Turns a written range into the thing the page draws.
 *
 * Three jobs, and the split between them is the point: **which nodes a range covers is derived**
 * from the ingest, **which zones get a tab is decided by the data**, and **what order those tabs
 * appear in is the one editorial call**. Mixing those is how a page ends up recommending a level
 * 30-40 zone to a level 20 player because it happened to have the most spawns.
 */

import { gatheringNodes, routesForNodes } from './farmingRoutes'
import type { GatheringNode, RangeRoute } from './farmingRoutes'
import type { GatheringRange, GatheringNodeRef } from './gatheringRangeTypes'
import { gatheringGuides } from './gatheringGuides'
import type { Profession } from './professionTypes'
import { trainingMilestones } from './sampleProfessionTiers'
import type { TrainingMilestone } from './sampleProfessionTiers'

export function guideFor(profession: Profession) {
  return gatheringGuides.find((guide) => guide.profession === profession)
}

export const professionsWithGatheringGuides: readonly Profession[] = gatheringGuides.map(
  (guide) => guide.profession,
)

/**
 * The nodes a range unlocks, **derived from `requiredSkill` rather than written down**.
 *
 * A range cannot name an ore you cannot mine yet, because nothing names anything: the window
 * decides. It also means a re-ingest that moves a requirement moves the node to the right section
 * on its own, instead of leaving a hand-written list pointing at the old one.
 *
 * The window is half-open at the top so shared boundaries land once — Mithril's 175 ends the
 * 125-175 range and begins 175-245, and belongs only to the second. The exception is a range that
 * ends at the 375 cap, which has to include it or Khorium and Mana Thistle would fall off the end of
 * the profession.
 */
export function nodesForRange(profession: Profession, skillRange: readonly [number, number]): GatheringNode[] {
  const [low, high] = skillRange
  const topIsCap = high >= 375
  return gatheringNodes
    .filter((node) => node.profession === profession)
    .filter((node) => node.requiredSkill >= low && (topIsCap ? node.requiredSkill <= high : node.requiredSkill < high))
    .sort((a, b) => a.requiredSkill - b.requiredSkill || a.material.localeCompare(b.material))
}

/** What a range gathers, for the chips above the map. Derived for world nodes, written for the rest. */
export function materialsForRange(profession: Profession, range: GatheringRange): readonly string[] {
  if (range.materials) return range.materials
  const seen = new Set<string>()
  return nodesForRange(profession, range.skillRange)
    .map((node) => node.material)
    .filter((material) => (seen.has(material) ? false : seen.add(material)))
}

/**
 * A zone earns a tab if the range recommends it, or if it holds enough nodes to be worth the ride.
 *
 * **The threshold exists because a merged range drags in noise.** Herbalism's 350-375 window picks up
 * Blade's Edge Mountains and Hellfire Peninsula on the strength of seven and six Nightmare Vine
 * spawns against Netherstorm's 189 — technically true, useless as a tab, and it pushes the zone
 * somebody actually wants off the end of the nav.
 */
const TAB_SHARE = 0.15

/** Beyond this the nav wraps to three lines and stops being a chooser. */
const MAX_TABS = 8

/**
 * Every zone worth offering for a range, **in the order the range recommends**.
 *
 * Density decides who is eligible; the written list decides who goes first. Silver's busiest zones
 * are Arathi Highlands, Thousand Needles and Desolace, all level 30-40 — a player mining Silver at
 * skill 75 is around level 20, so a density-sorted nav would hand them the zone that kills them. The
 * recommended zones come first, whatever their counts, and the rest follow by density.
 *
 * A recommended zone with no published coordinates simply has no tab. That is not an omission worth
 * papering over: Darkshore is where a night elf starts mining and the ingest kept only Copper's
 * three busiest zones, so the prose names it and the map cannot.
 */
export function routesForRange(profession: Profession, range: GatheringRange): RangeRoute[] {
  const refs: GatheringNodeRef[] = nodesForRange(profession, range.skillRange).map((node) => ({
    material: node.material,
    atSkill: node.requiredSkill,
  }))
  const routes = routesForNodes(refs)
  if (routes.length === 0) return []

  const busiest = Math.max(...routes.map((route) => route.spawnCount))
  const rank = new Map(range.zones.map((zone, index) => [zone, index]))

  const eligible = routes.filter(
    (route) => rank.has(route.zone) || route.spawnCount >= busiest * TAB_SHARE,
  )

  return eligible
    .sort((a, b) => {
      const aRank = rank.get(a.zone) ?? Number.MAX_SAFE_INTEGER
      const bRank = rank.get(b.zone) ?? Number.MAX_SAFE_INTEGER
      return aRank - bRank || b.spawnCount - a.spawnCount
    })
    .slice(0, MAX_TABS)
}

/**
 * Zones a range recommends that have no map, **said out loud rather than quietly dropped**.
 *
 * The ingest keeps each node's three busiest zones, which is the right trade for a 1 MB bundle and
 * the wrong thing to stay silent about: Thousand Needles and Badlands are standard advice for the
 * 125-175 mining range and neither is in Iron's top three, so a page that only showed tabs would
 * look like it had never heard of them. Naming them turns a bundle decision into a visible one.
 */
export function recommendedWithoutMaps(profession: Profession, range: GatheringRange): string[] {
  const mapped = new Set(routesForRange(profession, range).map((route) => route.zone))
  return range.zones.filter((zone) => !mapped.has(zone))
}

/**
 * One row of the summary table: a skill window, what to do in it, and any trainer stop it contains.
 *
 * **The table is the reason training is impossible to miss.** Reference guides weave it into the row
 * — "40x Smelt Mithril until 200, then visit your trainer" — rather than parking a tier table at the
 * top of the page, because the moment a player needs to know is the moment their bar stops moving.
 * A milestone belongs to the row whose window contains the skill it unlocks.
 */
export type PlanRow = {
  skillRange: [number, number]
  materials: readonly string[]
  zones: readonly string[]
  /** Trainer visits that fall inside this row's window. */
  training: readonly TrainingMilestone[]
}

export function planRows(profession: Profession): PlanRow[] {
  const guide = guideFor(profession)
  if (!guide) return []
  const milestones = trainingMilestones(profession)

  return guide.ranges.map((range, index) => {
    const [low, high] = range.skillRange
    const last = index === guide.ranges.length - 1
    return {
      skillRange: range.skillRange,
      materials: materialsForRange(profession, range),
      zones: range.zones,
      training: milestones.filter(
        (milestone) =>
          milestone.atSkill >= low && (last ? milestone.atSkill <= high : milestone.atSkill < high),
      ),
    }
  })
}

/**
 * Trainer visits that fall below the first range or above the last.
 *
 * Apprentice is trainable at skill 1 and every range starts there, so in practice this catches the
 * other end — a tier whose skill sits past the last range's window would otherwise vanish from a
 * table that claims to cover the whole climb.
 */
export function trainingOutsideRanges(profession: Profession): TrainingMilestone[] {
  const rows = planRows(profession)
  if (rows.length === 0) return trainingMilestones(profession)
  const placed = new Set(rows.flatMap((row) => row.training.map((milestone) => milestone.tier)))
  return trainingMilestones(profession).filter((milestone) => !placed.has(milestone.tier))
}
