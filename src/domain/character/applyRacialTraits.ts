import type { EquippedGear, WeaponType } from '../gear/itemTypes'
import { addStats, applyStatMultipliers } from '../stats/statUtils'
import type { StatBlock } from '../stats/statTypes'
import type { TbcClass, TbcRace } from './characterTypes'
import type { RacialTrait } from './racialTypes'
import { getRacialTraitsForRace } from './sampleRacialTraits'

/**
 * Weapon-conditional racials key off what's actually equipped. Sword/Mace/Axe specialization read
 * the melee hands; Gun/Bow specialization read the Ranged slot. Checking every weapon slot rather
 * than guessing per trait keeps this correct if a future trait covers a different slot.
 */
function equippedWeaponTypes(gear: EquippedGear | undefined): ReadonlySet<WeaponType> {
  const types = new Set<WeaponType>()
  if (!gear) return types

  for (const slot of ['Main Hand', 'Off Hand', 'Ranged'] as const) {
    const weaponType = gear[slot]?.item.weaponType
    if (weaponType) types.add(weaponType)
  }

  return types
}

export function isRacialTraitActive(trait: RacialTrait, className: TbcClass, gear: EquippedGear | undefined): boolean {
  if (trait.kind === 'on-use' || trait.kind === 'utility') return false
  if (trait.requiresClasses && !trait.requiresClasses.includes(className)) return false
  if (!trait.requiresWeaponTypes) return true

  const equipped = equippedWeaponTypes(gear)
  return trait.requiresWeaponTypes.some((weaponType) => equipped.has(weaponType))
}

/** The racials currently contributing stats, for the UI to show alongside the ones that aren't. */
export function getActiveRacialTraits(race: TbcRace, className: TbcClass, gear: EquippedGear | undefined): readonly RacialTrait[] {
  return getRacialTraitsForRace(race).filter(
    (trait) => isRacialTraitActive(trait, className, gear) && (trait.stats || trait.statMultipliers),
  )
}

/**
 * Folds a race's passive and weapon-conditional racials into a stat total. Must be called *before*
 * the primary-stat derivations so that a percentage bonus to a primary stat (Gnome's +5% Intellect,
 * Human's +10% Spirit) cascades into the spell power and healing power those stats feed.
 */
export function applyRacialTraits(total: StatBlock, race: TbcRace, className: TbcClass, gear: EquippedGear | undefined): StatBlock {
  let next = total

  for (const trait of getRacialTraitsForRace(race)) {
    if (!isRacialTraitActive(trait, className, gear)) continue
    next = addStats(next, trait.stats)
    next = applyStatMultipliers(next, trait.statMultipliers)
  }

  return next
}
