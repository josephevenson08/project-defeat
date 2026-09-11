import craftingPathData from './craftingPaths.json' with { type: 'json' }
import type { Profession } from './professionTypes'
import { milestonesWithin, trainingMilestones } from './sampleProfessionTiers'
import type { TrainingMilestone } from './sampleProfessionTiers'

/**
 * A computed levelling step: what to make, how many, and the shopping list for the whole step.
 *
 * **The counts are derived rather than sourced, and that distinction is the point.** Wowhead
 * publishes a recipe's reagents and its orange/yellow/green/grey breakpoints; it publishes no craft
 * count, and neither does anyone else without having worked it out. `compute-leveling-paths.mjs`
 * does the arithmetic, which is what lets this repo carry a levelling path at all — the standing
 * decision in `professionTypes.ts` is that wow-professions.com's recipe orders are linked and never
 * copied, because they are that site's craft.
 */
export type CraftingStep = {
  spellId: number
  name: string
  /** Inclusive-exclusive: the step takes you from the first number to the second. */
  skillRange: [number, number]
  /** Expected crafts to cross the range, rounded up. An expectation, not a guarantee. */
  crafts: number
  /**
   * The whole step's reagents, already multiplied by `crafts`.
   *
   * `craftedFrom` is what the reagent costs **if you make it rather than buy it**, flattened to
   * things this profession cannot craft. Offered rather than substituted, because only the player
   * knows which they have: nobody farms Bolt of Linen Cloth, so 39 bolts really is 78 Linen Cloth —
   * but "31 Primal Air" is a world drop that merely happens to be transmutable, and replacing it
   * with a transmute would be worse advice than saying nothing.
   */
  materials: {
    name: string
    quantity: number
    icon?: string
    /**
     * A vendor is the only source, so this is bought rather than farmed.
     *
     * **Stricter than "a vendor stocks it"**, which is true of Linen Cloth and Peacebloom and would
     * have priced two farmed goods at zero. Vendor-only means unlimited supply at a fixed price, so
     * it costs time to click and nothing to find — which is why the recipe that chose this step
     * excluded these from its count.
     */
    vendorOnly?: boolean
    /** Fixed vendor price per unit, in copper. A game constant, never an auction price. */
    unitCopper?: number
    craftedFrom?: { name: string; quantity: number; icon?: string }[]
  }[]
  /** What the whole step costs at a vendor, in copper. Zero when it buys nothing. */
  vendorCopper?: number
  creates?: string
  createsIcon?: string
  trainerTaught: boolean
}

const PATHS = craftingPathData.paths as unknown as Record<string, CraftingStep[]>

/** How the counts were arrived at, carried to the surface so the page can say so rather than imply it. */
export const craftingPathModel: string = craftingPathData.model

export function craftingPathFor(profession: Profession): CraftingStep[] {
  return PATHS[profession] ?? []
}

/** Every profession with a computed path, which is the nine that craft rather than gather. */
export const professionsWithCraftingPaths: readonly string[] = Object.keys(PATHS)


/**
 * Copper as a player reads it.
 *
 * Trailing zero denominations are dropped — 2g 0s 0c is "2g" — because a shopping total is read at a
 * glance and the zeroes carry nothing. Sub-copper totals cannot occur: every price here is an integer
 * count of copper from the game's own data.
 */
export function formatCopper(copper: number): string {
  if (copper <= 0) return '0c'
  const gold = Math.floor(copper / 10000)
  const silver = Math.floor((copper % 10000) / 100)
  const rest = copper % 100
  return [gold && `${gold}g`, silver && `${silver}s`, rest && `${rest}c`].filter(Boolean).join(' ')
}


/**
 * One row of a crafting profession's summary table.
 *
 * **The crafting side needed the same spine the gathering side got**, and for the same reason: a page
 * that opens on thirty-three step cards answers "where exactly" to somebody who has not yet asked
 * "how long is this going to take". The table is the answer to the second question, and it is the
 * only place training appears before you are already scrolling past it.
 *
 * Materials are trimmed to the three largest by quantity. The full shopping list is on the step
 * below; repeating eleven reagent names here would make the summary longer than the thing it
 * summarises.
 */
export type CraftingPlanRow = {
  skillRange: [number, number]
  name: string
  crafts: number
  /** The three biggest reagents by quantity, which is what the trip is actually for. */
  materials: readonly string[]
  training: readonly TrainingMilestone[]
}

const SUMMARY_MATERIALS = 3

export function craftingPlanRows(profession: Profession): CraftingPlanRow[] {
  const steps = craftingPathFor(profession)
  return steps.map((step, index) => ({
    skillRange: step.skillRange,
    name: step.name,
    crafts: step.crafts,
    materials: [...step.materials]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, SUMMARY_MATERIALS)
      .map((material) => material.name),
    training: milestonesWithin(profession, step.skillRange, index === steps.length - 1),
  }))
}

/** Trainer visits no step's window contains, so a table that claims the whole climb still shows them. */
export function craftingTrainingOutsideSteps(profession: Profession): TrainingMilestone[] {
  const rows = craftingPlanRows(profession)
  if (rows.length === 0) return trainingMilestones(profession)
  const placed = new Set(rows.flatMap((row) => row.training.map((milestone) => milestone.tier)))
  return trainingMilestones(profession).filter((milestone) => !placed.has(milestone.tier))
}
