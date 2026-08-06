import type { StatBlock } from '../stats/statTypes'
import type { GearSlot } from './gearSlots'
import type { ArmorType, ItemQuality, SocketColor, WeaponHandType, WeaponType } from './itemTypes'

/**
 * The shape emitted by `tools/ingest/ingest-items.mjs`. Declared by hand rather than inferred from the
 * JSON: the file is ~2 MB, and letting `resolveJsonModule` infer a literal type for it makes every
 * typecheck crawl.
 */
export type RawCatalogueItem = {
  id: string
  wowItemId: number
  name: string
  slot: GearSlot
  quality: ItemQuality
  itemLevel?: number
  phase?: number
  stats: Partial<StatBlock>
  armorType?: ArmorType
  weaponType?: WeaponType
  handType?: WeaponHandType
  weaponSpeed?: number
  weaponDamageMin?: number
  weaponDamageMax?: number
  sockets?: SocketColor[]
  socketBonus?: Partial<StatBlock>
  setId?: string
  allowedClasses?: string[]
  unique?: boolean
  /**
   * Resistances and school-specific spell power, which `StatBlock` has no fields for. Carried so the
   * data is not lost at ingestion — adding those fields later becomes a display change rather than a
   * re-ingestion.
   */
  extraStats?: Record<string, number>
}

export type RawCatalogue = {
  upstream: { repo: string; sha: string; path: string; license: string }
  generatedBy: string
  itemCount: number
  sets: Record<string, string>
  items: RawCatalogueItem[]
}

/** One field where the curated entry disagreed with the ingested source. Kept for diagnostics. */
export type CatalogueConflict = {
  wowItemId: number
  name: string
  field: string
  curated: unknown
  ingested: unknown
}
