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
 * **It swings and it presses two buttons.** The auto attack is here, and so are Bite and Claw, paid
 * for out of a focus bar at 5 focus a second. What is not here is stated rather than discovered:
 * Frenzy, Kill Command and Bestial Wrath, each named in `HUNTER_PET_UNMODELLED` with the reason.
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

/**
 * The pet's global cooldown, which **ranged haste does not reduce** — the same finding Steady Shot
 * turned on, one actor over. Every pet ability sets `IgnoreHaste: true` on a `GCDDefault` cast, so
 * the pet acts at most once every 1.5 seconds no matter how fast it swings.
 */
export const HUNTER_PET_GCD_SECONDS = 1.5

/**
 * The two abilities a Cat presses, from `sim/hunter/pet_abilities.go`.
 *
 * **They are flat rolls with no attack power scaling at all** — `BaseDamageConfigRoll(108, 132)`,
 * not the `BaseDamageConfigMeleeWeapon` that Kill Command uses. That is the fact that decides what
 * this is worth: the pet's *white* damage grows with the owner's ranged attack power and these do not,
 * so gear moves one half of the pet and leaves the other exactly where it was.
 *
 * **What does move them is Bestial Discipline, and it is much the larger effect** — a mistake worth
 * recording, because the obvious reading is backwards. Gear alone takes the abilities from 17.5% of
 * the pet to 15.1%; doubling focus income takes them to 27.8%. A test compared a naked untalented
 * hunter against a best-case one, expected the share to fall, and caught the conflation.
 *
 * `PetConfigs` gives the Cat `Bite` as primary and `Claw` as secondary, and upstream's `OnGCDReady`
 * tries the primary first and falls through to the secondary — which is a priority order, so it is
 * modelled as one.
 *
 * **Only the Cat's two are here.** Gore (35298, 25 focus, 37-61 with a 50% chance to double) and
 * Screech (27051, 20 focus, 33-61) belong to families this app does not model, and Lightning Breath
 * (25011, 50 focus, 80-93 plus a 0.05 spell power coefficient) is Nature damage on the spell table.
 * Shipping all five would be four rows nothing reads, which this repo has done three times; their
 * constants are recorded here instead so the next family is a lookup rather than another fetch.
 */
export type HunterPetAbility = {
  name: string
  spellId: number
  focusCost: number
  damage: { min: number; max: number }
  /** Seconds between uses, when the ability has a cooldown at all. Claw has none. */
  cooldownSeconds?: number
}

export const HUNTER_PET_BITE: HunterPetAbility = {
  name: 'Bite',
  spellId: 27050,
  focusCost: 35,
  damage: { min: 108, max: 132 },
  cooldownSeconds: 10,
}

export const HUNTER_PET_CLAW: HunterPetAbility = {
  name: 'Claw',
  spellId: 27049,
  focusCost: 25,
  damage: { min: 54, max: 76 },
}

/** In `PetConfigs` order: primary first, secondary second, which is the order `OnGCDReady` tries them. */
export const HUNTER_PET_ABILITIES: readonly HunterPetAbility[] = [HUNTER_PET_BITE, HUNTER_PET_CLAW]

/** Named so the estimate can say what it left out, rather than reporting a pet that is quietly too small. */
export const HUNTER_PET_UNMODELLED =
  'the pet presses Bite and Claw out of its focus bar but nothing else. Those two are flat rolls that do not scale with attack power, so gear moves the pet’s auto attack and leaves them exactly where they are. Not modelled: Frenzy, a 30% haste aura procced by the pet’s own crits; Kill Command, which fires off the owner’s crits; and Bestial Wrath, which needs a cooldown usage policy.'

