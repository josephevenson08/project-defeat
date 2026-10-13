import rankings from '../bis/bisRankings.json' with { type: 'json' }
import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { getItemById } from '../gear/itemCatalogue'
import type { GearItem } from '../gear/itemTypes'
import { getRaidBuild, type Roster } from '../raidcomp'
import { getBossesForRaid } from './sampleRaidBosses'
import { sampleRaids } from './sampleRaids'
import type { Raid, RaidBoss, RaidLootEntry } from './raidTypes'

/**
 * What the Raids tab asks of the loot (port step 2, the decided boss journal): where each drop sits
 * on every spec's Wowhead Phase 2 list, what kind of drop it is, where it drops, which drops match a
 * search across all five raids, and who in a raid wants each one.
 *
 * Everything here reads the same data the rest of the app does — the raid files, the item catalogue
 * and `bisRankings.json` — so a rank on a loot row cannot disagree with the planner's Ranked Gear.
 */

export type SpecRef = { className: TbcClass; spec: TbcSpec }

/* ── Wowhead's lists ─────────────────────────────────────────────────────────────────────────── */

/** One spec's Wowhead Phase 2 list. Rogue's three specs and Priest's two healers share a guide, kept per spec as the app does. */
export type WowheadList = SpecRef & { key: string; sourceName: string; sourceUrl: string }

export const wowheadLists: readonly WowheadList[] = Object.entries(rankings.specs).map(([key, list]) => ({
  key,
  className: list.className as TbcClass,
  spec: list.spec as TbcSpec,
  sourceName: list.sourceName,
  sourceUrl: list.sourceUrl,
}))

const listByKey = new Map(wowheadLists.map((list) => [list.key, list]))
export const listKey = (spec: SpecRef) => `${spec.className}|${spec.spec}`
export const getWowheadList = (spec: SpecRef) => listByKey.get(listKey(spec))

export type LootRank = { list: WowheadList; rank: number; slot: string; note?: string }

/*
 * The best rank per list for each item id. An item can sit in two sections of one list (a one-hand
 * weapon under Main Hand and Off Hand), and the better of the two is the one a reader means.
 */
const ranksByItem = new Map<number, LootRank[]>()
for (const [key, list] of Object.entries(rankings.specs)) {
  const wowheadList = listByKey.get(key)!
  for (const [slot, rows] of Object.entries(list.slots)) {
    for (const row of rows) {
      const ranks = ranksByItem.get(row.wowItemId) ?? []
      const existing = ranks.find((entry) => entry.list.key === key)
      if (existing && existing.rank <= row.rank) continue
      const next = { list: wowheadList, rank: row.rank, slot, note: row.note || undefined }
      ranksByItem.set(row.wowItemId, existing ? ranks.map((entry) => (entry === existing ? next : entry)) : [...ranks, next])
    }
  }
}
const listOrder = new Map(wowheadLists.map((list, index) => [list.key, index]))
for (const ranks of ranksByItem.values()) {
  ranks.sort((a, b) => a.rank - b.rank || listOrder.get(a.list.key)! - listOrder.get(b.list.key)!)
}

/* ── One drop ────────────────────────────────────────────────────────────────────────────────── */

/** The catalogue item a drop is, when the catalogue has it. */
export function lootItem(entry: RaidLootEntry): GearItem | undefined {
  return entry.itemId ? getItemById(entry.itemId) : undefined
}

export function lootWowItemId(entry: RaidLootEntry): number | undefined {
  return entry.wowItemId ?? lootItem(entry)?.wowItemId
}

/** Every list that ranks a drop, best rank first. */
export function lootRanks(entry: RaidLootEntry): readonly LootRank[] {
  const id = lootWowItemId(entry)
  return id === undefined ? [] : (ranksByItem.get(id) ?? [])
}

export function lootRankFor(entry: RaidLootEntry, spec: SpecRef): LootRank | undefined {
  return lootRanks(entry).find((rank) => rank.list.key === listKey(spec))
}

