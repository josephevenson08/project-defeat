import { serializeBuild, validateBuild, type BuildState } from '../../domain/builds/buildSerialization'
import type { SavedBuild } from '../../domain/builds/buildTypes'

/**
 * Named slots. **The only persistence there is**, since 2026-08-21.
 *
 * There used to be an autosave alongside these: the working build was written on every change and
 * restored at mount, so a reload reopened as whoever you were last time. That was removed with the
 * decision that a load starts clean — see `App`. Keeping the write without the restore would have
 * left this module storing something nothing reads.
 *
 * The consequence is worth stating plainly: **an accidental refresh now loses an unsaved build.**
 * Saving a named slot, or exporting the text, is what keeps one.
 */
const NAMED_STORAGE_KEY = 'project-defeat:builds:v1'

export const MAX_BUILD_NAME_LENGTH = 40

/**
 * localStorage can throw rather than merely return null — private-browsing modes and storage quotas
 * both surface as exceptions — so every access here is guarded. Losing a saved build is annoying;
 * taking the whole planner down with it because a browser refused to persist is not acceptable.
 */
function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

/** Pretty-printed so an exported build stays readable and diffable when pasted into a gist or a ticket. */
export function exportBuildText(state: BuildState) {
  return JSON.stringify(serializeBuild(state), null, 2)
}

export type NamedBuild = {
  name: string
  build: SavedBuild
}

function readNamedRecord(): Record<string, unknown> {
  const storage = safeLocalStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(NAMED_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function writeNamedRecord(record: Record<string, SavedBuild>): boolean {
  const storage = safeLocalStorage()
  if (!storage) return false

  try {
    storage.setItem(NAMED_STORAGE_KEY, JSON.stringify(record))
    return true
  } catch {
    // Almost always a quota failure. The caller reports it rather than pretending the save worked.
    return false
  }
}

/**
 * Every stored slot, validated on the way out and sorted by name. A slot that no longer validates —
 * because the item catalog moved under it, say — is dropped from the list rather than crashing the
 * panel, which matches how a pasted build is treated.
 */
export function listNamedBuilds(): readonly NamedBuild[] {
  return Object.entries(readNamedRecord())
    .flatMap(([name, value]) => {
      const result = validateBuild(value)
      return result.ok ? [{ name, build: result.build }] : []
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function saveNamedBuild(name: string, state: BuildState): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false

  const record = readNamedRecord() as Record<string, SavedBuild>
  record[trimmed.slice(0, MAX_BUILD_NAME_LENGTH)] = serializeBuild(state)
  return writeNamedRecord(record)
}

export function deleteNamedBuild(name: string): boolean {
  const record = readNamedRecord() as Record<string, SavedBuild>
  if (!(name in record)) return false

  delete record[name]
  return writeNamedRecord(record)
}