export type HunterPetTalents = {
  /** Multiplies the pet's damage. Unleashed Fury, +4% a rank. 1 when untalented. */
  damageMultiplier: number
  /** Multiplies the pet's melee speed. Serpent's Swiftness, +4% a rank. 1 when untalented. */
  meleeSpeedMultiplier: number
  /** Multiplies focus regeneration. Bestial Discipline, +50% a rank. 1 when untalented. */
  focusRegenMultiplier: number
}

/** The untalented identity, which an empty tree has to reproduce exactly. */
export const noHunterPetTalents: HunterPetTalents = {
  damageMultiplier: 1,
  meleeSpeedMultiplier: 1,
  focusRegenMultiplier: 1,
}

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
   * Expected damage multiplier from the pet's **special**-attack table, which is a different table:
   * an ability cannot glance, so the caller builds it separately rather than reusing the white one.
   * Optional, because a caller that does not supply it gets white damage and no abilities — which is
   * what every caller got before the abilities existed.
   */
  specialAttackTableMultiplier?: number
  /**
   * The pet-scaling talents. Optional so a caller with no talents to hand keeps its numbers
   * unchanged — absent is the untalented identity.
   */
  talents?: HunterPetTalents
}

export type HunterPetAbilityEstimate = {
  name: string
  /** Uses per second, after the focus budget, the shared GCD and the ability's own cooldown. */
  usesPerSecond: number
  /** Focus spent per second on this ability alone. */
  focusPerSecond: number
  dps: number
}

export type HunterPetEstimate = {
  attackPower: number
  critChance: number
  /** Auto-attack damage alone, which is the only part that scales with the owner's gear. */
  whiteDps: number
  /** Every focus-costed ability, itemised, so the damage table can show them individually. */
  abilities: readonly HunterPetAbilityEstimate[]
  abilityDps: number
  /** Focus income after Bestial Discipline, reported because the ability rate is derived from it. */
  focusPerSecond: number
  /** White plus abilities. What the caller adds to the hunter's total. */
  dps: number
}

/** Base crit as a fraction, before any of the hunter's own crit — a pet inherits none of it. */
export function hunterPetCritChance(): number {
  return (HUNTER_PET_FLAT_CRIT_PERCENT + HUNTER_PET_BASE_AGILITY / HUNTER_PET_AGILITY_PER_CRIT_PERCENT) / 100
}

/**
 * How often the pet uses each ability, spending a shared focus budget in priority order.
 *
 * **Three ceilings, and which one binds is the interesting part.** An ability is limited by its own
 * cooldown, by the pet's 1.5s global cooldown, and by focus. At the base 5 focus a second, against
 * costs of 25 and 35, **focus binds by a wide margin** — the two abilities together come to about
 * 0.16 uses a second where the GCD would allow 0.67. That is why Bestial Discipline is worth having
 * and why the GCD ceiling almost never shows up in the answer; it is still applied, because a future
 * family with cheaper abilities would run into it.
 *
 * **The budget is spent greedily, in `PetConfigs` order**, matching upstream's `OnGCDReady`: it
 * tries the primary and falls through to the secondary only when the primary is unaffordable or on
 * cooldown. So Bite takes what its 10s cooldown allows and Claw divides the remainder. This is the
 * same greedy shape `resolveRotation` uses for the player, and it carries the same warning: a
 * second ability spending the same resource **moves** damage rather than adding it, and only pays
 * off if it returns more per point. Here it does not — Bite returns 3.4 damage per focus against
 * Claw's 2.6 — which is exactly why upstream lists Bite first.
 *
 * **What this does not model is the starvation.** On a real timeline Claw can spend the pet below
 * 35 focus just as Bite comes off cooldown, delaying it; the closed form lets Bite take its full
 * cooldown rate first. That overstates Bite slightly and understates Claw by the same focus, and
 * since Bite is the better use of a focus point the net is a small overstatement. It is named here
 * rather than discovered later.
 */
