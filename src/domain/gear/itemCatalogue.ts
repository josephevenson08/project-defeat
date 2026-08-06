// The `with { type: 'json' }` attribute is required, not decorative: Vite is fine without it, but the
// Playwright tests import this module through Node's ESM loader, which refuses a JSON import that
// does not declare its type.
import rawCatalogue from './itemCatalogue.json' with { type: 'json' }
import type { CatalogueConflict, RawCatalogueItem } from './catalogueTypes'
import type { TbcClass } from '../character/characterTypes'
import type { GearSlot } from './gearSlots'
import type { GearItem } from './itemTypes'
import { sampleItems } from './sampleItems'
import { isItemCompatibleWithGearSlot } from './slotCompatibility'

/**
 * The item catalogue: bulk data ingested from wowsims/tbc, enriched with the hand-written entries.
 *
 * **Which source wins, and why.** The rebuild plan assumed the hand-curated entries were read off real
 * tooltips and should override the bulk data. Reconciling them said otherwise: of 98 curated entries
 * that matched an ingested item, 87 disagreed, and running all 119 verifiable field conflicts against
 * live Wowhead tooltips scored **curated 0, ingested 119**. Not one curated stat, socket or item level
 * survived a check. So the merge is the other way round from the original plan — ingested data is
 * authoritative for everything mechanical.
 *
 * The curated entries are still worth keeping, because they carry things wowsims has no data for at
 * all: where an item drops, which roles want it, crafting materials, trinket procs. Those fields are
 * layered on top. They have not been independently verified and several are known-suspect, so any
 * `needsVerification` flag on the curated entry is carried through.
 *
 * Reproduce the comparison with `node tools/ingest/reconcile-curated.mjs --check-wowhead`.
 */

/** Curated fields wowsims carries no data for. Everything mechanical comes from the ingested source. */
const PROVENANCE_FIELDS = [
  'source',
  'zone',
  'instance',
  'boss',
  'vendor',
  'reputation',
  'craftedBy',
  'crafting',
  'roles',
  'allowedSpecs',
  'effect',
  'uniqueEquipped',
  'requiredLevel',
  'notes',
  'needsVerification',
] as const satisfies readonly (keyof GearItem)[]

/** Mechanical fields compared for the conflict log. Ingested always wins; the log records what changed. */
const MECHANICAL_FIELDS = ['itemLevel', 'quality', 'armorType', 'sockets'] as const

function toGearItem(raw: RawCatalogueItem): GearItem {
  const item: GearItem = {
    id: raw.id,
    wowItemId: raw.wowItemId,
    name: raw.name,
    slot: raw.slot,
    quality: raw.quality,
    stats: raw.stats,
  }

  if (raw.itemLevel !== undefined) item.itemLevel = raw.itemLevel
  if (raw.phase !== undefined) item.phase = raw.phase
  if (raw.armorType) item.armorType = raw.armorType
  if (raw.weaponType) item.weaponType = raw.weaponType
  if (raw.handType) item.handType = raw.handType
  if (raw.weaponSpeed !== undefined) item.weaponSpeed = raw.weaponSpeed
  if (raw.weaponDamageMin !== undefined) item.weaponDamageMin = raw.weaponDamageMin
  if (raw.weaponDamageMax !== undefined) item.weaponDamageMax = raw.weaponDamageMax
  if (raw.sockets?.length) item.sockets = raw.sockets
  if (raw.socketBonus) item.socketBonus = raw.socketBonus
  if (raw.setId) item.setId = raw.setId
  if (raw.unique) item.unique = raw.unique
  if (raw.allowedClasses?.length) item.allowedClasses = raw.allowedClasses as TbcClass[]

  return item
}

const conflicts: CatalogueConflict[] = []

const curatedByWowId = new Map<number, GearItem>()
const curatedById = new Map<string, GearItem>()
for (const curated of sampleItems) {
  if (curated.wowItemId !== undefined) curatedByWowId.set(curated.wowItemId, curated)
  curatedById.set(curated.id, curated)
}

