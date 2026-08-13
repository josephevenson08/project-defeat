import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { sampleGems } from '../../domain/gems/sampleGems'
import type { SocketColor } from '../../domain/gear/itemTypes'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import { getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from '../gear/gearData'
import { twoHanderOccupiesOffHand } from '../../domain/gear/slotCompatibility'
import type { EquippedGear, GearItem, GearSlot } from '../gear/gearTypes'
import { calculateStats } from '../stats/calculateStats'
import { calculateSimulation } from './calculateSimulation'

/** Keeps a single very weak slot from occupying every row of the ranked list. */
const MAX_CANDIDATES_PER_SLOT = 2

const SOCKET_COLORS: readonly SocketColor[] = ['Meta', 'Red', 'Yellow', 'Blue']

/**
 * Picks the single best gem for each socket colour, by measuring what each gem's stats are actually
 * worth to *this* character through the simulation rather than assuming a stat priority.
 *
 * Only same-colour gems are considered. Any gem physically fits any socket in TBC, but the item's
 * socket bonus only pays out when every socket is colour-matched, and `calculateStats` models that —
 * so mixing colours to chase a marginally better raw gem would usually lose more than it gains.
 *
 * A colour whose gems are all worth nothing to this role still gets its best-scoring gem rather than
 * no gem at all. `socketBonusIsActive` fails on an empty socket exactly as it fails on a mismatched
 * one, so leaving it empty loses the socket bonus *and* the gem's stats, while a matched gem that
 * happens to score zero keeps the bonus. That is the common case rather than an edge one: every Blue
 * gem scores zero for both DPS roles and every Red gem scores zero for Healer, so slots like
 * `vambraces-of-ending` used to be reported permanently ungemmed.
 *
 * Still an approximation: the genuinely optimal choice is per-item, since forfeiting a small socket
 * bonus for a much stronger off-colour gem can win. Modelling that needs a per-candidate-item
 * comparison rather than one map built per report, which is a different cost class.
 *
 * This costs one simulation run per gem, once per report, not once per candidate item.
 */
function pickBestGemPerColor(
  character: CharacterProfile,
  gear: EquippedGear,
  role: CharacterRole,
  activeBuffIds: readonly string[],
  activeConsumableIds: readonly string[],
  activeTargetDebuffIds: readonly string[],
  target: SimulationTarget | undefined,
): Map<SocketColor, string> {
  const scoreWithBonus = (bonusStats: Parameters<typeof calculateStats>[4]) => {
    const stats = calculateStats(character, gear, activeBuffIds, activeConsumableIds, bonusStats)
    return calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, target).scoreExact
  }

  const baseline = scoreWithBonus(undefined)
  const best = new Map<SocketColor, string>()

  for (const color of SOCKET_COLORS) {
    let bestId: string | undefined
    let bestDelta = Number.NEGATIVE_INFINITY

    for (const gem of sampleGems.filter((entry) => entry.color === color)) {
      const delta = scoreWithBonus(gem.stats) - baseline
      if (delta > bestDelta) {
        bestDelta = delta
        bestId = gem.id
      }
    }

    // No entry only when the catalog holds no gem of this colour at all. Gems are pure stat adds, so
    // a delta is never negative and ties resolve to catalog order — arbitrary, but only ever among
    // gems this role scores identically.
    if (bestId) best.set(color, bestId)
  }

  return best
}

export type UpgradeCandidate = {
  slot: GearSlot
  item: GearItem
  /** Name of whatever currently occupies the slot, so the UI can show "X -> Y". */
  replacesName: string
  /** Change in the role's headline metric if this swap is made. */
  scoreDelta: number
  /** Same change expressed against the current score. */
  percentDelta: number
  /** The gems the score assumes, one per socket, in socket order. Empty for an unsocketed item. */
  gemIds: readonly string[]
  /** True when the score assumes gemming, so the delta is "once gemmed", not "the moment you equip it". */
  assumesGemming: boolean
  /**
   * How far this row's delta can be trusted, given the data behind the two items.
   *
   * `sourced` — both sides carry real tooltip values, so the delta is as good as the model.
   * `estimated` — one or both are stat-budget estimates, so the delta is soft in an unknown direction.
   * `skewed` — the worst case: a **sourced** item measured against an **estimated** one. The sourced
   * items catalogued so far are markedly stronger than the estimates around them, so these deltas are
   * inflated in a *known* direction and this is exactly the comparison the ranking is built on.
   */
  dataQuality: 'sourced' | 'estimated' | 'skewed'
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
 * Comparison rules, chosen to match what someone actually does with an item they loot:
 * - Sockets are filled with the best colour-matched gem for this character, so the delta is the
 *   item's value **once gemmed**. Scoring candidates bare systematically understated socketed items
 *   against unsocketed ones, which is exactly backwards for a "what should I chase?" list — nobody
 *   leaves a raid piece ungemmed. `assumesGemming` marks the rows this applies to.
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
  const bestGemPerColor = pickBestGemPerColor(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target)
  const gemsForItem = (item: GearItem) => (item.sockets ?? []).map((socket) => bestGemPerColor.get(socket) ?? '')

  const candidates: UpgradeCandidate[] = []

  for (const slot of getVisibleGearSlotsForSpec(character.className, character.spec)) {
    const equipped = gear[slot]
    if (!equipped) continue

    /*
     * An off hand held shut by a two-hander has no legal candidates, and skipping it matters more
     * than it sounds: the slot holds `EMPTY_OFF_HAND`, so every one-hander in the catalogue scores as
     * an enormous gain against nothing. It topped the list at +31 DPS — an upgrade the player cannot
     * take, and one `applyWeaponSlotRules` would undo the moment they tried.
     */
    if (slot === 'Off Hand' && twoHanderOccupiesOffHand(gear['Main Hand']?.item)) continue

    const currentEnchantId = equipped.enchantId

    for (const item of getItemsForSlotAndCharacter(slot, character.className, character.spec)) {
      if (item.id === equipped.item.id) continue
      if (isItemBlockedByUniqueInGear(item, slot, gear)) continue

      const enchantStillLegal =
        currentEnchantId !== undefined &&
        getEnchantsForSlot(slot, character, item).some((enchant) => enchant.id === currentEnchantId)
      const carriedEnchantId = enchantStillLegal ? currentEnchantId : undefined

      const gemIds = gemsForItem(item)
      const candidateGear: EquippedGear = {
        ...gear,
        [slot]: {
          item,
          gemIds,
          enchantId: carriedEnchantId,
        },
      }

      const scoreDelta = scoreFor(candidateGear).scoreExact - baseline.scoreExact
      if (scoreDelta <= 0) continue

      const candidateEstimated = item.needsVerification === true
      const equippedEstimated = equipped.item.needsVerification === true
      const dataQuality: UpgradeCandidate['dataQuality'] =
        candidateEstimated === equippedEstimated ? (candidateEstimated ? 'estimated' : 'sourced') : 'skewed'

      candidates.push({
        slot,
        item,
        replacesName: equipped.item.name,
        scoreDelta,
        percentDelta: baseline.scoreExact === 0 ? 0 : (scoreDelta / baseline.scoreExact) * 100,
        gemIds,
        assumesGemming: gemIds.some((gemId) => gemId !== ''),
        enchantId: carriedEnchantId,
        dataQuality,
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
