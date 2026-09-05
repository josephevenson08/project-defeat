import craftingPathData from './craftingPaths.json' with { type: 'json' }
import type { Profession } from './professionTypes'

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
    craftedFrom?: { name: string; quantity: number; icon?: string }[]
  }[]
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
