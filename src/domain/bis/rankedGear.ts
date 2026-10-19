import type { CharacterProfile } from '../character/characterTypes'
import { getEnchantsForSlot } from '../enchants/sampleEnchants'
import type { GearSlot } from '../gear/gearSlots'
import type { EquippedGear, EquippedSlot, GearItem } from '../gear/itemTypes'
import { getItemById } from '../gear/itemCatalogue'
import { getPairedGearSlots, isEmptySlotItem, isUniqueRestricted, twoHanderOccupiesOffHand } from '../gear/slotCompatibility'
import { getGearSlotDisplayName, getVisibleGearSlotsForSpec } from '../gear/slotVisibility'
import { lootKind, lootSources, lootWowItemId, sampleRaids, type Raid, type RaidBoss } from '../raids'
import { resolveAcquisition } from './acquisition'
import { getGuideRecommendation } from './bisLists'
import type { BisList, RankedGearEntry } from './bisTypes'

/**
 * Ranked Gear (port step 6): a spec's Wowhead list read against what the character wears.
 *
 * The decided design (`docs/design/prototypes/tabs/ranked-common.js`) was drawn for Fury; this is
 * the same logic over any spec's own list. One list per slot, except that rings and trinkets each
 * share one, as the guides publish them. Every item stands as worn, ranked above what you wear, or
 * not; and every item knows where it comes from, for "Where it drops".
 */

/** One of the guide's lists, and every slot it feeds: "Rings" feeds Finger 1 and Finger 2. */
export type RankedList = {
  /** The first slot the list feeds, which names it. */
  key: GearSlot
  /** "Head", "Totem" for a Shaman's relic, "Rings", "Trinkets". */
  label: string
  slots: readonly GearSlot[]
  /** Best first. Empty when the guide ranks nothing for the slot (a Feral Druid's off hand). */
  entries: readonly RankedGearEntry[]
}

/** The spec's lists in paperdoll order, one per slot or pair of slots, including slots the guide leaves empty. */
export function rankedListsFor(list: BisList): RankedList[] {
  const visible = getVisibleGearSlotsForSpec(list.className, list.spec)
  const lists: RankedList[] = []
  for (const slot of visible) {
    const slots = getPairedGearSlots(slot).filter((paired) => visible.includes(paired))
    if (slots[0] !== slot) continue
    const entries = list.entries.filter((entry) => slots.includes(entry.slot)).sort((a, b) => a.rank - b.rank)
    const label =
      slots.length > 1 ? (slot.startsWith('Finger') ? 'Rings' : 'Trinkets') : getGearSlotDisplayName(slot, list.className, list.spec)
    lists.push({ key: slot, label, slots, entries })
  }
  return lists
}

export const listForSlot = (lists: readonly RankedList[], slot: GearSlot) => lists.find((list) => list.slots.includes(slot))

/** What a slot holds, or nothing for an empty one. */
export function wornItem(gear: EquippedGear, slot: GearSlot): GearItem | undefined {
  const item = gear[slot]?.item
  return item && !isEmptySlotItem(item) ? item : undefined
}

/** The list's rank for what a slot holds: Infinity when it is empty or holds something the list does not rank. */
export function wornRank(list: RankedList, slot: GearSlot, gear: EquippedGear): number {
  const worn = wornItem(gear, slot)
  return (worn && list.entries.find((entry) => entry.itemId === worn.id)?.rank) || Infinity
}

/** The list's slots that hold this item. */
export const slotsWearing = (list: RankedList, itemId: string, gear: EquippedGear) =>
  list.slots.filter((slot) => wornItem(gear, slot)?.id === itemId)

export type Standing = 'wearing' | 'above' | 'below'

/** Worn; ranked above what you wear in the slot it would replace (the weakest of a pair); or neither. */
export function standingOf(list: RankedList, entry: RankedGearEntry, gear: EquippedGear): Standing {
  if (slotsWearing(list, entry.itemId, gear).length) return 'wearing'
  const weakest = Math.max(...list.slots.map((slot) => wornRank(list, slot, gear)))
  return entry.rank < weakest ? 'above' : 'below'
}

/** Why an item cannot go in a slot right now, or nothing when it can. */
export type EquipBlock = { kind: 'unique'; slot: GearSlot } | { kind: 'two-hander' }

export function equipBlock(item: GearItem, slot: GearSlot, gear: EquippedGear): EquipBlock | undefined {
  // A unique item can't go in one slot of a pair while the other holds it.
  if (isUniqueRestricted(item)) {
    const other = getPairedGearSlots(slot).find((paired) => paired !== slot && wornItem(gear, paired)?.id === item.id)
    if (other) return { kind: 'unique', slot: other }
  }
  // A two-hander in the main hand empties the off hand again as soon as anything is put there.
  if (slot === 'Off Hand' && twoHanderOccupiesOffHand(wornItem(gear, 'Main Hand'))) return { kind: 'two-hander' }
  return undefined
}

