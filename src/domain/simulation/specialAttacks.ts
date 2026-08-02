import type { SignatureAbility } from '../abilities'
import type { GearItem } from '../gear/itemTypes'
import { AP_PER_DPS } from './combatConstants'

/**
 * Energy regenerates at a flat 20 per 2s tick in TBC, i.e. 10/second, with no haste scaling. That
 * fixed rate is what makes an energy-cost ability's sustained frequency computable at all — rage and
 * mana have no equivalent, which is why those are not modelled here.
 */
export const ENERGY_PER_SECOND = 10

/**
 * Normalized weapon speeds used for the attack-power portion of a normalized special. The point of
 * normalization is that a slow weapon gains no advantage on instant attacks, so the AP contribution
 * is valued at a fixed speed for the weapon class rather than the weapon's real speed.
 */
export const NORMALIZED_SPEEDS = {
  dagger: 1.7,
  oneHand: 2.4,
  twoHand: 3.3,
  ranged: 2.8,
} as const

/**
 * `GearItem` records a weapon's type and speed but not its handedness, and one-handed and two-handed
 * swords/axes/maces share a `weaponType`. Speed is the available proxy: TBC one-handers sit at or
 * below ~2.8 and two-handers at or above ~3.0. Polearms and staves are always two-handed.
 *
 * This is an approximation and it only affects the AP portion of a normalized special, so an
 * occasional misclassification shifts that ability's damage by a few percent rather than breaking it.
 */
export function normalizedSpeedForWeapon(item: GearItem): number {
  if (item.weaponType === 'Dagger') return NORMALIZED_SPEEDS.dagger
  if (item.weaponType === 'Bow' || item.weaponType === 'Gun' || item.weaponType === 'Crossbow') return NORMALIZED_SPEEDS.ranged
  if (item.weaponType === 'Polearm' || item.weaponType === 'Staff') return NORMALIZED_SPEEDS.twoHand
  if ((item.weaponSpeed ?? 0) >= 3) return NORMALIZED_SPEEDS.twoHand
  return NORMALIZED_SPEEDS.oneHand
}

/**
 * Average damage of one swing of this weapon, which is what a "% weapon damage" special multiplies.
 * A swing is the weapon's own damage roll plus the attack power contribution over the swing window —
 * normalized specials value that window at the weapon class's fixed speed instead of the real one.
 */
export function averageSwingDamage(item: GearItem | undefined, attackPower: number, normalized: boolean): number {
  if (!item?.weaponDamageMin || !item.weaponDamageMax || !item.weaponSpeed) return 0

  const weaponRoll = (item.weaponDamageMin + item.weaponDamageMax) / 2
  const speed = normalized ? normalizedSpeedForWeapon(item) : item.weaponSpeed
  return weaponRoll + (attackPower / AP_PER_DPS) * speed
}

/**
 * An off-hand weapon contributes half its swing to a special that strikes with both hands. The
 * halving covers the weapon roll *and* the attack power folded into the swing window, but **not** any
 * flat bonus the ability adds — wowsims/tbc computes it as `damage*0.5 + flatBonus`, in that order.
 *
 * (wowsims also doubles a *target-specific* AP bonus before halving so it nets out at full value.
 * That term is a debuff-supplied modifier this project has no equivalent of, so there is nothing to
 * double here.)
 */
export const OFF_HAND_DAMAGE_PENALTY = 0.5

export type SpecialUsageBasis = 'cooldown' | 'energy' | 'unmodelled'

export type SpecialAttackEstimate = {
  /** Average damage of a single use, before the attack table and before armor. */
  damagePerUse: number
  /** Sustained uses per second. Zero when the rate can't be defended. */
  usesPerSecond: number
  basis: SpecialUsageBasis
  /** Why the rate is what it is, for the UI to show rather than hide. */
  explanation: string
}

