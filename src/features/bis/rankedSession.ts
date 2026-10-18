import type { ProvenanceSource } from '../../components/ui/Provenance'
import { bisRankingsFetchedAt, type BisList } from '../../domain/bis'
import type { GearSlot } from '../../domain/gear/gearSlots'
import { raidLootFetchedAt } from '../../domain/raids'

export type RankedView = 'slot' | 'where'

/**
 * Where Ranked Gear is, kept by `App` for the session so a visit to another tab returns to it: the
 * view ("Slot by slot" or "Where it drops"), the slot open in the first, and "Only upgrades" in the
 * second.
 */
export type RankedSession = { view: RankedView; slot: GearSlot; onlyUpgrades: boolean }

/** Opens slot by slot on Head, as the prototype did. */
export const initialRankedSession: RankedSession = { view: 'slot', slot: 'Head', onlyUpgrades: false }

/** Where Ranked Gear's order, notes and bosses come from, for the line under the top bar. */
export function rankedSources(list: BisList | undefined): readonly ProvenanceSource[] {
  return [
    {
      name: list ? `Wowhead's ${list.spec} ${list.className} Phase 2 list` : "Wowhead's Phase 2 lists",
      href: list?.sourceUrl,
      readOn: bisRankingsFetchedAt,
      verb: 'ingested',
    },
    { name: "gems and enchants from Wowhead's gem and enchant guides" },
    { name: "bosses from Wowhead's loot tables", readOn: raidLootFetchedAt, verb: 'ingested' },
  ]
}