/**
 * For a ring or trinket, the slot Equip should use: the one holding the lower-ranked item, skipping a
 * slot it is already in or can't go in. Ties take the first slot.
 */
export function bestSlotFor(list: RankedList, item: GearItem, gear: EquippedGear): GearSlot | undefined {
  const open = list.slots.filter((slot) => wornItem(gear, slot)?.id !== item.id && !equipBlock(item, slot, gear))
  return open.reduce<GearSlot | undefined>(
    (best, slot) => (best === undefined || wornRank(list, slot, gear) > wornRank(list, best, gear) ? slot : best),
    undefined,
  )
}

/* ── Fitting an item out the guide's way ─────────────────────────────────────────────────────── */

/**
 * An item as the guide fits it out: the spec's enchant for the slot and its gem for each socket
 * colour. What you wear is shown as you wear it. An enchant the character may not use (a ring
 * enchant without Enchanting, a weapon enchant on a shield) is left off rather than shown on an
 * item it could never carry.
 */
export function guideFitting(character: CharacterProfile, slot: GearSlot, item: GearItem, gear: EquippedGear): EquippedSlot {
  if (wornItem(gear, slot)?.id === item.id) return gear[slot]
  const guide = getGuideRecommendation(character.className, character.spec)
  const enchantId = guide?.enchants[slot] ?? guide?.enchants[getPairedGearSlots(slot)[0]]
  const legal = enchantId !== undefined && getEnchantsForSlot(slot, character, item).some((enchant) => enchant.id === enchantId)
  return {
    item,
    gemIds: item.sockets?.map((socket) => guide?.gems[socket] ?? '') ?? [],
    ...(legal ? { enchantId } : {}),
  }
}

/* ── Where an item comes from ────────────────────────────────────────────────────────────────── */

export type RankedWhere =
  /** One of the app's five raids, and the boss when the loot tables name one. `token` is "T5 token" for a set piece. */
  | { kind: 'raid'; raid: Raid; boss?: RaidBoss; token?: string }
  | { kind: 'world' | 'craft' | 'other'; text: string }

/** Tempest Keep is "Tempest Keep" as players say it, as on the Raids tab. */
export const raidShortName = (raid: Raid) => (raid.id === 'tempest-keep' ? 'Tempest Keep' : raid.name)

/** The raids in the order a Phase 2 raider meets them: this tier's first, then last tier's. */
export const raidsInOrder: readonly Raid[] = [...sampleRaids].sort((a, b) => b.phase - a.phase)

/** Set pieces bought with a token, by item id, where the loot tables list them under the token's boss. */
const tokenPieces = new Set<number>()
for (const raid of sampleRaids) {
  for (const source of lootSources(raid)) {
    for (const entry of source.entries) {
      const id = lootWowItemId(entry)
      if (id !== undefined && lootKind(entry) === 'set-piece') tokenPieces.add(id)
    }
  }
}

/** The first word of a tier token's name for each slot a token buys: "Helm of the Vanquished Hero". */
const TOKEN_WORD: Partial<Record<GearSlot, string>> = { Head: 'Helm', Shoulders: 'Pauldrons', Chest: 'Chestguard', Hands: 'Gloves', Legs: 'Leggings' }

/**
 * The boss whose token buys a tier piece, from the loot tables' own tokens: many classes' pieces are
 * not listed under the boss themselves (Cataclysm Helm, Warbringer Battle-Helm), but the raid's token
 * for that slot is, and all three of a slot's tokens drop from the same boss.
 */
function tokenBoss(raid: Raid, item: GearItem): RaidBoss | undefined {
  const word = item.setId ? TOKEN_WORD[item.slot] : undefined
  if (!word) return undefined
  return lootSources(raid).find((source) => source.entries.some((entry) => lootKind(entry) === 'token' && entry.name.startsWith(`${word} of the `)))
    ?.boss
}

/** The raid an instance name means, by its name or any spelling the app knows it by. */
const raidNamed = (instance: string | undefined) =>
  instance ? sampleRaids.find((raid) => raid.name === instance || raid.instanceNames.includes(instance)) : undefined

/**
 * The guide's source column made readable: "Vendor: (41 Badges of Justice)" → "Vendor: 41 Badges of
 * Justice", "Vendor: - Requires Exalted with Lower City" → "Vendor: Requires Exalted with Lower City".
 * A column with nothing left in it ("Quest: /", "25x", "-") gives nothing, so the structured source is
 * used instead.
 */
