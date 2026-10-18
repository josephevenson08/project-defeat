import type { GearItem, ItemQuality, SocketColor } from '../../domain/gear/itemTypes'
import { describeStats } from '../../domain/stats/describeStats'

/**
 * What an item tooltip shows, in the order the game shows it. Built by each tab from its own data
 * (Raids builds it from a loot entry and the catalogue), so the tooltip itself knows nothing about
 * where an item came from.
 */
export type ItemTipModel = {
  name: string
  /** Absent when the item is not in the catalogue: the tooltip says so rather than guessing. */
  quality?: ItemQuality
  itemLevel?: number
  unique?: boolean
  slot?: string
  /** Armour type, or the weapon line ("Two-Hand Sword"). */
  typeLine?: string
  damage?: { min: number; max: number; speed: number }
  /** Base stats are white, as in the game; everything else is green. */
  stats: readonly { text: string; base: boolean }[]
  /** The enchant on it, green under the base stats, for a tab that fits items out (Ranked Gear). */
  enchant?: string
  sockets?: readonly SocketColor[]
  /** What sits in each socket, in socket order; an empty one is drawn as the bare socket. */
  gems?: readonly ({ name: string; icon?: string } | undefined)[]
  socketBonus?: string
  /** With gems shown: whether they match their sockets, so the bonus is on (green) rather than grey. */
  socketBonusOn?: boolean
  /** The tier set it belongs to, with each bonus as the game prints it ("(2) Set: …"). */
  set?: { name: string; bonuses: readonly string[] }
  /** "Tier token", "Recipe" and the like, in the game's yellow. */
  kind?: string
  note?: string
  /** Where it drops, for a tab that lists drops. */
  where?: string
  /** Its place on Wowhead's Phase 2 lists: yours first when you have chosen a spec, then a few others. */
  ranks?: { yours?: string; others: readonly string[]; more: number; total: number }
  /** True for gear no spec's list ranks, which is worth saying rather than leaving blank. */
  unranked?: boolean
}

const BASE_STAT = /(Strength|Agility|Stamina|Intellect|Spirit|Armor)$/

/**
 * The app's stat line ("+33 Agility, +66 Attack Power, +66 Ranged AP") as tooltip lines. Ranged AP
 * that only mirrors Attack Power is the catalogue's bookkeeping, not a line on the item, and armour
 * is written the game's way ("441 Armor").
 */
export function statLinesFrom(described: string): ItemTipModel['stats'] {
  if (!described) return []
  const parts = described.split(', ')
  const attackPower = parts.find((part) => / Attack Power$/.test(part))
  return parts
    .filter((part) => !(attackPower && / Ranged AP$/.test(part) && part.split(' ')[0] === attackPower.split(' ')[0]))
    .map((part) => (/ Armor$/.test(part) ? { text: part.replace(/^\+/, ''), base: true } : { text: part, base: BASE_STAT.test(part) }))
}

/** "Finger 1" reads "Finger" on an item, as in the game. */
export const slotName = (slot: string | undefined) => slot?.replace(/ [12]$/, '')

/**
 * The part of a tooltip the catalogue item alone decides: its name, quality, item level, slot and
 * type line, weapon damage, stats, sockets and socket bonus. Raids adds where it drops and who ranks
 * it; Ranked Gear adds the guide's enchant and gems.
 */
export function catalogueTip(item: GearItem | undefined, name = item?.name ?? ''): ItemTipModel {
  return {
    name,
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
  }
}
