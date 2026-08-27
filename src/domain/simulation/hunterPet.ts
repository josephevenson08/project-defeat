/**
 * The hunter's pet, as a second attacker.
 *
 * **A pet is not an ability, and that is why it had no home before this.** It is a separate actor
 * with its own attack power, its own crit chance and its own weapon, none of which appear anywhere in
 * `SignatureAbility` — so a spec whose damage is meaningfully a pet's had no way to say so, and every
 * hunter estimate silently described a hunter standing alone.
 *
 * Every constant is read from wowsims/tbc `sim/hunter/pet.go`, `sim/hunter/focus.go` and
 * `sim/hunter/talents.go` at the pinned commit 3301fca5.
 *
 * **What this models is the pet's white damage only, and the shortfall is stated rather than
 * discovered.** Its focus-costed abilities — Bite, Claw, Gore, Screech — are real damage and are not
 * here. The focus economy they spend from *is* now sourced (see `HUNTER_PET_FOCUS_PER_SECOND`), so
 * what remains is the rate model rather than the constants.
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

/**
 * **Two multipliers this model was missing entirely**, both sitting in `pet.go` within ten lines of
 * the happiness bonus that *was* modelled.
 *
 * `HUNTER_PET_MELEE_SPEED_MULTIPLIER` is `PseudoStats.MeleeSpeedMultiplier *= 1.3`, commented
 * upstream only as "Cobra reflexes" and applied unconditionally — not gated on a talent, a family or
 * anything else. It speeds the swing, so it scales the weapon term and the attack-power term
 * together, exactly as the player's own haste multipliers do.
 *
 * `HUNTER_PET_AUTO_ATTACK_MULTIPLIER` is `AutoAttacks.MHEffect.DamageMultiplier *= 0.85`, which
 * upstream applies with **no comment at all**. It is carried across as read rather than reasoned
 * about: a constant nobody can explain is still a constant the reference implementation uses, and
 * dropping it would overstate every pet by 18%.
 *
 * They pull in opposite directions and do not cancel — together with the family multiplier below the
 * net is about **+21%** on a pet's white damage. So the handoff's "the pet is about 6% of a hunter's
 * total where a real one is nearer a third" was measured against a pet that was too small for
 * reasons unrelated to the abilities it is missing.
 */
export const HUNTER_PET_MELEE_SPEED_MULTIPLIER = 1.3
export const HUNTER_PET_AUTO_ATTACK_MULTIPLIER = 0.85

/**
 * The pet family, which upstream reads from a picker this app does not have.
 *
 * `PetConfigs` in `pet.go` gives each family a `DamageMultiplier` spanning **0.91 (Bear) to 1.1**,
 * with the 1.1 tier — Cat, Raptor and Ravager — being the damage families a raiding hunter brings.
 * There is no pet-family input anywhere in this app, so one has to be assumed, and assuming the
 * best-in-slot choice is the assumption every other default here already makes: rank-1 BiS, every
 * buff, a happy pet.
 *
 * **The Cat is named rather than left implicit**, and the estimate says so, because a reader
 * comparing this against their own Bear needs to know the number is not about their pet. Only the
 * default is modelled — shipping all eight rows would be a table nothing reads, which this repo has
 * done three times.
 */
export const HUNTER_PET_DEFAULT_FAMILY = 'Cat'
export const HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER = 1.1

/**
 * The focus economy, sourced at last — and it is in **`sim/hunter/focus.go`, not `sim/core`**, which
 * is the whole reason it stayed unsourced. `sim/core/energy.go` carries the rogue and druid energy
 * constants and no focus ones, so a search of core comes back empty and reads as an absence rather
 * than as looking in the wrong package.
 *
 * `BaseFocusPerTick = 25.0` on a `tickDuration` of 5 seconds is **5 focus per second**, and
 * `MaxFocus = 100`. The multiplier the handoff flagged — `EnableFocusBar(1.0 + 0.5*BestialDiscipline)`
 * — scales that rate rather than replacing it, so Bestial Discipline is +50% focus regen a rank and
 * the base it scales is this number.
 *
 * Exported with nothing spending it yet, because the sourcing was the blocked half: what is left is
 * a rate model on top of numbers that no longer have to be invented.
 */
export const HUNTER_PET_MAX_FOCUS = 100
export const HUNTER_PET_FOCUS_PER_TICK = 25
export const HUNTER_PET_FOCUS_TICK_SECONDS = 5
export const HUNTER_PET_FOCUS_PER_SECOND = HUNTER_PET_FOCUS_PER_TICK / HUNTER_PET_FOCUS_TICK_SECONDS

/** Named so the estimate can say what it left out, rather than reporting a pet that is quietly too small. */
export const HUNTER_PET_UNMODELLED =
  'the pet contributes white damage only. Its focus-costed abilities (Bite, Claw, Gore, Screech) are not modelled — the focus that pays for them is sourced at 5 per second, but the rate a pet spends it at is not — and neither is Frenzy, whose 8-second haste proc needs that same ability rate before it can be priced, nor Kill Command, which fires off the owner’s own crits.'

export type HunterPetTalents = {
  /** Multiplies the pet's damage. Unleashed Fury, +4% a rank. 1 when untalented. */
  damageMultiplier: number
  /** Multiplies the pet's melee speed. Serpent's Swiftness, +4% a rank. 1 when untalented. */
  meleeSpeedMultiplier: number
}

/** The untalented identity, which an empty tree has to reproduce exactly. */
export const noHunterPetTalents: HunterPetTalents = { damageMultiplier: 1, meleeSpeedMultiplier: 1 }

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
  /**
   * The two pet-scaling talents that reach white damage. Optional so a caller with no talents to
   * hand keeps its numbers unchanged — absent is the untalented identity.
   */
  talents?: HunterPetTalents
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
 *
 * **Speed and damage are kept as separate multipliers**, which matters because they enter at
 * different points upstream: `MeleeSpeedMultiplier` changes how often the pet swings, so it scales
 * the weapon term and the attack-power term alike, while the `DamageMultiplier` chain scales what
 * each swing lands for. Collapsing them into one factor gives the same answer today and stops doing
 * so the moment anything reads the swing interval — which the focus abilities will.
 */
export function estimateHunterPet(input: HunterPetInput): HunterPetEstimate {
  const { ownerRangedAttackPower, attackTableMultiplier, armorMitigation } = input
  const talents = input.talents ?? noHunterPetTalents

  const attackPower =
    HUNTER_PET_FLAT_ATTACK_POWER +
    HUNTER_PET_BASE_STRENGTH * HUNTER_PET_STRENGTH_TO_ATTACK_POWER +
    Math.max(0, ownerRangedAttackPower) * HUNTER_PET_ATTACK_POWER_INHERITANCE

  const weaponDps =
    (HUNTER_PET_WEAPON_DAMAGE.min + HUNTER_PET_WEAPON_DAMAGE.max) / 2 / HUNTER_PET_SWING_SECONDS
  // The same attack-power-to-DPS constant the player's white damage uses: 14 attack power is 1 DPS.
  const fromAttackPower = attackPower / 14

  const speed = HUNTER_PET_MELEE_SPEED_MULTIPLIER * talents.meleeSpeedMultiplier
  const damage =
    HUNTER_PET_HAPPINESS_MULTIPLIER *
    HUNTER_PET_AUTO_ATTACK_MULTIPLIER *
    HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER *
    talents.damageMultiplier

  const raw = (weaponDps + fromAttackPower) * attackTableMultiplier * speed * damage

  return {
    attackPower,
    critChance: hunterPetCritChance(),
    dps: Math.max(0, raw) * (1 - armorMitigation),
  }
}