/**
 * How often the ability can actually be used, sustained.
 *
 * A cooldown gives a hard, defensible ceiling and a raiding character presses these on cooldown, so
 * that's the rate. An energy cost against the fixed 10/second regen gives an equally computable
 * rate. Rage and mana costs without a cooldown do not: sustained rage income depends on damage taken
 * and dealt, and a mana-costed shot rotation depends on auto-attack weaving. Rather than invent a
 * number for those, they're reported as unmodelled.
 */
export function computeUsageRate(ability: SignatureAbility): { usesPerSecond: number; basis: SpecialUsageBasis; explanation: string } {
  const gcd = ability.gcdSeconds || 1.5

  if (ability.cooldownSeconds) {
    const interval = Math.max(ability.cooldownSeconds, gcd)
    return {
      usesPerSecond: 1 / interval,
      basis: 'cooldown',
      explanation: `used on its ${ability.cooldownSeconds}s cooldown`,
    }
  }

  if (ability.resource?.type === 'Energy' && ability.resource.cost > 0) {
    // Capped at one per GCD: energy could in principle fund a faster rate than the GCD allows.
    const rate = Math.min(ENERGY_PER_SECOND / ability.resource.cost, 1 / gcd)
    return {
      usesPerSecond: rate,
      basis: 'energy',
      explanation: `${ability.resource.cost} energy against ${ENERGY_PER_SECOND}/sec regen, so roughly one per ${(1 / rate).toFixed(1)}s`,
    }
  }

  return {
    usesPerSecond: 0,
    basis: 'unmodelled',
    explanation:
      ability.resource?.type === 'Rage'
        ? 'rage income depends on damage dealt and taken, which this simulator does not track'
        : 'usage rate depends on rotation and auto-attack weaving, which this simulator does not model',
  }
}

/**
 * Average damage of a single use of a physical special, combining its weapon-damage portion, flat
 * bonus, attack-power coefficient and flat base amount — whichever of those the ability actually has.
 *
 * Abilities flagged `hitsBothWeapons` (Mutilate, Stormstrike) strike once with each hand, and the
 * weapon-damage portion and flat bonus therefore apply per hand. Applying them once would halve those
 * abilities.
 *
 * The off-hand strike is not a mirror of the main-hand one: its weapon damage is halved by
 * `OFF_HAND_DAMAGE_PENALTY`, while its flat bonus is not. Treating the two hands identically
 * overstated every `hitsBothWeapons` ability.
 */
export function computeSpecialDamagePerUse(
  ability: SignatureAbility,
  mainHand: GearItem | undefined,
  offHand: GearItem | undefined,
  attackPower: number,
): number {
  const { scaling } = ability
  const normalized = scaling.normalizedWeaponDamage === true
  const weaponMultiplier = scaling.weaponDamageMultiplier ?? 0
  const flatBonus = scaling.flatWeaponDamageBonus ?? 0

  let damage = 0

  if (weaponMultiplier > 0 || flatBonus > 0) {
    const perHand = (weapon: GearItem | undefined, isOffHand: boolean) => {
      const swing = averageSwingDamage(weapon, attackPower, normalized)
      const weaponPortion = isOffHand ? swing * OFF_HAND_DAMAGE_PENALTY : swing
      return weaponPortion * weaponMultiplier + flatBonus
    }

    damage += perHand(mainHand, false)
    if (scaling.hitsBothWeapons && offHand) damage += perHand(offHand, true)
  }

  if (scaling.attackPowerCoefficient) damage += attackPower * scaling.attackPowerCoefficient

  if (ability.baseAmount) damage += (ability.baseAmount.min + ability.baseAmount.max) / 2

  return damage
}

export function estimateSpecialAttack(
  ability: SignatureAbility,
  mainHand: GearItem | undefined,
  offHand: GearItem | undefined,
  attackPower: number,
): SpecialAttackEstimate {
  const { usesPerSecond, basis, explanation } = computeUsageRate(ability)
  return {
    damagePerUse: computeSpecialDamagePerUse(ability, mainHand, offHand, attackPower),
    usesPerSecond,
    basis,
    explanation,
  }
}