/**
 * Matches a curated entry to an ingested one. `wowItemId` is the reliable key, but only 100 of the
 * curated entries carry it, so entries without one fall back to matching on the slug both sides derive
 * from the item name. Without that fallback their provenance — drop location, crafting, notes — is
 * silently lost behind an ingested item holding the same id.
 */
function findCurated(raw: RawCatalogueItem): GearItem | undefined {
  const byWowId = curatedByWowId.get(raw.wowItemId)
  if (byWowId) return byWowId
  const bySlug = curatedById.get(raw.id)
  // A curated entry that HAS a wowItemId and still did not match is a different item; ignore the slug.
  return bySlug && bySlug.wowItemId === undefined ? bySlug : undefined
}

const merged: GearItem[] = []
const usedIds = new Set<string>()
const consumedCurated = new Set<GearItem>()

for (const raw of rawCatalogue.items) {
  const item = toGearItem(raw)
  const curated = findCurated(raw)

  if (curated) {
    consumedCurated.add(curated)

    for (const field of MECHANICAL_FIELDS) {
      const before = field === 'sockets' ? (curated.sockets ?? []).join(',') : curated[field]
      const after = field === 'sockets' ? (item.sockets ?? []).join(',') : item[field]
      if (before !== undefined && before !== after) {
        conflicts.push({ wowItemId: raw.wowItemId, name: item.name, field, curated: before, ingested: after })
      }
    }

    for (const field of PROVENANCE_FIELDS) {
      const value = curated[field]
      if (value !== undefined) Object.assign(item, { [field]: value })
    }

    // Keep the curated id so existing BiS and raid-loot references still resolve.
    if (!usedIds.has(curated.id)) item.id = curated.id
  }

  if (usedIds.has(item.id)) item.id = `${item.id}-${item.wowItemId}`
  usedIds.add(item.id)
  merged.push(item)
}

/**
 * Curated entries with no ingested counterpart — either they carry no `wowItemId`, or the id is not in
 * the TBC database. These are the least trustworthy entries in the project (the audit found invented
 * names and at least one item that does not exist), but they are kept so existing BiS and raid-loot
 * references keep resolving until real rankings replace them.
 */
const unmatchedCurated = sampleItems.filter((curated) => !consumedCurated.has(curated))

for (const curated of unmatchedCurated) {
  if (usedIds.has(curated.id)) continue
  usedIds.add(curated.id)
  merged.push(curated)
}

/** Every item in the catalogue, across all phases. */
export const allItems: readonly GearItem[] = merged

export const catalogueMeta = {
  upstream: rawCatalogue.upstream,
  ingestedCount: rawCatalogue.items.length,
  curatedCount: sampleItems.length,
  mergedCount: merged.length,
  enrichedCount: consumedCurated.size,
  unmatchedCuratedCount: unmatchedCurated.length,
  setNames: rawCatalogue.sets,
} as const

/** Field-level disagreements between curated and ingested data, all resolved in favour of ingested. */
export const catalogueConflicts: readonly CatalogueConflict[] = conflicts

/**
 * Highest content phase offered by default. The project targets Phase 2 (SSC/TK), and showing gear
 * that cannot be obtained yet is misleading — but the later-phase items are ingested and present, so
 * raising this is the only change needed to open them up.
 */
export const defaultMaxPhase = 2

export type ItemQueryOptions = {
  /** Defaults to `defaultMaxPhase`. Pass `Infinity` for every phase. */
  maxPhase?: number
}

function withinPhase(item: GearItem, maxPhase: number) {
  return (item.phase ?? 0) <= maxPhase
}

export function getItemsForSlot(slot: GearSlot, options: ItemQueryOptions = {}): readonly GearItem[] {
  const maxPhase = options.maxPhase ?? defaultMaxPhase
  return allItems.filter((item) => isItemCompatibleWithGearSlot(item, slot) && withinPhase(item, maxPhase))
}

const byId = new Map(allItems.map((item) => [item.id, item]))
const byWowItemId = new Map(allItems.map((item) => [item.wowItemId, item]))

export function getItemById(id: string): GearItem | undefined {
  return byId.get(id)
}

export function getItemByWowItemId(wowItemId: number): GearItem | undefined {
  return byWowItemId.get(wowItemId)
}
