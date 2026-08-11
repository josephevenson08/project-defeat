import { getClassDefinition, tbcClassNames } from '../character/tbcClasses'
import type { CharacterProfile } from '../character/characterTypes'
import { gearSlots } from '../gear/gearSlots'
import type { GearSlot } from '../gear/gearSlots'
import { getItemById } from '../gear/itemCatalogue'
import { isItemAllowedForCharacter } from '../gear/characterItemRules'
import type { EquippedGear } from '../gear/itemTypes'
import { isClassLegalForRace, racesByFaction } from '../character/races'
import { defaultSimulationTarget } from '../simulation/sampleEncounters'
import { BUILD_FORMAT_VERSION, type BuildImportIssue, type BuildImportResult, type SavedBuild } from './buildTypes'

export type BuildState = {
  character: CharacterProfile
  gear: EquippedGear
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  talentPoints: Readonly<Record<number, number>>
  target: SavedBuild['target']
}

export function serializeBuild(state: BuildState): SavedBuild {
  const gear: SavedBuild['gear'] = {}

  gearSlots.forEach((slot) => {
    const equipped = state.gear[slot]
    if (!equipped) return
    gear[slot] = {
      itemId: equipped.item.id,
      gemIds: [...equipped.gemIds],
      ...(equipped.enchantId ? { enchantId: equipped.enchantId } : {}),
    }
  })

  return {
    version: BUILD_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    character: { ...state.character },
    gear,
    activeBuffIds: [...state.activeBuffIds],
    activeConsumableIds: [...state.activeConsumableIds],
    activeTargetDebuffIds: [...state.activeTargetDebuffIds],
    talentPoints: { ...state.talentPoints },
    target: { ...state.target },
  }
}

/** Talent points arrive as an id-keyed map; anything else in that field is discarded rather than trusted. */
function isPointMap(value: unknown): value is Record<number, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(([key, entry]) => Number.isFinite(Number(key)) && typeof entry === 'number' && entry >= 0)
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function validateCharacter(value: unknown): CharacterProfile | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as Partial<CharacterProfile>
  const { faction, race, className, spec } = candidate

  if (faction !== 'Alliance' && faction !== 'Horde') return undefined
  if (typeof race !== 'string' || !racesByFaction[faction].includes(race)) return undefined
  if (typeof className !== 'string' || !tbcClassNames.includes(className)) return undefined
  if (!isClassLegalForRace(className, race)) return undefined
  if (typeof spec !== 'string' || !getClassDefinition(className).specs.includes(spec)) return undefined

  return { faction, race, className, spec }
}

/**
 * Parses a pasted/stored build defensively. Anything structurally wrong is rejected outright, but a
 * build referencing gear that no longer exists (or that's illegal for the character it was saved
 * with) is still loaded — the offending slots are dropped and reported as issues, so a catalog
 * change can't render an otherwise-good saved build unusable.
 */
export function parseBuild(raw: string): BuildImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: "That doesn't look like a build — it isn't valid JSON." }
  }

  return validateBuild(parsed)
}

/**
 * The validation half of `parseBuild`, split out so already-parsed builds (named slots read back
 * from storage as one JSON object) go through exactly the same checks as a pasted string, rather
 * than a second, subtly different implementation that could drift.
 */
export function validateBuild(parsed: unknown): BuildImportResult {
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'A build must be a JSON object.' }
  }

  const candidate = parsed as Partial<SavedBuild>

  if (candidate.version !== BUILD_FORMAT_VERSION) {
    return {
      ok: false,
      error: `Unsupported build version ${String(candidate.version)}. This app reads version ${BUILD_FORMAT_VERSION}.`,
    }
  }

  const character = validateCharacter(candidate.character)
  if (!character) {
    return { ok: false, error: 'The build has a missing or illegal character (faction/race/class/spec combination).' }
  }

  const issues: BuildImportIssue[] = []
  const gear: SavedBuild['gear'] = {}

  if (typeof candidate.gear === 'object' && candidate.gear !== null) {
    Object.entries(candidate.gear).forEach(([slotKey, value]) => {
      const slot = slotKey as GearSlot
      if (!gearSlots.includes(slot)) {
        issues.push({ message: `Ignored unknown gear slot "${slotKey}".` })
        return
      }
      if (typeof value !== 'object' || value === null || typeof (value as { itemId?: unknown }).itemId !== 'string') {
        issues.push({ slot, message: `Ignored malformed entry for ${slot}.` })
        return
      }

      const saved = value as { itemId: string; gemIds?: unknown; enchantId?: unknown }
      const item = getItemById(saved.itemId)
      if (!item) {
        issues.push({ slot, message: `${slot}: item "${saved.itemId}" is no longer in the catalog.` })
        return
      }
      if (!isItemAllowedForCharacter(item, character.className, character.spec)) {
        issues.push({ slot, message: `${slot}: ${item.name} isn't legal for a ${character.spec} ${character.className}.` })
        return
      }

      gear[slot] = {
        itemId: saved.itemId,
        gemIds: isStringArray(saved.gemIds) ? saved.gemIds : [],
        ...(typeof saved.enchantId === 'string' ? { enchantId: saved.enchantId } : {}),
      }
    })
  } else {
    issues.push({ message: 'The build had no gear section; falling back to defaults.' })
  }

  const target =
    typeof candidate.target === 'object' &&
    candidate.target !== null &&
    typeof (candidate.target as { level?: unknown }).level === 'number' &&
    typeof (candidate.target as { armor?: unknown }).armor === 'number'
      ? (candidate.target as SavedBuild['target'])
      : defaultSimulationTarget

  return {
    ok: true,
    issues,
    build: {
      version: BUILD_FORMAT_VERSION,
      savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
      character,
      gear,
      activeBuffIds: isStringArray(candidate.activeBuffIds) ? candidate.activeBuffIds : [],
      activeConsumableIds: isStringArray(candidate.activeConsumableIds) ? candidate.activeConsumableIds : [],
      activeTargetDebuffIds: isStringArray(candidate.activeTargetDebuffIds) ? candidate.activeTargetDebuffIds : [],
      talentPoints: isPointMap(candidate.talentPoints) ? candidate.talentPoints : {},
      target,
    },
  }
}

/** Rebuilds live `EquippedGear` from a saved build, layering saved slots over a supplied baseline. */
export function applySavedGear(baseline: EquippedGear, saved: SavedBuild['gear']): EquippedGear {
  const next: EquippedGear = { ...baseline }

  Object.entries(saved).forEach(([slotKey, value]) => {
    if (!value) return
    const item = getItemById(value.itemId)
    if (!item) return
    next[slotKey as GearSlot] = {
      item,
      gemIds: [...value.gemIds],
      ...(value.enchantId ? { enchantId: value.enchantId } : {}),
    }
  })

  return next
}
