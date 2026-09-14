import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { getDefaultItemForSlot, isEmptySlotItem, twoHanderOccupiesOffHand } from '../../domain/gear/slotCompatibility'
import { statLabels, type StatBlock } from '../../domain/stats/statTypes'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import { deriveTalentModifiers } from '../../domain/talents/talentModifiers'
import type { TalentPoints } from '../../domain/talents/talentTypes'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import { calculateSimulation } from '../simulator/calculateSimulation'
import { pickBestGemPerColor } from '../simulator/findUpgrades'
import { calculateStats } from '../stats/calculateStats'
import { getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, GearItem, GearSlot } from './gearTypes'

/** Everything the comparison needs about the character it is comparing for. */
export type ComparisonContext = {
  character: CharacterProfile
  gear: EquippedGear
  role: CharacterRole
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  target?: SimulationTarget
  talentPoints: TalentPoints
}

export type ComparisonSide = {
  item: GearItem
  /** The gems the score assumes, one per socket, in socket order. Empty for an unsocketed item. */
  gemIds: readonly string[]
  /** The enchant the score assumes — the slot's current one where it stayed legal, otherwise none. */
  enchantId: string | undefined
  /** Whole-character totals with this item equipped, not the item's own stat line. */
  stats: StatBlock
  /**
   * The role's headline number, unrounded.
   *
   * Only the exact figure is carried, deliberately. The simulator also reports a pre-rounded `score`,
   * but a comparison shows two of these beside their difference, and mixing a rounded pair with an
   * exact delta prints "35 → 42, +7.1" — three true numbers that do not add up on screen. The panel
   * rounds all three the same way at the point of display instead.
   */
  scoreExact: number
  /** What the role's headline number is called — "Estimated DPS", "Effective Health" and so on. */
  metricLabel: string
  /** True when this is what the character currently wears in the slot. */
  isEquipped: boolean
  statsEstimated: boolean
}

/**
 * One stat's row, **already rounded for display**.
 *
 * Rounding here rather than in the panel is what keeps the three numbers on a row consistent with
 * each other: `delta` is the difference of the two rounded values, so the arithmetic a reader does
 * in their head agrees with the column. Rounding at render time instead would print 56 and 66 beside
 * a difference of +9.9, which reads as a bug in the table.
 *
 * `Math.round` is the same treatment the stat rail gives these totals, so a value here matches the
 * one on the rail beside it. The unrounded totals are still on `ComparisonSide.stats` for anything
 * that needs them.
 */
export type ComparisonStatRow = {
  stat: keyof StatBlock
  label: string
  left: number
  right: number
  /** `right - left`, so a positive number always means the right-hand item gives more. */
  delta: number
}

export type ItemComparison = {
  slot: GearSlot
  left: ComparisonSide
  right: ComparisonSide
  /** Only the stats the two sides actually differ on, in `statLabels` order. */
  statRows: readonly ComparisonStatRow[]
  /** `right.scoreExact - left.scoreExact`. */
  scoreDelta: number
  /** The same change against the left-hand item's score. */
  percentDelta: number
  metricLabel: string
  /**
   * How far the delta can be trusted, given the data behind the two items — the same trichotomy
   * `findUpgrades` reports, and for the same reason.
   *
   * `sourced` — both sides carry real tooltip values, so the delta is as good as the model.
   * `estimated` — both are stat-budget estimates, so the delta is soft in an unknown direction.
   * `skewed` — a **sourced** item measured against an **estimated** one, which is inflated in a
   * known direction because the sourced items catalogued so far are stronger than the estimates.
   */
  dataQuality: 'sourced' | 'estimated' | 'skewed'
  /** True when either side has sockets, so its score is what the item is worth *once gemmed*. */
  assumesGemming: boolean
}

/**
 * The slots worth offering a comparison for.
 *
 * An off hand held shut by a two-hander is excluded for the same reason `findUpgrades` skips it: the
 * slot holds `EMPTY_OFF_HAND`, so every one-hander in the catalogue reads as an enormous gain over
 * nothing — a comparison the player cannot act on, and one `applyWeaponSlotRules` would undo the
 * moment they tried.
 */
