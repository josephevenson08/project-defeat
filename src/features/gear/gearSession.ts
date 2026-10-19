import type { ProvenanceSource } from '../../components/ui/Provenance'
import { bisRankingsFetchedAt, type BisList } from '../../domain/bis'
import { raidLootFetchedAt } from '../../domain/raids'

export type GearView = 'sheet' | 'left'
export type GearGroup = 'slot' | 'where'

/**
 * Where the Gear tab is, kept by `App` for the session so a visit to another tab returns to it: the
 * view (the character sheet or "What's left"), and in "What's left" whether it shows only what is
 * left and whether it is grouped by slot or by where the items drop.
 */
export type GearSession = { view: GearView; onlyLeft: boolean; group: GearGroup }

/** Opens on the character sheet, as the prototype did. */
export const initialGearSession: GearSession = { view: 'sheet', onlyLeft: false, group: 'slot' }

/** Where the Gear tab's ranks, enchants, gems and bosses come from, and the hit cap, for the line under the top bar. */
export function gearSources(list: BisList | undefined): readonly ProvenanceSource[] {
  return [
    {
      name: list ? `"best" from Wowhead's ${list.spec} ${list.className} Phase 2 list` : "\"best\" from Wowhead's Phase 2 lists",
      href: list?.sourceUrl,
      readOn: bisRankingsFetchedAt,
      verb: 'ingested',
    },
    { name: "enchants and gems from Wowhead's gem and enchant guides" },
    { name: "bosses from Wowhead's loot tables", readOn: raidLootFetchedAt, verb: 'ingested' },
    { name: "the hit cap from this app's simulator" },
  ]
}
