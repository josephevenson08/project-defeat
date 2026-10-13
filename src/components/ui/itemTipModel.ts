import type { ItemQuality, SocketColor } from '../../domain/gear/itemTypes'

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
  sockets?: readonly SocketColor[]
  socketBonus?: string
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
