import type { RaidPlayerSize } from '../../domain/raids/raidTypes'
import { emptyRoster, getRaidBuild, groupCountFor, PARTY_SIZE } from '../../domain/raidcomp'
import type { Roster, RosterSlot } from '../../domain/raidcomp'
import { getClassDefinition } from '../../domain/character/tbcClasses'

/**
 * Persistence for a planned raid.
 *
 * A raid leader builds a 25-person roster the evening before an invite; losing it to a page refresh
 * would make the tool useless for the one job it exists for. Same storage convention as saved builds,
 * separate key so the two never collide.
 */
const STORAGE_KEY = 'project-defeat:roster:v1'

const SIZES: readonly RaidPlayerSize[] = [10, 25]

/**
 * Reads a roster back, validating rather than trusting.
 *
 * Every seat is re-checked against the real class/spec data, so a stored roster naming a spec that
 * no longer exists loses that seat instead of poisoning the whole roster — the same contract saved
 * builds already keep with the item catalogue.
 */
export function loadRoster(): Roster | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return undefined

    const candidate = parsed as { size?: unknown; groups?: unknown }
    const size = SIZES.find((option) => option === candidate.size)
    if (!size || !Array.isArray(candidate.groups)) return undefined

    const storedGroups: unknown[] = candidate.groups
    const base = emptyRoster(size)
    const groups = base.groups.map((emptyGroup, groupIndex) => {
      const stored: unknown = storedGroups[groupIndex]
      if (!Array.isArray(stored)) return emptyGroup

      return emptyGroup.map((_, seatIndex) => {
        const seat: unknown = stored[seatIndex]
        if (typeof seat !== 'object' || seat === null) return undefined

        const { className, spec, playerName, buildId } = seat as {
          className?: unknown
          spec?: unknown
          playerName?: unknown
          buildId?: unknown
        }
        if (typeof className !== 'string' || typeof spec !== 'string') return undefined

        const definition = getClassDefinition(className as never)
        if (!definition || !(definition.specs as readonly string[]).includes(spec)) return undefined

        /*
         * **Every optional field has to be carried through explicitly, and this has now bitten twice.**
         * The validator rebuilds each seat from scratch rather than copying it, so anything not named
         * here is silently dropped on reload: first `playerName`, which made restored rosters
         * anonymous, then `buildId`, which turned every Feral tank back into a cat and read the tank
         * count as zero. Both validated cleanly and looked right.
         *
         * Rebuilding is still the correct shape — copying an unvalidated object is how malformed
         * storage gets into the model — but any field added to `RosterSlot` must be added here too.
         */
        const validBuild = typeof buildId === 'string' && getRaidBuild(buildId)?.className === className

        return {
          className,
          spec,
          ...(typeof playerName === 'string' && playerName.trim() ? { playerName: playerName.trim() } : {}),
          ...(validBuild ? { buildId: buildId as string } : {}),
        } as RosterSlot
      })
    })

    return { size, groups }
  } catch {
    // A corrupt or unreadable payload is not worth surfacing — the planner opens empty, which is a
    // recoverable state, where a thrown error mid-render is not.
    return undefined
  }
}

export function saveRoster(roster: Roster): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roster))
  } catch {
    // Private-browsing quota failures must not take the planner down with them.
  }
}

export function clearStoredRoster(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same reasoning as above.
  }
}

/** Exported for the test that pins the round trip, and to keep the shape honest at one place. */
export const rosterStorageKey = STORAGE_KEY
export const rosterShape = { PARTY_SIZE, groupCountFor }
