import { getSignatureAbility } from '../abilities/sampleSignatureAbilities'
import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import { getRoleForSpec, tbcClasses } from '../character/tbcClasses'
import { getBuffIcon, raidBuilds, seatContributions } from '../raidcomp'
import { dpsReference, type DpsReference } from '../simulation/dpsReference'
import { getTierList, specTierLists } from './tierLists'
import type { TierListRole } from './tierListTypes'

/**
 * Where a spec stands, gathered from every source the app has: its place on each of Wowhead's lists,
 * what players actually parse (archon.gg), what it brings to a raid, and the ability it is built
 * around. This is the Spec Tier Lists tab's spec card (design A, decided 2026-10-12), and the rows of
 * its "Against the logs" view (design B).
 *
 * **Two opinions, kept apart.** Wowhead's tiers are their guide writers' judgement; archon.gg's DPS
 * is an average of uploaded logs, with tier letters of its own. Neither is folded into the other, so
 * the page can show where they disagree rather than averaging the disagreement away.
 */

export type SpecRef = { className: TbcClass; spec: TbcSpec }

/** Every spec the app knows, in the class order the character creator uses. */
export const allSpecs: readonly SpecRef[] = tbcClasses.flatMap((entry) => entry.specs.map((spec) => ({ className: entry.className, spec })))

export const specKey = (ref: SpecRef) => `${ref.className}|${ref.spec}`
export const sameSpec = (a: SpecRef | undefined, b: SpecRef | undefined) =>
  a !== undefined && b !== undefined && a.className === b.className && a.spec === b.spec

/** The tier letters in rank order. archon.gg has no D; Wowhead's DPS list does. */
export const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'] as const

export type ListPlace = {
  role: TierListRole
  label: string
  /** 0 for the list's top tier. */
  depth: number
  /** Every tier on that list, top first, so a place can be read as "C of S A B C D". */
  labels: readonly string[]
  sourceUrl: string
}

export type LogsStanding = {
  dps: number
  tier: DpsReference['tier']
  /** 1 for the highest observed DPS. */
  rank: number
  of: number
}

export type SpecContribution = {
  id: string
  name: string
  icon?: string
  /** A whole-raid buff, one that reaches only the caster's group, or a debuff on the boss. */
  scope: 'raid' | 'party' | 'debuff'
}

export type SpecStanding = SpecRef & {
  role: CharacterRole
  places: readonly ListPlace[]
  /** Only the 20 damage specs have log numbers in the app. */
  logs?: LogsStanding
  ability?: string
  brings: readonly SpecContribution[]
}

/** archon.gg's damage specs by observed average DPS, highest first. */
export const logsOrder: readonly DpsReference[] = [...dpsReference].sort((a, b) => b.dps - a.dps)

function findLogs(ref: SpecRef): LogsStanding | undefined {
  const index = logsOrder.findIndex((entry) => sameSpec(entry, ref))
  if (index < 0) return undefined
  const entry = logsOrder[index]
  return { dps: entry.dps, tier: entry.tier, rank: index + 1, of: logsOrder.length }
}

/**
 * What a spec brings to a raid, from the same `seatContributions` Raid Composition counts.
 *
 * Matched on the spec rather than a build, so a bear and a cat bring the same thing — which is how
 * the raid planner treats them too. **It is only what the app counts**: the buff data is built
 * around what a raid gives its damage dealers, so caster-side debuffs and mana return are not in it
 * yet (Shadow Priest brings only its raid buffs here). The card says so when the list is empty.
 */
function findContributions(ref: SpecRef): SpecContribution[] {
  const build = raidBuilds.find((candidate) => sameSpec(candidate, ref))
  const given = seatContributions({ className: ref.className, spec: ref.spec, buildId: build?.id })
  const entry = (scope: SpecContribution['scope']) => (thing: { id: string; name: string }) => ({
    id: thing.id,
    name: thing.name,
    icon: getBuffIcon(thing.id),
    scope,
  })
  return [...given.raidWide.map(entry('raid')), ...given.party.map(entry('party')), ...given.debuffs.map(entry('debuff'))]
}