export function comparableSlotsFor(character: CharacterProfile, gear: EquippedGear): readonly GearSlot[] {
  return getVisibleGearSlotsForSpec(character.className, character.spec).filter(
    (slot) => !(slot === 'Off Hand' && twoHanderOccupiesOffHand(gear['Main Hand']?.item)),
  )
}

/**
 * The items that can legally be compared in a slot, which is what the two pickers offer.
 *
 * Unique-equipped conflicts with the paired slot are filtered out, matching `findUpgrades`: an item
 * already worn in the other ring or trinket slot is not a choice the player has. What is currently
 * equipped in *this* slot always stays, since it is the thing most comparisons start from.
 *
 * **Nothing filters the empty-slot placeholder out, because the catalogue does not contain one.**
 * `emptyItemForSlot` builds them on demand for `emptyGear`; `allItems` is the ingested catalogue
 * merged with the curated entries and holds none of them. A guard here would be dead code, and a
 * test asserting "no placeholder is offered" would pass however broken the filtering became. The
 * live risk is at the other end — a *default* resolving to the nothing a new character is wearing —
 * and that is where `defaultComparisonPair` handles it and where the assertion belongs.
 */
export function comparableItemsFor(context: ComparisonContext, slot: GearSlot): readonly GearItem[] {
  const { character, gear } = context
  return getItemsForSlotAndCharacter(slot, character.className, character.spec).filter(
    (item) => item.id === gear[slot]?.item.id || !isItemBlockedByUniqueInGear(item, slot, gear),
  )
}

/**
 * The pair the panel opens on, so arriving at it shows a real comparison rather than an empty frame.
 *
 * **Catalogue order is not usable as a default here, and that is the whole reason this exists.**
 * `getItemsForSlotAndCharacter` spans all of Classic as well as TBC, so the first two entries for
 * Head are a pair of vanilla tier-2 helms — which is the same trap `getDefaultItemForSlot` was
 * written for, arriving at a Phase 2 planner by a different route. Highest item level is not a claim
 * about what is best; it just guarantees the pair on screen belongs to roughly the right era.
 *
 * The left side is what you are wearing whenever that is a real item, since comparing against your
 * own kit is the common case. **A newly created character wears nothing in every slot**, so the
 * `isEmptySlotItem` check is what decides that case rather than an accident: the placeholder is not
 * in `options` either, so the lookup would fall through regardless, but relying on that would make
 * this function correct only because of what the catalogue happens to contain.
 */
export function defaultComparisonPair(
  context: ComparisonContext,
  slot: GearSlot,
): { left: GearItem | undefined; right: GearItem | undefined } {
  const options = comparableItemsFor(context, slot)
  const equipped = context.gear[slot]?.item
  const equippedInOptions =
    equipped && !isEmptySlotItem(equipped) ? options.find((item) => item.id === equipped.id) : undefined

  const left = equippedInOptions ?? getDefaultItemForSlot(slot, options)
  const right = getDefaultItemForSlot(
    slot,
    options.filter((item) => item.id !== left?.id),
  )

  return { left, right }
}

/**
 * Scores one side of the comparison by swapping the item into the character's *current* set.
 *
 * Swapping into the live set rather than scoring the item alone is what makes set bonuses, socket
 * bonuses and the talent scaling of primary stats count — an item's worth genuinely depends on the
 * rest of what you are wearing, and a tooltip-versus-tooltip comparison cannot see any of that.
 */
