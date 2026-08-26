/**
 * The hunter's pet, as a second attacker.
 *
 * **A pet is not an ability, and that is why it had no home before this.** It is a separate actor
 * with its own attack power, its own crit chance and its own weapon, none of which appear anywhere in
 * `SignatureAbility` — so a spec whose damage is meaningfully a pet's had no way to say so, and every
 * hunter estimate silently described a hunter standing alone.
 *
 * Every constant is read from wowsims/tbc `sim/hunter/pet.go` and `sim/hunter/talents.go` at the
 * pinned commit 3301fca5.
 *
 * **What this models is the pet's white damage only, and the shortfall is stated rather than
 * discovered.** Its focus-costed abilities — Bite, Claw, Gore, Screech — are real damage and are not
 * here: they are limited by a focus economy whose base regeneration rate is passed to
 * `EnableFocusBar` as a *multiplier* rather than a rate, and a number that cannot be read off the
 * source is not one this repo invents. Kill Command is not implemented upstream either. The
 * Beast Mastery talents that scale a pet are likewise absent — see `HUNTER_PET_UNMODELLED`.
 */

/** Base melee weapon: 42-68 damage on a 2.0s swing. */
export const HUNTER_PET_WEAPON_DAMAGE = { min: 42, max: 68 } as const
export const HUNTER_PET_SWING_SECONDS = 2.0

/**
 * The pet's own attack power before anything is inherited.
 *
 * Upstream sets `AttackPower: -20` and `Strength: 162` as base stats, and registers a dependency
 * returning `attackPower + strength*2` — so the pet converts Strength at the same 2-per-point rate a
 * warrior does, and the flat -20 is a real offset rather than a typo.
 */
export const HUNTER_PET_BASE_STRENGTH = 162
export const HUNTER_PET_FLAT_ATTACK_POWER = -20
export const HUNTER_PET_STRENGTH_TO_ATTACK_POWER = 2

/** `stats.AttackPower: ownerStats[stats.RangedAttackPower] * 0.22` — the whole of what a pet inherits for damage. */
export const HUNTER_PET_ATTACK_POWER_INHERITANCE = 0.22

/**
 * Base crit, from `MeleeCrit: (1.1515 + 1.8)` plus 127 Agility at the pet's own conversion of one
 * crit percent per 33 Agility.
 */
export const HUNTER_PET_BASE_AGILITY = 127
export const HUNTER_PET_AGILITY_PER_CRIT_PERCENT = 33
export const HUNTER_PET_FLAT_CRIT_PERCENT = 1.1515 + 1.8

/**
 * A happy pet deals 25% more damage, and a raiding hunter keeps their pet happy.
 *
 * Upstream applies it unconditionally for the same reason: an unhappy pet is a player mistake, not a
 * modelling case. Stated because it is a flat quarter of this number and would look arbitrary
 * otherwise.
 */
export const HUNTER_PET_HAPPINESS_MULTIPLIER = 1.25

/** Named so the estimate can say what it left out, rather than reporting a pet that is quietly too small. */
export const HUNTER_PET_UNMODELLED =
  'the pet contributes white damage only. Its focus-costed abilities (Bite, Claw, Gore, Screech) are not modelled — their rate depends on a focus economy whose base regeneration upstream passes as a multiplier rather than a rate — and neither are the Beast Mastery talents that scale a pet: Unleashed Fury (+4% damage per rank), Serpent’s Swiftness (+4% attack speed per rank), Ferocity (+2% crit per rank), Animal Handler (+2% hit per rank) and Frenzy. Kill Command is not implemented upstream either.'

export type HunterPetInput = {
  /** The hunter's ranged attack power, which is the only stat a pet inherits for damage. */
  ownerRangedAttackPower: number
  /**
   * Expected damage multiplier from the pet's own attack table — hit, crit, glancing — which the
   * caller builds, because the table and its level difference live there.
   */
  attackTableMultiplier: number
  /** Armor mitigation as a fraction. The pet swings a physical weapon and is reduced like any other. */
  armorMitigation: number
}

export type HunterPetEstimate = {
  attackPower: number
  critChance: number
  dps: number
}

/** Base crit as a fraction, before any of the hunter's own crit — a pet inherits none of it. */
export function hunterPetCritChance(): number {
  return (HUNTER_PET_FLAT_CRIT_PERCENT + HUNTER_PET_BASE_AGILITY / HUNTER_PET_AGILITY_PER_CRIT_PERCENT) / 100
}

/**
 * The pet's sustained white damage.
 *
 * Shaped exactly like the player's white-damage model — weapon DPS plus attack power over 14, rolled
 * through an attack table and reduced by armour — because a pet swings a weapon like anything else.
 * The two differences are that its attack power is mostly *not* its own, and that it is always happy.
 */
export function estimateHunterPet(input: HunterPetInput): HunterPetEstimate {
  const { ownerRangedAttackPower, attackTableMultiplier, armorMitigation } = input

  const attackPower =
    HUNTER_PET_FLAT_ATTACK_POWER +
    HUNTER_PET_BASE_STRENGTH * HUNTER_PET_STRENGTH_TO_ATTACK_POWER +
    Math.max(0, ownerRangedAttackPower) * HUNTER_PET_ATTACK_POWER_INHERITANCE

  const weaponDps =
    (HUNTER_PET_WEAPON_DAMAGE.min + HUNTER_PET_WEAPON_DAMAGE.max) / 2 / HUNTER_PET_SWING_SECONDS
  // The same attack-power-to-DPS constant the player's white damage uses: 14 attack power is 1 DPS.
  const fromAttackPower = attackPower / 14

  const raw = (weaponDps + fromAttackPower) * attackTableMultiplier * HUNTER_PET_HAPPINESS_MULTIPLIER

  return {
    attackPower,
    critChance: hunterPetCritChance(),
    dps: Math.max(0, raw) * (1 - armorMitigation),
  }
}
