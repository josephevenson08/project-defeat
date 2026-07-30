import type { CharacterProfile } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import type { SimulationTarget } from '../simulation/encounterTypes'

/**
 * Bumped whenever the shape below changes incompatibly. Import refuses anything it doesn't
 * recognise rather than silently half-loading a build from a future or ancient version.
 */
export const BUILD_FORMAT_VERSION = 1

/**
 * Gear is stored as ids, never as inlined item objects. A saved build should track the catalog as it
 * evolves — if an item's stats are corrected later, a re-imported build should pick up the
 * correction instead of resurrecting stale numbers.
 */
export type SavedGearSlot = {
  itemId: string
  gemIds: string[]
  enchantId?: string
}

export type SavedBuild = {
  version: number
  savedAt: string
  character: CharacterProfile
  gear: Partial<Record<GearSlot, SavedGearSlot>>
  activeBuffIds: string[]
  activeConsumableIds: string[]
  activeTargetDebuffIds: string[]
  target: SimulationTarget
}

export type BuildImportIssue = {
  slot?: GearSlot
  message: string
}

export type BuildImportResult =
  | { ok: true; build: SavedBuild; issues: BuildImportIssue[] }
  | { ok: false; error: string }
