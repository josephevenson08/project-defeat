import type { ProvenanceSource } from '../../components/ui/Provenance'
import { bisRankingsFetchedAt, type BisList } from '../../domain/bis'
import { raidLootFetchedAt } from '../../domain/raids'
import type { GearSlot } from './gearTypes'

/**
 * Where Compare is, kept by `App` for the session so a visit to another tab returns to it: the slot,
 * and the item held against what you wear there when one was picked (otherwise the guide's best one
 * you do not wear).
 */
export type CompareSession = { slot: GearSlot; otherId?: string }

/** Opens on Head, as the prototype did. */
export const initialCompareSession: CompareSession = { slot: 'Head' }

/** Where Compare's ranks and drops come from, for the line under the top bar; its scores are the app's own simulator. */
export function compareSources(list: BisList | undefined): readonly ProvenanceSource[] {
  return [
    {
      name: list ? `ranks from Wowhead's ${list.spec} ${list.className} Phase 2 list` : "ranks from Wowhead's Phase 2 lists",
      href: list?.sourceUrl,
      readOn: bisRankingsFetchedAt,
      verb: 'ingested',
    },
    { name: "bosses from Wowhead's loot tables", readOn: raidLootFetchedAt, verb: 'ingested' },
    { name: "scores from this app's simulator" },
  ]
}
