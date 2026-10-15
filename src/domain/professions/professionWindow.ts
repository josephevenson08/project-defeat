/**
 * What the Professions tab asks of the data (port step 3, 2026-10-15): the decided design is the game's
 * own profession window, with a "Which two" comparison behind a switch.
 *
 * - **The window** colours every recipe on a path at the player's skill from the recipe's own
 *   thresholds (`recipeColorAt`), finds the step they are on (`stepIndexAt`) and puts each trainer
 *   stop in the list where the bar stops moving (`withTrainerStops`).
 * - **Which two** needs to know what each profession makes for a spec — the profession-made items on
 *   that spec's Wowhead Phase 2 list (`placesFor`) — and which gathering profession feeds which
 *   crafting one (`fedBy`, `suppliesOf`), as a share of the crafter's farmed materials.
 *
 * All of it reads the data the rest of the app reads: the computed crafting paths, the gathering
 * guides, `bisRankings.json` and the item catalogue, so a rank here cannot disagree with Ranked Gear.
 */

import rankings from '../bis/bisRankings.json' with { type: 'json' }
import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { getItemByWowItemId } from '../gear/itemCatalogue'
import { getIconName } from '../icons/icons'
import { craftingPathFor } from './craftingPaths'
import { guideFor, materialsForRange } from './gatheringPlan'
import type { Profession } from './professionTypes'
import { allProfessions } from './sampleProfessions'
import type { TrainingMilestone } from './sampleProfessionTiers'

/* ── The window ──────────────────────────────────────────────────────────────────────────────── */

/** A recipe's colour at a skill, the game's four plus red for one you cannot learn yet. */
export type RecipeColor = 'red' | 'orange' | 'yellow' | 'green' | 'grey'

/** What each colour means for the bar, in the words the window uses. */
export const RECIPE_COLOR_WORD: Record<RecipeColor, string> = {
  red: 'not learnable yet',
  orange: 'always a point',
  yellow: 'usually a point',
  green: 'sometimes a point',
  grey: 'no more points',
}

/**
 * Orange from the first threshold, yellow from the second, green from the third, grey from the
 * fourth: Wowhead's numbers for the recipe, which are the game's. Rough Sharpening Stone's are
 * 1/15/35/55, so it is orange at 1 and green at 40.
 */
export function recipeColorAt(colors: readonly [number, number, number, number], skill: number): RecipeColor {
  const [orange, yellow, green, grey] = colors
  if (skill < orange) return 'red'
  if (skill < yellow) return 'orange'
  if (skill < green) return 'yellow'
  if (skill < grey) return 'green'
  return 'grey'
}

/**
 * The step a skill falls in. Half-open, as the paths are, except that the last step includes its top
 * so that 375 lands somewhere. Below the first step it is the first; past the end, the last.
 */
export function stepIndexAt(steps: readonly { skillRange: readonly [number, number] }[], skill: number): number {
  const last = steps.length - 1
  const index = steps.findIndex(
    ({ skillRange: [from, to] }, i) => skill >= from && (skill < to || (i === last && skill <= to)),
  )
  if (index >= 0) return index
  return steps.length > 0 && skill >= steps[last].skillRange[1] ? last : 0
}

export type WindowRow = { kind: 'train'; milestone: TrainingMilestone } | { kind: 'step'; index: number }

/**
 * The list the window draws: every step, with each trainer stop placed before the first step whose
 * window reaches it — which is where the player's bar stops moving. A stop below the first step goes
 * before it, and one past the last step goes after it, so no stop is dropped.
 */
export function withTrainerStops(
  steps: readonly { skillRange: readonly [number, number] }[],
  milestones: readonly TrainingMilestone[],
): WindowRow[] {
  const waiting = [...milestones].sort((a, b) => a.atSkill - b.atSkill)
  const rows: WindowRow[] = []
  steps.forEach(({ skillRange: [from, to] }, index) => {
    while (waiting.length > 0 && waiting[0].atSkill < to && (waiting[0].atSkill >= from || index === 0)) {
      rows.push({ kind: 'train', milestone: waiting.shift()! })
    }
    rows.push({ kind: 'step', index })
  })
  for (const milestone of waiting) rows.push({ kind: 'train', milestone })
  return rows
}

/* ── Who gathers what, and who feeds whom ────────────────────────────────────────────────────── */

/** What Mining brings in besides ore: the stones it turns up and the bars smelted from what it mines. */
const MINED_STONES = ['Rough Stone', 'Coarse Stone', 'Heavy Stone', 'Solid Stone', 'Dense Stone']
const SMELTED_BARS = [
  'Copper Bar',
  'Tin Bar',
  'Bronze Bar',
  'Iron Bar',
  'Steel Bar',
  'Mithril Bar',
  'Thorium Bar',
  'Fel Iron Bar',
  'Adamantite Bar',
  'Khorium Bar',
  'Eternium Bar',
  'Silver Bar',
  'Gold Bar',
  'Truesilver Bar',
  'Hardened Adamantite Bar',
  'Felsteel Bar',
  'Dark Iron Bar',
]

/**
 * Each gathering profession's materials: what its ranges gather (derived for Mining and Herbalism,
 * written for Skinning and Fishing), plus, for Mining, the stones and the bars made from its ores.
 */
const gathered = new Map<Profession, Set<string>>()
for (const profession of allProfessions) {
  const guide = guideFor(profession)
  if (!guide) continue
  const materials = new Set<string>()
  for (const range of guide.ranges) {
    for (const material of materialsForRange(profession, range)) {
      materials.add(material)
      if (/ Ore$/.test(material)) materials.add(material.replace(/ Ore$/, ' Bar'))
    }
  }
  if (profession === 'Mining') for (const extra of [...MINED_STONES, ...SMELTED_BARS]) materials.add(extra)
  gathered.set(profession, materials)
}

