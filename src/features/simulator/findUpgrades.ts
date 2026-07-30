import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import { getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from '../gear/gearData'
import type { EquippedGear, GearItem, GearSlot } from '../gear/gearTypes'
import { calculateStats } from '../stats/calculateStats'
import { calculateSimulation } from './calculateSimulation'

/** Keeps a single very weak slot from occupying every row of the ranked list. */
const MAX_CANDIDATES_PER_SLOT = 2

export type UpgradeCandidate = {
  slot: GearSlot
  item: GearItem
  /** Name of whatever currently occupies the slot, so the UI can show "X -> Y". */
  replacesName: string
  /** Change in the role's headline metric if this swap is made. */
  scoreDelta: number
  /** Same change expressed against the current score. */
  percentDelta: number
  /** True when the candidate has empty sockets that this comparison did not fill. */
  hasUnfilledSockets: boolean
  /**
   * The enchant the score was computed with — the slot's existing one where it stayed legal,
   * otherwise none. Equipping must reuse this or the realised result won't match the shown delta.
   */
  enchantId: string | undefined
}

export type UpgradeReport = {
  baselineScore: number
  metricLabel: string
  candidates: readonly UpgradeCandidate[]
}

/**
 * Ranks every legal alternative item for every visible slot by how much it would move the
 * simulation, answering "what should I chase next?" directly rather than making the player
 * hand-swap items one at a time.
 *
 * Comparison rules, chosen to match what actually happens when you loot an item:
 * - The candidate is evaluated **ungemmed**. Sockets are not auto-filled, so a socketed upgrade is
 *   generally worth *more* than reported here, and `hasUnfilledSockets` flags that.
 * - The slot's current enchant is carried over when it is still legal on the new item, since that's
 *   the realistic steady state, and dropping it would unfairly penalise every candidate.
 * - Candidates blocked by a unique-equipped conflict with the paired slot are skipped.
 */
export function findUpgrades(
  character: CharacterProfile,
  gear: EquippedGear,
  role: CharacterRole,
  activeBuffIds: readonly string[] = [],
  activeConsumableIds: readonly string[] = [],
  activeTargetDebuffIds: readonly string[] = [],
  target?: SimulationTarget,
  limit = 12,
): UpgradeReport {
  const scoreFor = (candidateGear: EquippedGear) => {
    const stats = calculateStats(character, candidateGear, activeBuffIds, activeConsumableIds)
    return calculateSimulation(character, candidateGear, stats, role, activeTargetDebuffIds, target)
  }

  const baseline = scoreFor(gear)
  const candidates: UpgradeCandidate[] = []

  for (const slot of getVisibleGearSlotsForSpec(character.className, character.spec)) {
    const equipped = gear[slot]
    if (!equipped) continue

    const currentEnchantId = equipped.enchantId

    for (const item of getItemsForSlotAndCharacter(slot, character.className, character.spec)) {
      if (item.id === equipped.item.id) continue
      if (isItemBlockedByUniqueInGear(item, slot, gear)) continue

      const enchantStillLegal =
        currentEnchantId !== undefined &&
        getEnchantsForSlot(slot, character, item).some((enchant) => enchant.id === currentEnchantId)
      const carriedEnchantId = enchantStillLegal ? currentEnchantId : undefined

      const candidateGear: EquippedGear = {
        ...gear,
        [slot]: {
          item,
          gemIds: item.sockets?.map(() => '') ?? [],
          enchantId: carriedEnchantId,
        },
      }

      const scoreDelta = scoreFor(candidateGear).scoreExact - baseline.scoreExact
      if (scoreDelta <= 0) continue

      candidates.push({
        slot,
        item,
        replacesName: equipped.item.name,
        scoreDelta,
        percentDelta: baseline.scoreExact === 0 ? 0 : (scoreDelta / baseline.scoreExact) * 100,
        hasUnfilledSockets: (item.sockets?.length ?? 0) > 0,
        enchantId: carriedEnchantId,
      })
    }
  }

  candidates.sort((a, b) => b.scoreDelta - a.scoreDelta)

  // One weak starting slot (a level-1 training weapon, say) can otherwise sweep every row and hide
  // the fact that four other slots are also upgradeable. Capping per slot keeps the list a picture
  // of the whole character rather than a ranking of one slot's catalog.
  const perSlotCount = new Map<GearSlot, number>()
  const spread = candidates.filter((candidate) => {
    const used = perSlotCount.get(candidate.slot) ?? 0
    if (used >= MAX_CANDIDATES_PER_SLOT) return false
    perSlotCount.set(candidate.slot, used + 1)
    return true
  })

  return {
    baselineScore: baseline.score,
    metricLabel: baseline.metricLabel,
    candidates: spread.slice(0, limit),
  }
}
