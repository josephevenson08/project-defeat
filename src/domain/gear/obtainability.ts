import type { GearItem } from './itemTypes'

/**
 * Items the catalogue carries that no character can actually acquire and equip.
 *
 * Why this exists: the upstream item database is the *game's* item table, not a list of gear players
 * can wear. It includes encounter props, developer test items and unused art. Left in the equip pool
 * these do not merely clutter the picker — `getDefaultItemForSlot` picks by highest item level, so
 * before this list existed **all 27 specs defaulted their weapon slots to Kael'thas's encounter
 * weapons**. Every stat total, simulation and stat weight in the app started from a weapon that
 * cannot be held, and the upgrade finder could never beat ilvl 175 so it never proposed a weapon.
 *
 * The evidence, rather than recall:
 *
 * - **The seven ilvl 175 weapons are the only items at that item level in a 4,505-item catalogue.**
 *   The next rung down is 164, which is Sunwell — the highest obtainable gear in all of TBC, two
 *   phases past this app's Phase 2 target of ~141. An item eleven levels above the expansion's
 *   ceiling is not gear anyone wears. They are what Kael'thas summons in phase 2 of his fight in
 *   Tempest Keep, and they despawn with the encounter.
 * - **Trashbringer is the sole item at ilvl 155**, wedged between 154 and 156, and its Wowhead page
 *   carries no source tab at all — no drop, no vendor, no quest. Same for Andonisus and for the
 *   uncorrupted Ashbringer, which was never obtainable in-game.
 *
 * Deliberately *not* on this list: Sulfuras, Thunderfury, Atiesh, the Warglaives and Thori'dal. Those
 * are real legendaries a character can genuinely carry, and all of them sit at or below 164.
 */
const UNOBTAINABLE: ReadonlyArray<{ wowItemId: number; name: string; why: string }> = [
  // Summoned by Kael'thas Sunstrider in Tempest Keep: The Eye and despawned at the end of the fight.
  { wowItemId: 30311, name: 'Warp Slicer', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30312, name: 'Infinity Blade', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30313, name: 'Staff of Disintegration', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30314, name: 'Phaseshift Bulwark', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30316, name: 'Devastation', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30317, name: 'Cosmic Infuser', why: 'Kael\'thas encounter weapon, ilvl 175' },
  { wowItemId: 30318, name: 'Netherstrand Longbow', why: 'Kael\'thas encounter weapon, ilvl 175' },

  // No source of any kind on Wowhead: never placed in the world.
  { wowItemId: 32824, name: 'Trashbringer', why: 'developer item, no obtainable source' },
  { wowItemId: 22736, name: 'Andonisus, Reaper of Souls', why: 'developer item, no obtainable source' },
  { wowItemId: 13262, name: 'Ashbringer', why: 'never obtainable in-game; only Corrupted Ashbringer existed' },
]

export const unobtainableWowItemIds: ReadonlySet<number> = new Set(UNOBTAINABLE.map((entry) => entry.wowItemId))

/** Exported for the test suite, so the reasons are asserted rather than living only in a comment. */
export const unobtainableItems = UNOBTAINABLE

/**
 * Whether a character could actually acquire this item.
 *
 * Items with no `wowItemId` are treated as obtainable: the curated provenance layer carries a few
 * entries with no real item behind them, and excluding those would silently empty slots.
 */
export function isObtainable(item: GearItem): boolean {
  return item.wowItemId === undefined || !unobtainableWowItemIds.has(item.wowItemId)
}
