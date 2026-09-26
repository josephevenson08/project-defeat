import { getBisListForSpec } from '../../domain/bis'
import type { RankedGearEntry } from '../../domain/bis/bisTypes'
import type { CharacterProfile } from '../character/characterTypes'
import { applyWeaponSlotRules, getItemById, getPairedGearSlots, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'

/**
 * The whole ranked list, equipped in one go.
 *
 * **Two people asked for this by name.** In the 2026-09-21 usability study the raid leader and the
 * returning veteran both wanted "equip this whole list" from Ranked Gear, and the owner's heuristic
 * evaluation arrived at the same place from the other end: a planner that opens with seventeen empty
 * slots and no suggestion of what to do next is a screen with nothing to act on.
 *
 * Every slot takes its **rank 1** entry with the enchant and gems that entry recommends, which is
 * exactly what the Ranked Gear panel's per-item Equip button applies one row at a time.
 */

/**
 * The list's entries, in rank order, grouped by the *pair* of slots they can go in.
 *
 * **Rings and trinkets are named once and worn twice.** A list gives "Finger 1" a rank 1 and a rank
 * 2; both are rings, and the second hand takes the second ring. Keying this by the slot as written
 * left Finger 2 and Trinket 2 empty after equipping a whole set, with nothing on screen saying why —
 * a player would reasonably read that as the button half working.
 */
function entriesByPair(entries: readonly RankedGearEntry[]) {
  const groups = new Map<string, RankedGearEntry[]>()
  for (const entry of entries) {
    const key = getPairedGearSlots(entry.slot).join('+')
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }
  for (const group of groups.values()) group.sort((a, b) => a.rank - b.rank)
  return groups
}

function equippedSlotFor(entry: RankedGearEntry, item: GearItem): EquippedSlot {
  return {
    item,
    enchantId: entry.recommendedEnchantId,
    gemIds: item.sockets?.map((_, index) => entry.recommendedGemIds?.[index] ?? '') ?? [],
  }
}

export type RecommendedSet = {
  gear: EquippedGear
  /** How many slots the list filled, for the line the planner leaves behind afterwards. */
  filled: number
  /**
   * Slots the list names but could not fill: an item that has left the catalogue, or a second copy
   * of something unique-equipped. Reported rather than skipped quietly — a set that comes up two
   * slots short without saying so is the kind of thing a player finds out much later.
   */
  skipped: readonly GearSlot[]
}

export function buildRecommendedSet(character: CharacterProfile, gear: EquippedGear): RecommendedSet | undefined {
  const list = getBisListForSpec(character.className, character.spec)
  if (!list) return undefined

  let next: EquippedGear = { ...gear }
  const skipped: GearSlot[] = []
  let filled = 0

  for (const group of entriesByPair(list.entries).values()) {
    const slots = getPairedGearSlots(group[0].slot).filter((slot) => slot in next)
    let rank = 0

    for (const slot of slots) {
      // Walks down the ranking until something can actually be worn here, so a unique-equipped ring
      // in the first hand does not leave the second one empty — it gets the next one on the list.
      let equippedHere = false

      while (rank < group.length && !equippedHere) {
        const entry = group[rank]
        rank += 1
        const item = getItemById(entry.itemId)
        // Checked against the set as it is being built rather than the one we started from.
        if (!item || isItemBlockedByUniqueInGear(item, slot, next)) continue
        next = { ...next, [slot]: equippedSlotFor(entry, item) }
        filled += 1
        equippedHere = true
      }

      if (!equippedHere) skipped.push(slot)
    }
  }

  // Equipping a two-hander empties the off hand, exactly as equipping one by hand does.
  return { gear: applyWeaponSlotRules(next), filled, skipped }
}
