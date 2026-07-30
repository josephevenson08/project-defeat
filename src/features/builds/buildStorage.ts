import { parseBuild, serializeBuild, type BuildState } from '../../domain/builds/buildSerialization'
import type { SavedBuild } from '../../domain/builds/buildTypes'

const STORAGE_KEY = 'project-defeat:build:v1'

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
