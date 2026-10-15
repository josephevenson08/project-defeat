import type { ProvenanceSource } from '../../components/ui/Provenance'
import { bisRankingsFetchedAt } from '../../domain/bis/bisLists'
import zoneMaps from '../../domain/professions/zoneMaps.json' with { type: 'json' }

/**
 * Where the Professions tab's numbers come from, for the line under the top bar. A date only where the
 * data records one: the recipe and spawn ingests predate recording it (the node ingest writes one from
 * its next run, docs/design/MAPS-PLAN.md Step B).
 */
export const professionSources: readonly ProvenanceSource[] = [
  { name: "recipes and colours from Wowhead, paths computed here", href: 'https://www.wowhead.com/tbc', verb: 'ingested' },
  { name: 'gathering spawns from Wowhead', verb: 'ingested' },
  { name: "Wowhead's TBC zone maps", readOn: zoneMaps.fetchedAt, verb: 'ingested' },
  { name: "items from Wowhead's Phase 2 lists for 27 specs", readOn: bisRankingsFetchedAt, verb: 'ingested' },
  { name: 'payoffs from Icy Veins and Wowhead' },
]
