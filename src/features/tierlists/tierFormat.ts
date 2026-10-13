import type { ProvenanceSource } from '../../components/ui/Provenance'
import { DPS_REFERENCE_SOURCE } from '../../domain/simulation/dpsReference'
import { getTierList, tierListsFetchedAt } from '../../domain/tierlists'
import type { SpecStanding } from '../../domain/tierlists/specStanding'

const ROLE_WORD = { DPS: 'damage', Healer: 'healing', Tank: 'tanking' } as const

export const specName = (ref: { className: string; spec: string }) => `${ref.spec} ${ref.className}`

export const ordinal = (n: number) =>
  `${n}${n % 100 > 10 && n % 100 < 14 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`

export const formatDps = (n: number) => n.toLocaleString('en-US')

/** "C for damage, S for tanking": every place a spec holds, in a phrase. */
export const placesText = (standing: SpecStanding) =>
  standing.places.map((place) => `${place.label} for ${ROLE_WORD[place.role]}`).join(', ')

/** When archon.gg's numbers were read, from the source line the reference data carries. */
export const LOGS_READ_ON = DPS_REFERENCE_SOURCE.match(/read (\d{4}-\d{2}-\d{2})/)?.[1]

/** "Mage" for one, "Mages" for several. */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Where the tab's numbers come from, for the line under the top bar. */
export const tierListSources: readonly ProvenanceSource[] = [
  {
    name: "Wowhead's Phase 2 PvE tier lists",
    href: getTierList('DPS')?.sourceUrl,
    readOn: tierListsFetchedAt,
    verb: 'ingested',
  },
  {
    name: 'archon.gg logs',
    href: 'https://www.archon.gg/classic-fresh/tier-list/dps-rankings/raid/normal/all-bosses',
    readOn: LOGS_READ_ON,
    verb: 'read',
  },
]