function cleanSourceText(text: string | undefined): string | undefined {
  const cleaned = text
    ?.replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,-]+/, '')
    .replace(/([:;])\s*[-,]\s*/g, '$1 ')
    .replace(/[\s:;,-]+$/, '')
    .replace(/^(\w+): \1$/i, '$1')
    .trim()
  if (!cleaned) return undefined
  const body = cleaned.replace(/^(Drop|Quest|Vendor|Sold by|PvP|Arena)\s*[:;]\s*/i, '')
  return (body.match(/[a-z]/gi) ?? []).length >= 3 ? cleaned : undefined
}

/**
 * Where a ranked item comes from: a raid and its boss (from the loot tables, through
 * `resolveAcquisition`), a world boss, a profession, or anything else (badges, PvP, quests,
 * dungeons, older raids), said in the guide's own words when nothing more exact is known.
 */
export function whereFrom(entry: RankedGearEntry | undefined, item: GearItem | undefined): RankedWhere {
  const acquired = resolveAcquisition(entry, item)
  const raid = raidNamed(acquired.instance)
  if (raid) {
    const id = entry?.wowItemId ?? item?.wowItemId
    const listed = acquired.boss ? lootSources(raid).find((source) => source.boss?.name === acquired.boss)?.boss : undefined
    const byToken = item ? tokenBoss(raid, item) : undefined
    const token = (id !== undefined && tokenPieces.has(id)) || byToken !== undefined
    const boss = listed ?? byToken
    return { kind: 'raid', raid, ...(boss ? { boss } : {}), ...(token ? { token: `${raid.tier} token` } : {}) }
  }
  if (acquired.instance === 'World Boss' || /world boss/i.test(entry?.label ?? '')) {
    return { kind: 'world', text: acquired.boss ? `World boss: ${acquired.boss}` : 'World boss' }
  }
  if (acquired.type === 'Crafted' || acquired.craftedBy) {
    return { kind: 'craft', text: acquired.craftedBy ? `Crafted: ${acquired.craftedBy}` : 'Crafted' }
  }
  const place = [acquired.type, acquired.instance ?? acquired.vendor ?? acquired.reputation]
    .filter((part) => part && /[a-z]{3}/i.test(part))
    .join(': ')
  return { kind: 'other', text: cleanSourceText(entry?.sourceText) ?? (place || 'Source not recorded') }
}

/** One line for a tooltip: "Lady Vashj, Serpentshrine Cavern", "T5 token · Lady Vashj, …", "Crafted: Engineering". */
export function whereText(where: RankedWhere): string {
  if (where.kind !== 'raid') return where.text
  const place = where.boss ? `${where.boss.name}, ${raidShortName(where.raid)}` : raidShortName(where.raid)
  return where.token ? `${where.token} · ${place}` : place
}

/* ── Every item once, for "Where it drops" ───────────────────────────────────────────────────── */

export type RankedItem = {
  itemId: string
  item: GearItem
  /** Every list that ranks it: a one-hander can be ranked for both hands. */
  on: readonly { list: RankedList; entry: RankedGearEntry; standing: Standing }[]
  /** Wearing it anywhere wins, then ranked above what you wear on any list. */
  standing: Standing
  /** Where Equip puts it: the slot it does most for on the first list it would improve. */
  target?: GearSlot
  where: RankedWhere
}

export function rankedItems(lists: readonly RankedList[], gear: EquippedGear): RankedItem[] {
  const byId = new Map<string, { item: GearItem; on: RankedItem['on'][number][] }>()
  for (const list of lists) {
    for (const entry of list.entries) {
      const item = getItemById(entry.itemId)
      if (!item) continue
      const found = byId.get(entry.itemId) ?? { item, on: [] }
      found.on.push({ list, entry, standing: standingOf(list, entry, gear) })
      byId.set(entry.itemId, found)
    }
  }
  return [...byId.entries()].map(([itemId, { item, on }]) => {
    const standing: Standing = on.some((o) => o.standing === 'wearing')
      ? 'wearing'
      : on.some((o) => o.standing === 'above')
        ? 'above'
        : 'below'
    const better = on.find((o) => o.standing === 'above')
    const target = better ? bestSlotFor(better.list, item, gear) : undefined
    return { itemId, item, on, standing, ...(target ? { target } : {}), where: whereFrom(on[0].entry, item) }
  })
}

/** How many ranked items sit above what you wear, for the "Where it drops" switch. */
export const upgradesLeft = (items: readonly RankedItem[]) => items.filter((item) => item.standing === 'above').length
