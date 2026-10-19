import type { CharacterProfile } from '../character/characterTypes'
import type { Enchant } from '../enchants/enchantTypes'
import { getEnchantById, getEnchantsForSlot } from '../enchants/sampleEnchants'
import type { GearSlot } from '../gear/gearSlots'
import { getItemById } from '../gear/itemCatalogue'
import type { EquippedGear, EquippedSlot, GearItem } from '../gear/itemTypes'
import { getPairedGearSlots, twoHanderOccupiesOffHand } from '../gear/slotCompatibility'
import { gemFitsSocket } from '../gems/gemTypes'
import { getGemById, socketBonusIsActive } from '../gems/sampleGems'
import { getGuideRecommendation } from './bisLists'
import type { RankedGearEntry } from './bisTypes'
import { equipBlock, guideFitting, listForSlot, wornItem, type RankedList } from './rankedGear'

/**
 * The Gear tab's checklist (port step 6): every slot read against the spec's own Wowhead list and its
 * gem and enchant guide. A slot is done when it holds the best item it can take, carries an enchant
 * where the guide enchants it, and has every socket filled with its bonus on. The decided design
 * (`docs/design/prototypes/tabs/gear-common.js`, `status`) was drawn for Fury; this is the same rule
 * for every spec, with its own slots and lists.
 */

/** The best item a slot can take: the list's top entry that is not already in the other ring or trinket slot, and can go here. */
export type SlotPick = { item: GearItem; entry: RankedGearEntry }

export type SlotCheck = {
  slot: GearSlot
  list?: RankedList
  /** What the slot holds, if anything. */
  item?: GearItem
  /** The worn item's entry on the slot's list, if the list ranks it. */
  entry?: RankedGearEntry
  /** A two-hander in the main hand holds the off hand, so there is nothing to wear there. */
  heldByTwoHander: boolean
  /** Counted against the list: false when the guide ranks nothing for the slot, or a two-hander holds it. */
  ranked: boolean
  best: boolean
  /** The item to equip when the slot is empty or not on its best. */
  upgrade?: SlotPick
  /** The guide's enchant for the slot, when it can go on what the slot holds (a ring enchant needs Enchanting). */
  guideEnchant?: Enchant
  missingEnchant: boolean
  sockets: number
  emptySockets: number
  hasSocketBonus: boolean
  socketBonusOn: boolean
  /** Every socket filled, but a gem's colour does not match, so the bonus is off. */
  socketBonusOff: boolean
  /**
   * The bonus is off and the guide's gems would turn it on. Some guides skip bonuses on purpose (a
   * Protection Warrior's Solid Star of Elune in every socket), so an off bonus is not always a to-do.
   */
  socketBonusFixable: boolean
  /** Anything left to do in this slot. */
  todo: boolean
}

/** The list's best entry for a slot, skipping what the paired slot wears and anything that cannot go here. */
export function bestPickFor(list: RankedList, slot: GearSlot, gear: EquippedGear): SlotPick | undefined {
  const pairedIds = new Set(
    getPairedGearSlots(slot)
      .filter((paired) => paired !== slot && list.slots.includes(paired))
      .map((paired) => wornItem(gear, paired)?.id),
  )
  for (const entry of list.entries) {
    if (pairedIds.has(entry.itemId)) continue
    const item = getItemById(entry.itemId)
    if (!item || equipBlock(item, slot, gear)) continue
    return { item, entry }
  }
  return undefined
}

/** The guide's enchant for a slot when the character may put it on this item, else nothing. */
function guideEnchantFor(character: CharacterProfile, slot: GearSlot, item: GearItem): Enchant | undefined {
  const guide = getGuideRecommendation(character.className, character.spec)
  const enchantId = guide?.enchants[slot] ?? guide?.enchants[getPairedGearSlots(slot)[0]]
  if (enchantId === undefined) return undefined
  return getEnchantsForSlot(slot, character, item).find((enchant) => enchant.id === enchantId)
}