export type LootKind = 'token' | 'set-piece' | 'quest' | 'mount' | 'gear' | 'trash' | 'recipe'

const RECIPE = /^(Pattern|Plans|Formula|Schematic|Design|Recipe):/

export function lootKind(entry: RaidLootEntry): LootKind {
  if (entry.dropType === 'Trash') return 'trash'
  if (entry.dropType === 'Quest Reward') return 'quest'
  if (entry.dropType === 'Tier Token') return entry.itemId ? 'set-piece' : 'token'
  if (RECIPE.test(entry.name)) return 'recipe'
  if (/Reins|Charger/.test(entry.name) || /^Mount\b/.test(entry.notes ?? '')) return 'mount'
  return 'gear'
}

/** What a game tooltip says a drop is, under its stats. Gear says nothing. */
export function lootKindLabel(entry: RaidLootEntry): string | undefined {
  switch (lootKind(entry)) {
    case 'token':
      return 'Tier token'
    case 'set-piece':
      return 'Set piece · from a token'
    case 'recipe':
      return 'Recipe'
    case 'mount':
      return 'Mount'
    case 'trash':
      return 'Trash drop'
    case 'quest':
      return lootItem(entry) ? 'Quest reward' : 'Quest item'
    default:
      return undefined
  }
}

const KIND_ORDER: Record<LootKind, number> = { token: 0, 'set-piece': 1, quest: 2, mount: 3, gear: 4, trash: 4, recipe: 9 }

/** Tokens, set pieces, quest items and mounts first, then gear, recipes last; the data's own order inside each. */
export function sortLoot(entries: readonly RaidLootEntry[]): RaidLootEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => KIND_ORDER[lootKind(a.entry)] - KIND_ORDER[lootKind(b.entry)] || a.index - b.index)
    .map(({ entry }) => entry)
}

/* ── Where things drop ───────────────────────────────────────────────────────────────────────── */

/** A boss's drops, or a raid's notable trash when `boss` is absent. */
export type LootSource = { raid: Raid; boss?: RaidBoss; entries: readonly RaidLootEntry[] }

export function lootSources(raid: Raid): LootSource[] {
  const bosses = getBossesForRaid(raid.id).map((boss) => ({ raid, boss, entries: boss.loot }))
  return raid.notableTrashLoot?.length ? [...bosses, { raid, entries: raid.notableTrashLoot }] : bosses
}

export function raidDropCount(raid: Raid): number {
  return lootSources(raid).reduce((total, source) => total + source.entries.length, 0)
}

const sameDrop = (a: RaidLootEntry, b: RaidLootEntry) => {
  const ida = lootWowItemId(a)
  const idb = lootWowItemId(b)
  return ida !== undefined && idb !== undefined ? ida === idb : a.name === b.name
}

/** Every boss (or trash) a drop comes from, across all five raids: a pattern can drop from several. */
export function whereItDrops(entry: RaidLootEntry): { raid: Raid; boss?: RaidBoss }[] {
  return sampleRaids.flatMap((raid) =>
    lootSources(raid)
      .filter((source) => source.entries.some((candidate) => sameDrop(candidate, entry)))
      .map(({ raid: from, boss }) => ({ raid: from, boss })),
  )
}

/** "Lady Vashj, Serpentshrine Cavern · Trash, Karazhan", Tempest Keep shortened as players say it. */
export function whereItDropsText(entry: RaidLootEntry): string {
  const short = (raid: Raid) => (raid.id === 'tempest-keep' ? 'Tempest Keep' : raid.name)
  return [...new Set(whereItDrops(entry).map(({ raid, boss }) => `${boss ? boss.name : 'Trash'}, ${short(raid)}`))].join(' · ')
}

/* ── Tier tokens ─────────────────────────────────────────────────────────────────────────────── */

const allEntries = sampleRaids.flatMap((raid) => lootSources(raid).flatMap((source) => source.entries))