/** The gathering profession that brings a material in, for the window's reagent list. */
export function gathererOf(material: string): Profession | undefined {
  for (const [profession, materials] of gathered) if (materials.has(material)) return profession
  return undefined
}

/**
 * What share of a crafting path's farmed materials each gatherer brings in, as whole percentages.
 *
 * Farmed means not vendor-only. A reagent the profession can make from something farmed counts as
 * what it is made from (78 Linen Cloth rather than 39 Bolts), since that is what someone has to go
 * and get. Mining supplies 97% of Blacksmithing's.
 */
export function feedShares(crafter: Profession): Map<Profession, number> {
  const farmed = new Map<string, number>()
  let total = 0
  for (const step of craftingPathFor(crafter)) {
    for (const material of step.materials) {
      if (material.vendorOnly) continue
      for (const part of material.craftedFrom?.length ? material.craftedFrom : [material]) {
        farmed.set(part.name, (farmed.get(part.name) ?? 0) + part.quantity)
        total += part.quantity
      }
    }
  }
  const shares = new Map<Profession, number>()
  if (total === 0) return shares
  for (const [gatherer, materials] of gathered) {
    const quantity = [...farmed].filter(([name]) => materials.has(name)).reduce((sum, [, count]) => sum + count, 0)
    if (quantity > 0) shares.set(gatherer, Math.round((quantity / total) * 100))
  }
  return shares
}

/** A share below this is a few reagents rather than a supply line, and is not called feeding. */
const FEEDS_AT = 10

/** The gatherers that feed a crafter, biggest share first. */
export function fedBy(crafter: Profession): { gatherer: Profession; share: number }[] {
  return [...feedShares(crafter)]
    .filter(([, share]) => share >= FEEDS_AT)
    .map(([gatherer, share]) => ({ gatherer, share }))
    .sort((a, b) => b.share - a.share)
}

/** The crafters a gatherer supplies, biggest share first. */
export function suppliesOf(gatherer: Profession): { crafter: Profession; share: number }[] {
  return allProfessions
    .map((crafter) => ({ crafter, share: feedShares(crafter).get(gatherer) ?? 0 }))
    .filter(({ share }) => share >= FEEDS_AT)
    .sort((a, b) => b.share - a.share)
}

/* ── What each profession makes for a spec ───────────────────────────────────────────────────── */

/** One Wowhead Phase 2 list, by the class and spec it is for. */
export type SpecList = { key: string; className: TbcClass; spec: TbcSpec }

export const specLists: readonly SpecList[] = Object.entries(rankings.specs).map(([key, list]) => ({
  key,
  className: list.className as TbcClass,
  spec: list.spec as TbcSpec,
}))

export const specListKey = (spec: { className: string; spec: string }) => `${spec.className}|${spec.spec}`

/** A profession-made item's place on a spec's list. */
export type ListPlace = {
  listKey: string
  slot: string
  rank: number
  wowItemId: number
  name: string
  icon?: string
  bindsOnPickup: boolean
  /** The specialisation that makes it, where it is not the base profession ("Dragonscale Leatherworking"). */
  via?: string
  note?: string
}

/** Wowhead names the specialisation in a source ("Profession: Weaponsmith"); this finds its profession. */
const BASE_PROFESSION: [Profession, RegExp][] = [
  ['Leatherworking', /Leatherworking/],
  ['Blacksmithing', /Blacksmith|Armorsmith|Swordsmith|Hammersmith|Axesmith|Weaponsmith/],
  ['Engineering', /Engineering/],
  ['Tailoring', /Tailoring/],
  ['Jewelcrafting', /Jewelcrafting/],
  ['Alchemy', /Alchemy/],
  ['Enchanting', /Enchanting/],
]

const places = new Map<Profession, ListPlace[]>()
for (const [listKey, list] of Object.entries(rankings.specs)) {
  for (const [slot, rows] of Object.entries(list.slots)) {
    for (const row of rows) {
      const source = (row as { source?: string }).source ?? ''
      const match = /Profession: ([^-(]+?)\s*(?:-|\(|$)/.exec(source)
      if (!match) continue
      const label = match[1].trim()
      const profession = BASE_PROFESSION.find(([, pattern]) => pattern.test(label))?.[0]
      if (!profession) continue
      const item = getItemByWowItemId(row.wowItemId)
      const entry: ListPlace = {
        listKey,
        slot,
        rank: row.rank,
        wowItemId: row.wowItemId,
        name: item?.name ?? `Item ${row.wowItemId}`,
        icon: getIconName(row.wowItemId),
        bindsOnPickup: /BoP/i.test(source),
        ...(label !== profession ? { via: label } : {}),
        ...(row.note ? { note: row.note } : {}),
      }
      places.set(profession, [...(places.get(profession) ?? []), entry])
    }
  }
}

/** Every place a profession's items hold, on every list. */
export function placesOnLists(profession: Profession): readonly ListPlace[] {
  return places.get(profession) ?? []
}

/** The places a profession's items hold on one spec's list, best rank first. */
export function placesFor(profession: Profession, spec: { className: string; spec: string }): ListPlace[] {
  const key = specListKey(spec)
  return placesOnLists(profession)
    .filter((place) => place.listKey === key)
    .sort((a, b) => a.rank - b.rank)
}
