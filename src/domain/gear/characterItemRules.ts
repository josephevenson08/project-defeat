import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { getRoleForSpec } from '../character/tbcClasses'
import type { GearSlot } from './gearSlots'
import type { EquippedGear, GearItem, WeaponType } from './itemTypes'

import { getItemsForSlot, isWithinDefaultPhase } from './itemCatalogue'
import { isObtainable } from './obtainability'
import {
  EMPTY_OFF_HAND,
  getDefaultItemForSlot,
  isEmptySlotItem,
  isUniqueRestricted,
  twoHanderOccupiesOffHand,
} from './slotCompatibility'

const enhancementExcludedWeaponTypes: readonly WeaponType[] = ['Bow', 'Gun', 'Crossbow', 'Wand', 'Libram', 'Idol', 'Shield', 'Staff', 'Sword']
const enhancementMainHandTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger']
const enhancementOffHandTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger']

// Shamans can use Daggers, Axes, Fist Weapons, Maces, and Staves; everything else is illegal for any Shaman spec.
const shamanIllegalWeaponTypes: readonly WeaponType[] = ['Sword', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Wand', 'Libram', 'Idol']
// Only Enhancement has the Dual Wield talent; other specs cannot put a second weapon in the off-hand slot.
const shamanDualWieldOnlyWeaponTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger', 'Staff']

// Paladins can use Axes, Maces, Swords, Polearms, and Shields; everything else is illegal for any Paladin spec.
const paladinIllegalWeaponTypes: readonly WeaponType[] = ['Dagger', 'Fist Weapon', 'Staff', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Wand', 'Totem', 'Idol']

// Priests can use Daggers, Maces, Staves, and Wands; everything else is illegal for any Priest spec.
const priestIllegalWeaponTypes: readonly WeaponType[] = ['Axe', 'Sword', 'Fist Weapon', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Totem', 'Libram', 'Idol']

// Druids can use Daggers, Maces, Staves, and Fist Weapons; everything else is illegal for any Druid spec.
const druidIllegalWeaponTypes: readonly WeaponType[] = ['Axe', 'Sword', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Wand', 'Totem', 'Libram']

// Hunters can use Axes, Daggers, Fist Weapons, Swords, Polearms, and Staves for melee, plus Bows/Guns/
// Crossbows/Thrown for Ranged; no Maces, Wands, Shields, or caster off-hand items.
const hunterIllegalWeaponTypes: readonly WeaponType[] = ['Mace', 'Wand', 'Shield', 'Held In Off-hand', 'Totem', 'Libram', 'Idol']

// Mages can use Daggers, Swords, Staves, and Wands; everything else is illegal for any Mage spec.
const mageIllegalWeaponTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Shield', 'Totem', 'Libram', 'Idol']

// Rogues can use Daggers, Fist Weapons, Swords, and Maces for melee (full dual-wield, no talent
// gate needed), plus Bows/Guns/Crossbows/Thrown for Ranged; no Axes, Polearms, Staves, Wands, or Shields.
const rogueIllegalWeaponTypes: readonly WeaponType[] = ['Axe', 'Polearm', 'Staff', 'Wand', 'Shield', 'Held In Off-hand', 'Totem', 'Libram', 'Idol']

// Warlocks can use Daggers, Swords, Staves, and Wands; everything else is illegal for any Warlock spec.
const warlockIllegalWeaponTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Shield', 'Totem', 'Libram', 'Idol']

/**
 * Which two-handed weapon types each class may actually wield.
 *
 * The `weaponType` lists below cannot express this on their own: TBC gives one- and two-handed
 * swords, axes and maces the **same** `weaponType`, so "Rogues may use swords" silently admitted
 * two-handed ones. A Rogue was being handed Twinblade of the Phoenix, a two-hander no Rogue can
 * equip in any expansion — and once the off-hand rule landed, that also cost them their off hand.
 * The same hole let a Mage or Warlock be offered a two-handed sword, since neither class's illegal
 * list mentions swords at all.
 *
 * Read as: everything **not** listed here is off-limits in two-handed form. Rogue is deliberately an
 * empty set rather than a missing key, because "no two-handers at all" is the actual rule.
 */
const TWO_HANDED_PROFICIENCIES: Record<TbcClass, readonly WeaponType[]> = {
  Warrior: ['Axe', 'Mace', 'Sword', 'Polearm', 'Staff'],
  Paladin: ['Axe', 'Mace', 'Sword', 'Polearm'],
  Hunter: ['Axe', 'Sword', 'Polearm', 'Staff'],
  Shaman: ['Axe', 'Mace', 'Staff'],
  Druid: ['Mace', 'Staff', 'Polearm'],
  Priest: ['Staff'],
  Mage: ['Staff'],
  Warlock: ['Staff'],
  Rogue: [],
}

export function isItemAllowedForCharacter(item: GearItem, className: TbcClass, spec: TbcSpec) {
  // First, and for every class alike: an item nobody can acquire is not gear. This gate is here
  // rather than in the catalogue so the items stay readable as data — raid loot and provenance can
  // still name them — while nothing can equip, default to, or be upgraded into one. See
  // `obtainability.ts` for why each entry is on that list.
  if (!isObtainable(item)) return false

  // Handedness before weapon type, because the type alone cannot tell a one-handed sword from a
  // two-handed one and every class list below is written in terms of type.
  if (item.handType === 'Two Hand' && item.weaponType && !TWO_HANDED_PROFICIENCIES[className].includes(item.weaponType)) {
    return false
  }

  if (item.allowedClasses && !item.allowedClasses.includes(className)) return false
  if (item.allowedSpecs && !item.allowedSpecs.includes(spec)) return false

  const role = getRoleForSpec(className, spec)
  if (item.roles && !item.roles.includes(role) && !item.roles.includes('Hybrid')) return false

  if (className === 'Shaman') {
    if (item.weaponType && shamanIllegalWeaponTypes.includes(item.weaponType)) return false
    if (item.slot === 'Relic' && item.weaponType && item.weaponType !== 'Totem') return false

    if (spec === 'Enhancement') {
      if (item.weaponType && enhancementExcludedWeaponTypes.includes(item.weaponType)) return false
      if (item.slot === 'Main Hand' && item.weaponType && !enhancementMainHandTypes.includes(item.weaponType)) return false
      if (item.slot === 'Off Hand' && item.weaponType && !enhancementOffHandTypes.includes(item.weaponType)) return false
    } else if (item.slot === 'Off Hand' && item.weaponType && shamanDualWieldOnlyWeaponTypes.includes(item.weaponType)) {
      return false
    }
  }

  if (className === 'Paladin') {
    if (item.weaponType && paladinIllegalWeaponTypes.includes(item.weaponType)) return false
    if (item.slot === 'Relic' && item.weaponType && item.weaponType !== 'Libram') return false
  }

  if (className === 'Priest' && item.weaponType && priestIllegalWeaponTypes.includes(item.weaponType)) return false

  if (className === 'Druid') {
    if (item.weaponType && druidIllegalWeaponTypes.includes(item.weaponType)) return false
    if (item.slot === 'Relic' && item.weaponType && item.weaponType !== 'Idol') return false
  }

  if (className === 'Hunter' && item.weaponType && hunterIllegalWeaponTypes.includes(item.weaponType)) return false

  if (className === 'Mage' && item.weaponType && mageIllegalWeaponTypes.includes(item.weaponType)) return false

  if (className === 'Rogue' && item.weaponType && rogueIllegalWeaponTypes.includes(item.weaponType)) return false

  if (className === 'Warlock' && item.weaponType && warlockIllegalWeaponTypes.includes(item.weaponType)) return false

  return true
}

export function getItemsForSlotAndCharacter(slot: GearSlot, className: TbcClass, spec: TbcSpec) {
  return getItemsForSlot(slot).filter((item) => isItemAllowedForCharacter(item, className, spec))
}

/**
 * Replacement for an item the character cannot legally wear. Shares `getDefaultItemForSlot`'s
 * highest-item-level rule rather than taking the first match — otherwise switching class silently
 * dropped the affected slots back to Classic-era greens while the untouched slots stayed at Tier 5.
 */
export function getFallbackItemForCharacter(slot: GearSlot, className: TbcClass, spec: TbcSpec) {
  return getDefaultItemForSlot(slot, getItemsForSlotAndCharacter(slot, className, spec))
}

/**
 * Enforces the one weapon rule that spans two slots: a two-hander leaves the off hand empty.
 *
 * Applied wherever gear changes rather than only at normalisation, because equipping a two-hander by
 * hand has to clear the off hand just as switching spec into one does. Idempotent, so calling it
 * twice is free.
 */
export function applyWeaponSlotRules(gear: EquippedGear): EquippedGear {
  if (!twoHanderOccupiesOffHand(gear['Main Hand']?.item)) return gear
  if (gear['Off Hand']?.item.id === EMPTY_OFF_HAND.id) return gear
  return { ...gear, 'Off Hand': { item: EMPTY_OFF_HAND, gemIds: [] } }
}

/**
 * Whether an already-equipped item may stay put through a normalisation pass.
 *
 * Two independent reasons to replace one, and they are deliberately checked together here because
 * every caller of this function wants both: the character cannot *wear* it, or the content it comes
 * from is not open yet.
 *
 * The phase half is the one that was missing, and it was reachable three ways — restoring a saved
 * build, importing someone else's, and equipping straight off the Ranked Gear panel, which resolves
 * by id and so never passes the slot query that filters by phase. The result was gear the Gear panel
 * would not list and the upgrade finder would not consider, sitting equipped and counted in every
 * stat total. `EMPTY_OFF_HAND` is exempt: it is a placeholder with no phase, and the off-hand refill
 * below is what decides its fate.
 */
function isKeepable(item: GearItem, className: TbcClass, spec: TbcSpec): boolean {
  if (!isItemAllowedForCharacter(item, className, spec)) return false
  // Any empty placeholder is exempt, not just the off hand's: a newly created character starts with
  // every slot empty, and a placeholder has no phase to be within.
  return isEmptySlotItem(item) || isWithinDefaultPhase(item)
}

export function normalizeGearForCharacter(gear: EquippedGear, className: TbcClass, spec: TbcSpec): EquippedGear {
  // Unique items already surviving the switch are withheld from the fallbacks. Two illegal paired
  // slots would otherwise both fall back to the same highest-item-level option and produce a doubled
  // unique — a state the gear panel refuses to let a player build by hand.
  const usedUniqueIds = new Set(
    Object.values(gear)
      .filter((equipped) => isKeepable(equipped.item, className, spec) && isUniqueRestricted(equipped.item))
      .map((equipped) => equipped.item.id),
  )

  const normalized = Object.fromEntries(
    Object.entries(gear).map(([slot, equippedSlot]) => {
      const gearSlot = slot as GearSlot
      if (isKeepable(equippedSlot.item, className, spec)) return [gearSlot, equippedSlot]

      const options = getItemsForSlotAndCharacter(gearSlot, className, spec).filter((item) => !usedUniqueIds.has(item.id))
      const fallback = getDefaultItemForSlot(gearSlot, options)
      if (fallback && isUniqueRestricted(fallback)) usedUniqueIds.add(fallback.id)

      return [
        gearSlot,
        fallback
          ? {
              item: fallback,
              gemIds: fallback.sockets?.map(() => '') ?? [],
            }
          : equippedSlot,
      ]
    }),
  ) as EquippedGear

  // Last, because the fallbacks above choose each hand independently and can themselves produce the
  // illegal pairing — a spec switching into a two-hander is exactly when this fires.
  if (twoHanderOccupiesOffHand(normalized['Main Hand']?.item)) return applyWeaponSlotRules(normalized)

  /*
   * And the reverse. An empty off hand is legal only next to a two-hander, so switching *out* of one
   * has to fill it again — otherwise the placeholder survives `isItemAllowedForCharacter`, which has
   * no restrictions to fail, and the slot stays empty forever. That cost a Protection Warrior its
   * shield, and with it every block calculation in Effective Health.
   *
   * **Gated on the main hand holding something**, which is what makes it a *restore* rather than a
   * fabrication. A newly created character has both hands empty, and without this gate the rule read
   * that as "switched out of a two-hander" and handed them an off-hand weapon they never picked —
   * the only item on an otherwise bare paperdoll, quietly worth 52 attack power and 20 expertise on
   * the stat rail.
   */
  if (isEmptySlotItem(normalized['Off Hand']?.item) && !isEmptySlotItem(normalized['Main Hand']?.item)) {
    const options = getItemsForSlotAndCharacter('Off Hand', className, spec).filter((item) => !usedUniqueIds.has(item.id))
    const fallback = getDefaultItemForSlot('Off Hand', options)
    if (fallback) {
      return { ...normalized, 'Off Hand': { item: fallback, gemIds: fallback.sockets?.map(() => '') ?? [] } }
    }
  }

  return normalized
}
