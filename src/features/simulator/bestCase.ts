import { getBisListForSpec } from '../../domain/bis/bisLists'
import { sampleBuffs } from '../../domain/buffs/sampleBuffs'
import { modelledTargetDebuffs } from '../../domain/buffs/sampleTargetDebuffs'
import type { CharacterProfile, CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { racesByClass } from '../../domain/character/races'
import { getRoleForSpec } from '../../domain/character/tbcClasses'
import { sampleConsumables } from '../../domain/consumables/sampleConsumables'
import { normalizeGearForCharacter } from '../../domain/gear/characterItemRules'
import { defaultGear } from '../../domain/gear/defaultGear'
import { getItemById } from '../../domain/gear/itemCatalogue'
import { dpsReference, type DpsReference } from '../../domain/simulation/dpsReference'
import { getTalentData } from '../../domain/talents/sampleTalents'
import talentBuilds from '../../domain/talents/talentBuilds.json' with { type: 'json' }
import { deriveTalentModifiers } from '../../domain/talents/talentModifiers'
import type { EquippedGear, GearSlot } from '../gear/gearTypes'
import { calculateStats } from '../stats/calculateStats'
import { calculateSimulation } from './calculateSimulation'

/*
 * Cast at the boundary, as the other generated-JSON modules do: TypeScript infers every build's own
 * literal keys from the file otherwise, and no two builds share a shape.
 */
type TalentBuild = { className: string; spec: string; points: Record<string, number> }
const sourcedBuilds = talentBuilds.builds as unknown as readonly TalentBuild[]

/**
 * Dresses a spec in its own rank-1 BiS, buffs and consumables it fully, and gives it its sourced
 * raiding talents — the strongest character this app can currently describe.
 *
 * Not a claim that a real raider looks like this. It is a **ceiling**, and the point of measuring the
 * ceiling is that anything below it in the comparison against the logs is a gap in the model rather
 * than a gap in what the player brought.
 *
 * Moved here from `tests/planner.spec.ts` in port step 4 (2026-10-17), unchanged, so the Simulation
 * tab's "how far to trust it" panel and the calibration test that pins the range read one function.
 * The reasons behind each choice below were written beside it in the test and are kept with it.
 */
export function bestCaseSimulation(className: TbcClass, spec: TbcSpec, role: CharacterRole = getRoleForSpec(className, spec)) {
  // Every first entry in `racesByClass` is an Alliance race, so the faction stays correct.
  const character: CharacterProfile = { faction: 'Alliance', race: racesByClass[className][0], className, spec }

  let gear: EquippedGear = normalizeGearForCharacter(defaultGear, className, spec)
  const list = getBisListForSpec(className, spec)
  const filled = new Set<string>()

  /*
   * **Gems and enchants come with the item, and leaving them off was worth about a quarter of the
   * gap this measures.** `defaultGear` sets no gems or enchant, so the entries' own
   * `recommendedGemIds` / `recommendedEnchantId` are read. Coverage is partial (about half a spec's
   * rank-1 entries carry gems), so this raises the floor rather than reaching the true ceiling.
   */
  const equip = (slot: string, entry: { itemId: string; recommendedEnchantId?: string; recommendedGemIds?: string[] }) => {
    const item = getItemById(entry.itemId)
    if (!item) return false
    gear = {
      ...gear,
      [slot]: {
        ...gear[slot as GearSlot],
        item,
        gemIds: entry.recommendedGemIds ?? [],
        ...(entry.recommendedEnchantId ? { enchantId: entry.recommendedEnchantId } : {}),
      },
    } as EquippedGear
    return true
  }

  for (const entry of list?.entries ?? []) {
    if (entry.rank !== 1 || filled.has(entry.slot)) continue
    if (equip(entry.slot, entry)) filled.add(entry.slot)
  }

  // The ranked list names `Finger 1` and `Trinket 1` only; the second-ranked pick is what a real
  // player puts in the other one.
  for (const [ranked, paired] of [
    ['Finger 1', 'Finger 2'],
    ['Trinket 1', 'Trinket 2'],
  ] as const) {
    if (filled.has(paired)) continue
    const second = list?.entries.find((entry) => entry.slot === ranked && entry.rank === 2)
    if (second && equip(paired, second)) filled.add(paired)
  }

  /*
   * **A real raiding build where upstream has one** (`talentBuilds.json`, wowsims' presets for 17 of
   * the 20 DPS specs), and for the other three the spec's own tree filled in listed order and stopped
   * at 61, the level-70 budget, rather than an invented build — the repo owner's call.
   */
  const sourced = sourcedBuilds.find((build) => build.className === className && build.spec === spec)
  const points: Record<number, number> = sourced ? { ...sourced.points } : {}
  if (!sourced) {
    const tree = getTalentData(className)?.trees.find((entry) => entry.spec === spec)
    let spent = 0
    for (const talent of tree?.talents ?? []) {
      if (spent >= 61) break
      const rank = Math.min(talent.maxRank, 61 - spent)
      points[talent.id] = rank
      spent += rank
    }
  }

  const buffIds = sampleBuffs.map((buff) => buff.id)
  const stats = calculateStats(
    character,
    gear,
    buffIds,
    sampleConsumables.map((consumable) => consumable.id),
    undefined,
    deriveTalentModifiers(points),
  )

  /*
   * Every modelled target debuff, because a raid always has them (leaving them off understated every
   * physical spec by about 28%), and `buffIds` to the simulator as well as to `calculateStats`, or
   * percentage haste and damage multipliers contribute nothing while the run still looks right.
   */
  const debuffs = modelledTargetDebuffs.map((debuff) => debuff.id)
  return {
    result: calculateSimulation(character, gear, stats, role, debuffs, undefined, points, buffIds),
    slots: filled.size,
  }
}

/** One DPS spec's best case by this model, beside what players of it average. */
export type SpecTrust = DpsReference & {
  /** The model's best case, unrounded. */
  best: number
  /** How many times the model's best case the logs read: 1.5 means the model reads 1.5× low. */
  ratio: number
}

let trustRows: readonly SpecTrust[] | undefined

/**
 * Every DPS spec's best case against archon.gg's observed average, in the reference's own order
 * (highest observed first). Twenty simulations, worked out once on first use: it depends on no
 * character, only on the data.
 */
export function specTrust(): readonly SpecTrust[] {
  trustRows ??= dpsReference.map((reference) => {
    const best = bestCaseSimulation(reference.className, reference.spec).result.scoreExact
    return { ...reference, best, ratio: reference.dps / best }
  })
  return trustRows
}

/** How low the model reads across all 20 DPS specs, and which spec reads lowest. */
export function trustRange(rows: readonly SpecTrust[] = specTrust()) {
  const sorted = [...rows].sort((a, b) => a.ratio - b.ratio)
  return { low: sorted[0].ratio, high: sorted[sorted.length - 1].ratio, worst: sorted[sorted.length - 1] }
}
