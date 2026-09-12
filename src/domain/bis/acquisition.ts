import type { GearItem, ItemSource } from '../gear/itemTypes'
import { getBossesForRaid, sampleRaids } from '../raids'
import type { RankedGearEntry } from './bisTypes'

/**
 * Everything the app knows about how you actually get one item, gathered from every dataset that
 * holds a piece of the answer.
 *
 * **This is a join, not a new dataset.** Three places already held part of it and none held all of
 * it: the Wowhead guide column says which instance (parsed by `parseRankedSource`), the raid loot
 * tables say which boss, and the item catalogue says what a crafted one costs in reagents. On their
 * own each answers a third of "where do I get this"; together they answer it for most of the list.
 */
export type ItemAcquisition = {
  /** What kind of content it comes from. Absent when nothing established it — never guessed. */
  type?: ItemSource
  /** Raid, dungeon or zone. */
  instance?: string
  /** The encounter, where a loot table names one. Only ever from real per-boss data. */
  boss?: string
  vendor?: string
  reputation?: string
  /** The profession that makes it, for crafted pieces. */
  craftedBy?: string
  /** Free text from the guide — a binding note, an auction-house aside, a tier token name. */
  notes?: string
  /** Which dataset each fact came from, so a surface can say how confident it is. */
  from: {
    guide: boolean
    raidLoot: boolean
    catalogue: boolean
  }
}

type Drop = { raid: string; boss: string }

/**
 * Every raid drop, keyed both ways.
 *
 * Two indexes rather than one because the two datasets do not agree on a key: raid loot rows carry a
 * catalogue `itemId` where the item is catalogued and a `wowItemId` where it is not, and BiS entries
 * carry both. Matching on either recovers drops that matching on one would miss.
 */
const dropsByItemId = new Map<string, Drop>()
const dropsByWowItemId = new Map<number, Drop>()

for (const raid of sampleRaids) {
  for (const boss of getBossesForRaid(raid.id)) {
    for (const loot of boss.loot) {
      const drop = { raid: raid.name, boss: boss.name }
      if (loot.itemId && !dropsByItemId.has(loot.itemId)) dropsByItemId.set(loot.itemId, drop)
      if (loot.wowItemId !== undefined && !dropsByWowItemId.has(loot.wowItemId)) dropsByWowItemId.set(loot.wowItemId, drop)
    }
  }
  /*
   * Trash is recorded as a drop of the raid with no encounter, which is what it is. Naming a boss
   * here would be wrong in the one direction that matters — it would send someone to an encounter
   * that does not drop the item.
   */
  for (const loot of raid.notableTrashLoot ?? []) {
    const drop = { raid: raid.name, boss: '' }
    if (loot.itemId && !dropsByItemId.has(loot.itemId)) dropsByItemId.set(loot.itemId, drop)
    if (loot.wowItemId !== undefined && !dropsByWowItemId.has(loot.wowItemId)) dropsByWowItemId.set(loot.wowItemId, drop)
  }
}

/** Exported so the join's reach is asserted rather than assumed. */
export const raidDropIndexSize = { byItemId: dropsByItemId.size, byWowItemId: dropsByWowItemId.size }

/** Looks an item up in the raid loot tables by either key. */
export function findRaidDrop(itemId: string | undefined, wowItemId: number | undefined): Drop | undefined {
  const byId = itemId ? dropsByItemId.get(itemId) : undefined
  if (byId) return byId
  return wowItemId !== undefined ? dropsByWowItemId.get(wowItemId) : undefined
}

/**
 * Resolves one ranked entry to everything known about acquiring it.
 *
 * **Precedence is by specificity, not by dataset.** The guide names an instance and the loot table
 * names an encounter inside one, so they are complements rather than rivals — the loot table's raid
 * only overrides the guide's instance when the guide gave none. The catalogue fills the gaps for
 * items the guide left blank, which is 8 rows of 1,427.
 */
export function resolveAcquisition(entry: RankedGearEntry | undefined, item: GearItem | undefined): ItemAcquisition {
  const guide = entry?.source
  const drop = findRaidDrop(entry?.itemId ?? item?.id, entry?.wowItemId ?? item?.wowItemId)

  /*
   * **The place and the encounter come from the same dataset, or the encounter is dropped.**
   *
   * Taking the best instance from one source and the best boss from another reads as a richer answer
   * and is a wrong one: it put Kael'thas Sunstrider in Magtheridon's Lair and Fathom-Lord Karathress
   * in Gruul's Lair, because the guide named one raid while the catalogue's `boss` field named an
   * encounter from another. Fifty-two rows were affected — the kind of plausible-looking error that
   * sends a player to the wrong instance and is invisible to a spot check.
   *
   * So each branch below picks one authority and takes both facts from it. The guide is preferred
   * for *where* because it is the spec's own recommendation context, and it never names an encounter
   * — so a guide instance the loot table disagrees with yields no boss rather than a guessed one.
   */
  let instance: string | undefined
  let boss: string | undefined
  if (drop && (!guide?.instance || guide.instance === drop.raid)) {
    instance = guide?.instance ?? drop.raid
    // Trash is recorded with an empty boss, which is the honest answer for it.
    boss = drop.boss || undefined
  } else if (guide?.instance) {
    instance = guide.instance
    /*
     * The catalogue may still supply the encounter — but only where it agrees on the place.
     *
     * That agreement is the whole safeguard. Lady Vashj is catalogued against Serpentshrine Cavern
     * and the guide says Serpentshrine Cavern, so the two are describing the same drop and the
     * encounter is safe to take. Where the catalogue names a different instance, it is describing a
     * different drop of the same item, and its boss belongs to that one.
     */
    if (item?.boss && (item.instance === instance || item.zone === instance)) boss = item.boss
  } else if (item?.instance || item?.zone) {
    instance = item.instance ?? item.zone
    boss = item.boss
  } else {
    boss = item?.boss
  }

  return {
    type: guide?.type ?? (drop ? 'Raid' : undefined) ?? item?.source,
    ...(instance ? { instance } : {}),
    ...(boss ? { boss } : {}),
    ...(guide?.vendor ?? item?.vendor ? { vendor: guide?.vendor ?? item?.vendor } : {}),
    ...(guide?.reputation ?? item?.reputation ? { reputation: guide?.reputation ?? item?.reputation } : {}),
    ...(guide?.craftedBy ?? item?.craftedBy ? { craftedBy: guide?.craftedBy ?? item?.craftedBy } : {}),
    ...(guide?.notes ? { notes: guide.notes } : {}),
    from: {
      guide: !!guide,
      raidLoot: !!drop,
      catalogue: !!(item?.instance || item?.zone || item?.boss || item?.vendor || item?.reputation || item?.craftedBy),
    },
  }
}