/** The set pieces a tier token buys, from the pieces' own notes ("redeemed from Gloves of the Vanquished Hero."). */
export function setPiecesFor(token: RaidLootEntry): RaidLootEntry[] {
  if (lootKind(token) !== 'token') return []
  const pattern = new RegExp(`redeemed from ${token.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`, 'i')
  return allEntries.filter((entry) => lootKind(entry) === 'set-piece' && pattern.test(entry.notes ?? ''))
}

/* ── Searching all five raids ────────────────────────────────────────────────────────────────── */

export type LootSearchResult = { raid: Raid; sources: LootSource[]; count: number }

/** Drops whose name contains the query (two letters or more), grouped by raid and boss. */
export function searchRaidLoot(query: string): LootSearchResult[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  return sampleRaids
    .map((raid) => {
      const sources = lootSources(raid)
        .map((source) => ({ ...source, entries: source.entries.filter((entry) => entry.name.toLowerCase().includes(needle)) }))
        .filter((source) => source.entries.length > 0)
      return { raid, sources, count: sources.reduce((total, source) => total + source.entries.length, 0) }
    })
    .filter((result) => result.count > 0)
}

/* ── Who in a raid wants a drop ──────────────────────────────────────────────────────────────── */

export type Raider = SpecRef & {
  /** `group-seat`, stable while the roster is unchanged. */
  key: string
  group: number
  seat: number
  buildId?: string
  playerName?: string
  /** The spec's Wowhead list; none for a Feral tank, since Wowhead's Feral list is for cat DPS. */
  list?: WowheadList
  label: string
}

/** A raid's seats as raiders, labelled the way the planner names them ("Fury Warrior, group 2" when two match). */
export function raidersFrom(roster: Roster): Raider[] {
  const raiders = roster.groups.flatMap((group, groupIndex) =>
    group.flatMap((slot, seatIndex) => {
      if (!slot) return []
      const build = slot.buildId ? getRaidBuild(slot.buildId) : undefined
      const isBear = slot.buildId === 'druid-feral-tank'
      return [
        {
          className: slot.className,
          spec: slot.spec,
          key: `${groupIndex}-${seatIndex}`,
          group: groupIndex,
          seat: seatIndex,
          buildId: slot.buildId,
          playerName: slot.playerName,
          list: isBear ? undefined : getWowheadList(slot),
          label: `${build?.label ?? slot.spec} ${slot.className}`,
        },
      ]
    }),
  )
  const sameBuild = (a: Raider, b: Raider) => (a.buildId ?? `${a.className}|${a.spec}`) === (b.buildId ?? `${b.className}|${b.spec}`)
  return raiders.map((raider) => ({
    ...raider,
    label: raider.playerName
      ? `${raider.playerName}, ${raider.label}`
      : raiders.filter((other) => sameBuild(other, raider)).length > 1
        ? `${raider.label}, group ${raider.group + 1}`
        : raider.label,
  }))
}

export type Want = { raider: Raider; rank: number; slot: string; via?: RaidLootEntry }

/** Who in the raid has the drop on their list, best rank first. A token counts through the best set piece it buys. */
export function whoWants(entry: RaidLootEntry, raiders: readonly Raider[]): Want[] {
  const pieces = setPiecesFor(entry)
  const wants: Want[] = []
  for (const raider of raiders) {
    if (!raider.list) continue
    let best: Want | undefined
    const direct = lootRankFor(entry, raider)
    if (direct) best = { raider, rank: direct.rank, slot: direct.slot }
    for (const piece of pieces) {
      const rank = lootRankFor(piece, raider)
      if (rank && (!best || rank.rank < best.rank)) best = { raider, rank: rank.rank, slot: rank.slot, via: piece }
    }
    if (best) wants.push(best)
  }
  return wants.sort((a, b) => a.rank - b.rank || a.raider.group - b.raider.group || a.raider.seat - b.raider.seat)
}

export const firstPicks = (wants: readonly Want[]) => wants.filter((want) => want.rank === 1).length

/** Three or more raiders rank it first. Two is common: Rogue's three specs share one list. */
export const isContested = (wants: readonly Want[]) => firstPicks(wants) >= 3