function scoreSide(
  context: ComparisonContext,
  slot: GearSlot,
  item: GearItem,
  bestGemPerColor: ReturnType<typeof pickBestGemPerColor>,
): ComparisonSide {
  const { character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints } =
    context
  const equipped = gear[slot]

  const gemIds = (item.sockets ?? []).map((socket) => bestGemPerColor.get(socket) ?? '')

  const currentEnchantId = equipped?.enchantId
  const enchantStillLegal =
    currentEnchantId !== undefined &&
    getEnchantsForSlot(slot, character, item).some((enchant) => enchant.id === currentEnchantId)
  const enchantId = enchantStillLegal ? currentEnchantId : undefined

  const candidateGear: EquippedGear = { ...gear, [slot]: { item, gemIds, enchantId } }
  const talents = deriveTalentModifiers(talentPoints)
  const stats = calculateStats(character, candidateGear, activeBuffIds, activeConsumableIds, undefined, talents)
  const simulation = calculateSimulation(
    character,
    candidateGear,
    stats,
    role,
    activeTargetDebuffIds,
    target,
    talentPoints,
    activeBuffIds,
  )

  return {
    item,
    gemIds,
    enchantId,
    stats,
    scoreExact: simulation.scoreExact,
    metricLabel: simulation.metricLabel,
    isEquipped: equipped?.item.id === item.id,
    statsEstimated: item.statsEstimated === true,
  }
}

/**
 * Puts two items for one slot side by side, with the stat difference and the change in the role's
 * headline metric.
 *
 * This answers a question the upgrade finder cannot: *these two dropped, which do I take?* The finder
 * ranks everything that beats what you already wear, so it cannot show you a pair where one is a
 * downgrade, cannot compare two items you do not own, and reports a single score rather than the
 * stat line behind it.
 *
 * **Both sides are treated identically, and that is a deliberate divergence from `findUpgrades`.**
 * The finder scores its baseline with the gems actually socketed and its candidates with the best
 * ones, because its question is "what should I chase from here?". The question here is "which of
 * these two items is better", so giving one side its real gemming and the other an ideal one would
 * fold "you have not gemmed yet" into an answer about the items. Both get the best colour-matched
 * gems and the slot's current enchant where it stays legal.
 *
 * The consequence is that comparing your equipped item against a candidate here can differ from the
 * same pair's delta in the upgrade finder. Both numbers are right for their own question, the panel
 * says which one it is answering, and a test pins the divergence so it reads as a decision rather
 * than the two surfaces drifting apart.
 */
export function compareItems(
  context: ComparisonContext,
  slot: GearSlot,
  leftItem: GearItem,
  rightItem: GearItem,
): ItemComparison {
  const { character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints } =
    context

  const bestGemPerColor = pickBestGemPerColor(
    character,
    gear,
    role,
    activeBuffIds,
    activeConsumableIds,
    activeTargetDebuffIds,
    target,
    talentPoints,
  )

  const left = scoreSide(context, slot, leftItem, bestGemPerColor)
  const right = scoreSide(context, slot, rightItem, bestGemPerColor)

  /*
   * Rows are filtered on the *rounded* values, not the raw ones. A pair differing by less than half a
   * point would otherwise occupy a row reading "8 8 +0" — a difference the table asserts exists and
   * then cannot show. Anything that survives has a visible difference in the column it is listed in.
   */
  const statRows: ComparisonStatRow[] = []
  for (const [stat, label] of statLabels) {
    const leftValue = Math.round(left.stats[stat])
    const rightValue = Math.round(right.stats[stat])
    if (leftValue === rightValue) continue
    statRows.push({ stat, label, left: leftValue, right: rightValue, delta: rightValue - leftValue })
  }

  const scoreDelta = right.scoreExact - left.scoreExact

  /*
   * The metric label is read off a side rather than re-simulated. Both sides ran the same role
   * through the same model, so they agree on what the number is called, and a third run purely to
   * fetch a string would be a third answer to keep in agreement with the other two.
   */
  return {
    slot,
    left,
    right,
    statRows,
    scoreDelta,
    percentDelta: left.scoreExact === 0 ? 0 : (scoreDelta / left.scoreExact) * 100,
    metricLabel: left.metricLabel,
    dataQuality:
      left.statsEstimated === right.statsEstimated ? (left.statsEstimated ? 'estimated' : 'sourced') : 'skewed',
    assumesGemming: left.gemIds.some(Boolean) || right.gemIds.some(Boolean),
  }
}
