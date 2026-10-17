import type { ProvenanceSource } from '../../components/ui/Provenance'

/**
 * Where Raid Composition's numbers come from, for the line under the top bar. No dates: neither the
 * scope ingest nor the buff catalogue records when it was read, and a commit date would make the data
 * look newer than it is.
 */
export const raidcompSources: readonly ProvenanceSource[] = [
  { name: "each buff's reach from its Wowhead spell tooltip", href: 'https://www.wowhead.com/tbc', verb: 'ingested' },
  { name: 'buffs and debuffs checked against wowsims', href: 'https://github.com/wowsims/tbc' },
]