export function getSpecStanding(ref: SpecRef): SpecStanding {
  const places: ListPlace[] = []
  for (const list of specTierLists) {
    const labels = list.tiers.map((tier) => tier.label)
    list.tiers.forEach((tier, depth) => {
      if (tier.placements.some((placement) => sameSpec(placement, ref))) {
        places.push({ role: list.role, label: tier.label, depth, labels, sourceUrl: list.sourceUrl })
      }
    })
  }

  return {
    className: ref.className,
    spec: ref.spec,
    role: getRoleForSpec(ref.className, ref.spec),
    places,
    logs: findLogs(ref),
    ability: getSignatureAbility(ref.className, ref.spec)?.name,
    brings: findContributions(ref),
  }
}

/* ── Against the logs ─────────────────────────────────────────────────────────────────────────── */

const order = (label: string | undefined) => (label === undefined ? -1 : TIER_ORDER.indexOf(label as (typeof TIER_ORDER)[number]))

/** A damage spec's letter on Wowhead's DPS list. */
export function wowheadDpsTier(ref: SpecRef): string | undefined {
  return getTierList('DPS')?.tiers.find((tier) => tier.placements.some((placement) => sameSpec(placement, ref)))?.label
}

/**
 * How far apart the two letters are: positive when the logs rate the spec higher than Wowhead does,
 * negative when Wowhead rates it higher, 0 when they agree.
 */
export function tierGap(entry: DpsReference): number {
  return order(wowheadDpsTier(entry)) - order(entry.tier)
}

/** The disagreement in one sentence, or undefined where the two agree. */
export function describeGap(entry: DpsReference): string | undefined {
  const gap = tierGap(entry)
  if (gap === 0) return undefined
  const wowhead = wowheadDpsTier(entry)
  if (wowhead === 'D') return `Wowhead's D tier; archon has no D, and puts it in ${entry.tier}.`
  return gap > 0
    ? `The logs rate it higher: archon ${entry.tier}, Wowhead ${wowhead}.`
    : `Wowhead rates it higher: Wowhead ${wowhead}, archon ${entry.tier}.`
}

export type LogsComparison = {
  agree: number
  /** The logs rate it higher, D-tier specs aside (archon has no D, so those differ by construction). */
  logsHigher: number
  wowheadHigher: number
  /** Wowhead's D-tier specs, which archon puts in C. */
  wowheadD: number
  /**
   * The spec whose DPS rank is furthest above where Wowhead's tier puts it: for Phase 2, Feral Druid,
   * 10th by DPS and in Wowhead's C.
   */
  underrated?: { ref: SpecRef; rank: number; wowhead: string }
  /**
   * The first spec outside the top ten by DPS that archon still rates above Wowhead's letter — the
   * proof that archon's letters are not DPS order alone (Elemental Shaman, 13th, archon A).
   */
  notDpsOrder?: { ref: SpecRef; rank: number; archon: string }
}

export function compareWithLogs(): LogsComparison {
  const rankOf = (entry: DpsReference) => logsOrder.indexOf(entry) + 1
  // Where Wowhead's tier puts a spec: one place below every spec in a better tier.
  const wowheadRank = (entry: DpsReference) =>
    1 + logsOrder.filter((other) => order(wowheadDpsTier(other)) < order(wowheadDpsTier(entry))).length

  const underrated = logsOrder
    .filter((entry) => rankOf(entry) < wowheadRank(entry))
    .sort((a, b) => wowheadRank(b) - rankOf(b) - (wowheadRank(a) - rankOf(a)))[0]
  const notDpsOrder = logsOrder.find((entry) => order(entry.tier) < order(wowheadDpsTier(entry)) && rankOf(entry) > 10)

  return {
    agree: logsOrder.filter((entry) => tierGap(entry) === 0).length,
    logsHigher: logsOrder.filter((entry) => tierGap(entry) > 0 && wowheadDpsTier(entry) !== 'D').length,
    wowheadHigher: logsOrder.filter((entry) => tierGap(entry) < 0).length,
    wowheadD: logsOrder.filter((entry) => wowheadDpsTier(entry) === 'D').length,
    underrated: underrated && { ref: underrated, rank: rankOf(underrated), wowhead: wowheadDpsTier(underrated) ?? '' },
    notDpsOrder: notDpsOrder && { ref: notDpsOrder, rank: rankOf(notDpsOrder), archon: notDpsOrder.tier },
  }
}

/** The damage specs sorted by Wowhead's letter, then by observed DPS within a letter. */
export function byWowheadTier(): readonly DpsReference[] {
  return [...logsOrder].sort((a, b) => order(wowheadDpsTier(a)) - order(wowheadDpsTier(b)) || b.dps - a.dps)
}
