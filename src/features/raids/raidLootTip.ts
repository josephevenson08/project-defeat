import type { ItemTipModel } from '../../components/ui/itemTipModel'
import { statLinesFrom } from '../../components/ui/itemTipModel'
import {
  listKey,
  lootItem,
  lootKind,
  lootKindLabel,
  lootRanks,
  whereItDropsText,
  type RaidLootEntry,
  type SpecRef,
} from '../../domain/raids'
import { describeStats } from '../../domain/stats/describeStats'

/** "Finger 1" reads "Finger" on an item, as in the game. */
export const slotName = (slot: string | undefined) => slot?.replace(/ [12]$/, '')

export const listName = (spec: SpecRef) => `${spec.spec} ${spec.className}`

/** A loot entry as a game tooltip: the catalogue's item, what kind of drop it is, where it drops and who ranks it. */
export function raidLootTip(entry: RaidLootEntry, lootFor: SpecRef | undefined): ItemTipModel {
  const item = lootItem(entry)
  const ranks = lootRanks(entry)
  const yours = lootFor ? ranks.find((rank) => rank.list.key === listKey(lootFor)) : undefined
  const others = ranks.filter((rank) => rank !== yours).slice(0, yours ? 3 : 4)

  return {
    name: entry.name,
    quality: item?.quality,
    itemLevel: item?.itemLevel,
    unique: item?.unique,
    slot: slotName(item?.slot),
    typeLine: item?.weaponType ? [item.handType, item.weaponType].filter(Boolean).join(' ') : item?.armorType,
    damage:
      item?.weaponDamageMin !== undefined && item.weaponDamageMax !== undefined && item.weaponSpeed !== undefined
        ? { min: item.weaponDamageMin, max: item.weaponDamageMax, speed: item.weaponSpeed }
        : undefined,
    stats: statLinesFrom(describeStats(item?.stats)),
    sockets: item?.sockets,
    socketBonus: describeStats(item?.socketBonus) || undefined,
    kind: lootKindLabel(entry),
    note: entry.notes,
    where: whereItDropsText(entry) || undefined,
    ranks: ranks.length
      ? {
          yours: yours
            ? `#${yours.rank} on the ${listName(yours.list)} list (${slotName(yours.slot)}${yours.note ? `, ${yours.note}` : ''})`
            : undefined,
          others: others.map((rank) => `${listName(rank.list)} #${rank.rank}`),
          more: ranks.length - (yours ? 1 : 0) - others.length,
          total: ranks.length,
        }
      : undefined,
    unranked: ranks.length === 0 && item !== undefined && lootKind(entry) === 'gear',
  }
}

/** A key that names a drop on the page, for scrolling to it from a search result. */
export function lootKey(entry: RaidLootEntry): string {
  return String(entry.wowItemId ?? lootItem(entry)?.wowItemId ?? entry.name)
}

/** The hover and focus handlers a loot button takes from the tab's item tooltip. */
export type LootTipBinder = (entry: RaidLootEntry) => object
