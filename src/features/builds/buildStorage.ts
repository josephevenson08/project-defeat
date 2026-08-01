import { parseBuild, serializeBuild, validateBuild, type BuildState } from '../../domain/builds/buildSerialization'
import type { SavedBuild } from '../../domain/builds/buildTypes'

/** The single working build, autosaved on every change so a refresh never loses anything. */
const STORAGE_KEY = 'project-defeat:build:v1'

/**
 * Named slots, stored separately from the working build. Keeping them apart is what makes the
 * autosave safe: it can keep overwriting the working build every keystroke without ever touching
 * something the user deliberately saved.
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

export function saveBuildToStorage(state: BuildState) {
  const storage = safeLocalStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(serializeBuild(state)))
  } catch {
    // Quota exceeded or storage disabled mid-session. Autosave is a convenience, not a guarantee.
  }
}

/**
 * Returns the stored build, or undefined when there isn't one or it can't be trusted. A stored build
 * that fails validation is discarded rather than partially applied — a half-restored character is
 * harder to notice, and harder to recover from, than simply starting fresh.
 */
export function loadBuildFromStorage(): SavedBuild | undefined {
  const storage = safeLocalStorage()
  if (!storage) return undefined

  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return undefined
  }
  if (!raw) return undefined

  const result = parseBuild(raw)
  return result.ok ? result.build : undefined
}

export function clearStoredBuild() {
  const storage = safeLocalStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing useful to do; the caller is resetting state anyway.
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
