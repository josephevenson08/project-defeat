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
 * Everything the damage formulas actually read off a weapon. Narrower than `GearItem` so a form's
 * substituted weapon can be expressed without inventing a catalog entry for it; a real `GearItem`
 * satisfies this structurally.
 */
export type WeaponDamageProfile = Pick<GearItem, 'weaponType' | 'weaponSpeed' | 'weaponDamageMin' | 'weaponDamageMax'>

/**
 * Cat form does not swing the equipped weapon. TBC substitutes a fixed internal weapon and every cat
 * ability reads that instead, so a Feral druid's damage is completely independent of the equipped
 * weapon's damage dice and speed.
 *
 * Values are the ones wowsims/tbc hands `EnableAutoAttacks` in `sim/druid/feral/feral.go`:
 * 43.5-66.5 damage on a 1.0s swing.
 *
 * The equipped weapon still matters, but only as a stat stick — its Agility, Strength and especially
 * its **Feral Attack Power**, which TBC puts on druid weapons as an explicit item stat and which adds
 * 1:1 into attack power. This project's catalog does not record Feral Attack Power yet, so Feral
 * weapon comparisons currently under-differentiate. That is a gap in the item data, not in this model.
 */
export const CAT_FORM_WEAPON: WeaponDamageProfile = {
  weaponType: undefined,
  weaponSpeed: 1,
  weaponDamageMin: 43.5,
  weaponDamageMax: 66.5,
}

/** Feral is modelled as cat DPS, and cat form swings `CAT_FORM_WEAPON` rather than the equipped item. */
export function usesCatFormWeapon(className: string, spec: string) {
  return className === 'Druid' && spec === 'Feral'
}

/**
 * `GearItem` records a weapon's type and speed but not its handedness, and one-handed and two-handed
 * swords/axes/maces share a `weaponType`. Speed is the available proxy: TBC one-handers sit at or
 * below ~2.8 and two-handers at or above ~3.0. Polearms and staves are always two-handed.
 *
 * This is an approximation and it only affects the AP portion of a normalized special, so an
 * occasional misclassification shifts that ability's damage by a few percent rather than breaking it.
 */
export function normalizedSpeedForWeapon(item: WeaponDamageProfile): number {
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
export function averageSwingDamage(item: WeaponDamageProfile | undefined, attackPower: number, normalized: boolean): number {
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

export type SpecialUsageBasis = 'cooldown' | 'energy' | 'weave' | 'unmodelled'

/**
 * What `computeUsageRate` needs from outside the ability to price a rate.
 *
 * Only the weave case uses it so far. Passed rather than derived because the effective swing speed
 * is a gear-and-talent figure the caller has already computed, and recomputing it here would be a
 * second place for haste to be applied differently.
 */
export type SpecialUsageContext = {
  /** Seconds between auto shots after haste, or undefined when nothing is equipped to shoot with. */
  rangedSwingSeconds?: number
}

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
 * rate. Rage without a cooldown does not: sustained rage income depends on damage taken and dealt.
 * Rather than invent a number for that, it is reported as unmodelled.
 *
 * **A ranged special is the weave case, and it used to be reported as unmodelled with it.** It is
 * not the same problem: a shot rotation is bounded by two things that are both computable, and
 * `rangedSwingSeconds` is the piece that was missing rather than the mechanism.
 */
export function computeUsageRate(
  ability: SignatureAbility,
  context: SpecialUsageContext = {},
): { usesPerSecond: number; basis: SpecialUsageBasis; explanation: string } {
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

  if (ability.effectType === 'Ranged Special') {
    /*
     * The shot weave, and the two ceilings are both read off upstream rather than judged here.
     *
     * **The GCD is locked at 1.5s and is not hasted.** wowsims sets `IgnoreHaste: true` on the
     * hunter GCD with that exact comment at the pinned commit, which is why a hasted hunter does not
     * simply press the button more often. The cast time *is* divided by ranged swing speed, so it
     * falls below the GCD as soon as there is any haste and stops being the constraint.
     *
     * **One shot per auto-shot cycle is the other.** Casting delays the next auto shot rather than
     * clipping it — upstream prices exactly that as
     * `max(0, (gcdAt + castTime) - shootAt)` and its rotation avoids paying it — so a second shot
     * inside one cycle buys its damage by pushing a white shot back. That is the 1:1 weave hunters
     * gear for, and this ability's own notes already say so.
     *
     * Whichever is slower wins. **Mana is deliberately not a third ceiling**: `StatBlock` has no
     * mana field, so a cap would have to be invented, and inventing one is what this function
     * exists to refuse. The drain the rate implies is surfaced by the caller instead.
     */
    const weaveCeiling = context.rangedSwingSeconds
    if (!weaveCeiling || weaveCeiling <= 0) {
      return {
        usesPerSecond: 0,
        basis: 'unmodelled',
        explanation: 'nothing is equipped in the ranged slot, so there is no auto shot to weave around',
      }
    }

    const interval = Math.max(weaveCeiling, gcd)
    return {
      usesPerSecond: 1 / interval,
      basis: 'weave',
      explanation:
        weaveCeiling >= gcd
          ? `woven one per auto shot, so one per ${interval.toFixed(2)}s`
          : `capped by the 1.5s hunter global cooldown, which ranged haste does not reduce, rather than by the ${weaveCeiling.toFixed(2)}s auto shot`,
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
  mainHand: WeaponDamageProfile | undefined,
  offHand: WeaponDamageProfile | undefined,
  attackPower: number,
): number {
  const { scaling } = ability
  const normalized = scaling.normalizedWeaponDamage === true
  const weaponMultiplier = scaling.weaponDamageMultiplier ?? 0
  const flatBonus = scaling.flatWeaponDamageBonus ?? 0

  let damage = 0

  if (weaponMultiplier > 0 || flatBonus > 0) {
    const perHand = (weapon: WeaponDamageProfile | undefined, isOffHand: boolean) => {
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
  mainHand: WeaponDamageProfile | undefined,
  offHand: WeaponDamageProfile | undefined,
  attackPower: number,
  context: SpecialUsageContext = {},
): SpecialAttackEstimate {
  const { usesPerSecond, basis, explanation } = computeUsageRate(ability, context)
  return {
    damagePerUse: computeSpecialDamagePerUse(ability, mainHand, offHand, attackPower),
    usesPerSecond,
    basis,
    explanation,
  }
}