export function hunterPetAbilityRates(
  focusPerSecond: number,
  abilities: readonly HunterPetAbility[] = HUNTER_PET_ABILITIES,
): { ability: HunterPetAbility; usesPerSecond: number }[] {
  let remainingFocus = Math.max(0, focusPerSecond)
  let remainingGcd = 1 / HUNTER_PET_GCD_SECONDS

  return abilities.map((ability) => {
    const fromCooldown = ability.cooldownSeconds ? 1 / ability.cooldownSeconds : Number.POSITIVE_INFINITY
    const fromFocus = ability.focusCost > 0 ? remainingFocus / ability.focusCost : Number.POSITIVE_INFINITY
    const usesPerSecond = Math.max(0, Math.min(fromCooldown, fromFocus, remainingGcd))

    remainingFocus -= usesPerSecond * ability.focusCost
    remainingGcd -= usesPerSecond

    return { ability, usesPerSecond }
  })
}

/**
 * The pet's sustained damage: auto attacks, plus whatever its focus pays for.
 *
 * The white half is shaped exactly like the player's — weapon DPS plus attack power over 14, rolled
 * through an attack table and reduced by armour — because a pet swings a weapon like anything else.
 * The two differences are that its attack power is mostly *not* its own, and that it is always happy.
 *
 * **Speed and damage are kept as separate multipliers**, which matters because they enter at
 * different points upstream: `MeleeSpeedMultiplier` changes how often the pet swings, so it scales
 * the weapon term and the attack-power term alike, while the `DamageMultiplier` chain scales what
 * each swing lands for.
 *
 * **And two of those damage multipliers are auto-attack-only, which is the trap in this function.**
 * Upstream writes happiness as `PseudoStats.DamageDealtMultiplier` — unit-wide, so it reaches
 * everything — but the family multiplier and the unexplained `0.85` as
 * `AutoAttacks.MHEffect.DamageMultiplier`, which is the auto attack alone. Every pet ability carries
 * `DamageMultiplier: 1`, and Kill Command re-applies the family multiplier **explicitly**, which is
 * the proof that it is not inherited. Handing the abilities the white chain would overstate them by
 * about 6% at the modelled family and silently more at another.
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
  // Reaches everything the pet does: happiness is unit-wide upstream, and so is Unleashed Fury.
  const unitDamage = HUNTER_PET_HAPPINESS_MULTIPLIER * talents.damageMultiplier
  // The auto attack alone. See the note above for why these two do not reach the abilities.
  const whiteOnlyDamage = HUNTER_PET_AUTO_ATTACK_MULTIPLIER * HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER

  const whiteRaw = (weaponDps + fromAttackPower) * attackTableMultiplier * speed * unitDamage * whiteOnlyDamage
  const whiteDps = Math.max(0, whiteRaw) * (1 - armorMitigation)

  const focusPerSecond = HUNTER_PET_FOCUS_PER_SECOND * talents.focusRegenMultiplier

  /*
   * No special table means no abilities, and that is a deliberate default rather than a zero: every
   * caller that predates the abilities keeps the number it had, so adding this cannot silently move
   * a surface nobody has looked at.
   */
  const abilities: HunterPetAbilityEstimate[] =
    input.specialAttackTableMultiplier === undefined
      ? []
      : hunterPetAbilityRates(focusPerSecond).map(({ ability, usesPerSecond }) => {
          const averageDamage = (ability.damage.min + ability.damage.max) / 2
          const raw = usesPerSecond * averageDamage * input.specialAttackTableMultiplier! * unitDamage
          return {
            name: ability.name,
            usesPerSecond,
            focusPerSecond: usesPerSecond * ability.focusCost,
            dps: Math.max(0, raw) * (1 - armorMitigation),
          }
        })

  const abilityDps = abilities.reduce((sum, entry) => sum + entry.dps, 0)

  return {
    attackPower,
    critChance: hunterPetCritChance(),
    whiteDps,
    abilities,
    abilityDps,
    focusPerSecond,
    dps: whiteDps + abilityDps,
  }
}
