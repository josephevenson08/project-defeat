import type { ProvenanceSource } from '../../components/ui/Provenance'
import { bisRankingsFetchedAt } from '../../domain/bis'
import { raidLootFetchedAt } from '../../domain/raids'

/** Where the Raids tab's numbers come from, for the line under the top bar. */
export const raidSources: readonly ProvenanceSource[] = [
  { name: "Wowhead's loot tables", href: 'https://www.wowhead.com/tbc', readOn: raidLootFetchedAt, verb: 'ingested' },
  { name: "ranks from Wowhead's Phase 2 lists for 27 specs", readOn: bisRankingsFetchedAt, verb: 'ingested' },
  { name: 'attunement steps from Wowhead quest pages and Icy Veins' },
]