export function checkSlot(character: CharacterProfile, slot: GearSlot, gear: EquippedGear, lists: readonly RankedList[]): SlotCheck {
  const list = listForSlot(lists, slot)
  const item = wornItem(gear, slot)
  const heldByTwoHander = slot === 'Off Hand' && twoHanderOccupiesOffHand(wornItem(gear, 'Main Hand'))
  const ranked = !!list && list.entries.length > 0 && !heldByTwoHander
  const top = ranked && list ? bestPickFor(list, slot, gear) : undefined
  const best = !!item && !!top && top.item.id === item.id
  const worn = gear[slot]

  const guideEnchant = item ? guideEnchantFor(character, slot, item) : undefined
  const missingEnchant = !!guideEnchant && !getEnchantById(worn.enchantId)
  const sockets = item?.sockets?.length ?? 0
  const emptySockets = item?.sockets?.filter((_, index) => !getGemById(worn.gemIds[index])).length ?? 0
  const hasSocketBonus = sockets > 0 && !!item?.socketBonus && Object.keys(item.socketBonus).length > 0
  const socketBonusOn = hasSocketBonus && socketBonusIsActive(item?.sockets, worn.gemIds)
  const socketBonusOff = hasSocketBonus && !socketBonusOn && emptySockets === 0
  const socketBonusFixable =
    socketBonusOff && !!item && socketBonusIsActive(item.sockets, guideGemIds(character, item, worn.gemIds))

  return {
    slot,
    ...(list ? { list } : {}),
    ...(item ? { item } : {}),
    ...(item && list ? { entry: list.entries.find((entry) => entry.itemId === item.id) } : {}),
    heldByTwoHander,
    ranked,
    best,
    ...(top && !best ? { upgrade: top } : {}),
    ...(guideEnchant ? { guideEnchant } : {}),
    missingEnchant,
    sockets,
    emptySockets,
    hasSocketBonus,
    socketBonusOn,
    socketBonusOff,
    socketBonusFixable,
    todo: (ranked && !best && !!top) || missingEnchant || emptySockets > 0 || socketBonusFixable,
  }
}

/** Every slot the character wears, in the order given. */
export function gearChecklist(
  character: CharacterProfile,
  slots: readonly GearSlot[],
  gear: EquippedGear,
  lists: readonly RankedList[],
): SlotCheck[] {
  return slots.map((slot) => checkSlot(character, slot, gear, lists))
}

export type ChecklistTotals = {
  /** Slots on their best item, out of the slots the guide ranks. */
  best: number
  ranked: number
  /** Enchants on, out of the slots the guide enchants that hold an item. */
  enchanted: number
  enchantable: number
  /** Sockets filled, out of every socket worn. */
  filled: number
  sockets: number
  /** Socket bonuses on, out of every worn item that has one. */
  bonusesOn: number
  withBonus: number
  /** Bonuses still to turn on: off while a socket is empty, or off where the guide's gems would turn them on. */
  bonusesLeft: number
  /** Slots with anything left to do. */
  left: number
}

export function checklistTotals(checks: readonly SlotCheck[]): ChecklistTotals {
  const count = (test: (check: SlotCheck) => boolean) => checks.filter(test).length
  const sockets = checks.reduce((sum, check) => sum + check.sockets, 0)
  return {
    best: count((check) => check.ranked && check.best),
    ranked: count((check) => check.ranked),
    enchanted: count((check) => !!check.guideEnchant && !check.missingEnchant),
    enchantable: count((check) => !!check.guideEnchant),
    filled: sockets - checks.reduce((sum, check) => sum + check.emptySockets, 0),
    sockets,
    bonusesOn: count((check) => check.socketBonusOn),
    withBonus: count((check) => check.hasSocketBonus),
    bonusesLeft: count((check) => (check.hasSocketBonus && check.emptySockets > 0) || check.socketBonusFixable),
    left: count((check) => check.todo),
  }
}

/* ── One-press fixes ─────────────────────────────────────────────────────────────────────────── */

/** The slot's best item, fitted the guide's way (its enchant and gems), as Ranked Gear's Equip does. */
export function equipBest(character: CharacterProfile, check: SlotCheck, gear: EquippedGear): EquippedSlot | undefined {
  return check.upgrade ? guideFitting(character, check.slot, check.upgrade.item, gear) : undefined
}

/** The slot as it is, with the guide's enchant on. */
export function withGuideEnchant(check: SlotCheck, gear: EquippedGear): EquippedSlot | undefined {
  return check.guideEnchant ? { ...gear[check.slot], enchantId: check.guideEnchant.id } : undefined
}

/** Gem ids with each empty or wrong-coloured socket given the guide's gem for its colour, where the guide has one that fits. */
function guideGemIds(character: CharacterProfile, item: GearItem, gemIds: readonly string[]): string[] {
  const guide = getGuideRecommendation(character.className, character.spec)
  return (item.sockets ?? []).map((socket, index) => {
    const gem = getGemById(gemIds[index])
    if (gem && gemFitsSocket(gem, socket)) return gem.id
    const pick = getGemById(guide?.gems[socket])
    return pick && gemFitsSocket(pick, socket) ? pick.id : (gemIds[index] ?? '')
  })
}

/**
 * The slot with its sockets filled the guide's way: a gem that matches its socket stays, and an empty
 * socket or a gem of the wrong colour takes the guide's gem for that colour, which turns the bonus on.
 * Nothing when the guide names no gem that would change anything.
 */
export function withGuideGems(character: CharacterProfile, check: SlotCheck, gear: EquippedGear): EquippedSlot | undefined {
  const worn = gear[check.slot]
  if (!check.item?.sockets?.length) return undefined
  const gemIds = guideGemIds(character, check.item, worn.gemIds)
  return gemIds.some((id, index) => id !== (worn.gemIds[index] ?? '')) ? { ...worn, gemIds } : undefined
}
