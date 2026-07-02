import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { getRoleForSpec } from '../character/tbcClasses'
import type { GearSlot } from './gearSlots'
import type { EquippedGear, GearItem, WeaponType } from './itemTypes'
import { getItemsForSlot } from './sampleItems'

const enhancementExcludedWeaponTypes: readonly WeaponType[] = ['Bow', 'Gun', 'Crossbow', 'Wand', 'Libram', 'Idol', 'Shield', 'Staff', 'Sword']
const enhancementMainHandTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger']
const enhancementOffHandTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger']

// Shamans can use Daggers, Axes, Fist Weapons, Maces, and Staves; everything else is illegal for any Shaman spec.
const shamanIllegalWeaponTypes: readonly WeaponType[] = ['Sword', 'Polearm', 'Bow', 'Gun', 'Crossbow', 'Thrown', 'Wand', 'Libram', 'Idol']
// Only Enhancement has the Dual Wield talent; other specs cannot put a second weapon in the off-hand slot.
const shamanDualWieldOnlyWeaponTypes: readonly WeaponType[] = ['Axe', 'Mace', 'Fist Weapon', 'Dagger', 'Staff']

export function isItemAllowedForCharacter(item: GearItem, className: TbcClass, spec: TbcSpec) {
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

  return true
}

export function getItemsForSlotAndCharacter(slot: GearSlot, className: TbcClass, spec: TbcSpec) {
  return getItemsForSlot(slot).filter((item) => isItemAllowedForCharacter(item, className, spec))
}

export function getFallbackItemForCharacter(slot: GearSlot, className: TbcClass, spec: TbcSpec) {
  return getItemsForSlotAndCharacter(slot, className, spec)[0]
}

export function normalizeGearForCharacter(gear: EquippedGear, className: TbcClass, spec: TbcSpec): EquippedGear {
  return Object.fromEntries(
    Object.entries(gear).map(([slot, equippedSlot]) => {
      const gearSlot = slot as GearSlot
      if (isItemAllowedForCharacter(equippedSlot.item, className, spec)) return [gearSlot, equippedSlot]

      const fallback = getFallbackItemForCharacter(gearSlot, className, spec)
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
}
