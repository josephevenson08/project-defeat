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
 * **It swings and it presses three buttons.** The auto attack is here, sped by Frenzy; so are Bite
 * and Claw, paid for out of a focus bar at 5 focus a second; and so is Kill Command, which the owner
 * casts and the pet lands. What is not here is stated rather than discovered: Bestial Wrath and the
 * per-spell half of Focused Fire, both named in `HUNTER_PET_UNMODELLED` with the reason.
 *
 * **Three gates, and they point at different actors** — which is the thing to hold on to when
 * reading this file. Bite and Claw are gated on the pet's **focus**; Kill Command on the **owner's**
 * crits; Frenzy on the **pet's** crits. Kill Command is therefore priced before the pet's auto
 * attack, because Frenzy counts its crits, and it in turn is priced after the rotation, because a
 * hunter's crits come from Steady Shot as well as the auto shot. One order, no cycle.
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

/**
 * What the estimate says the pet is doing, built from what it **actually did** rather than from one
 * fixed sentence.
 *
 * The static version claimed the pet "presses Bite and Claw, and Kill Command off the owner's crits,
 * with Frenzy speeding its swings" on **every** hunter — including one with no ranged weapon, who
 * fires no shots, lands no crits and so gets no Kill Command at all, and an untalented one with no
 * Frenzy. Wrong in the confident direction, on the one surface whose job is being read.
 *
 * A browser pass found it and the tests could not have: every number was right and only the prose
 * was lying. That is the argument for driving the app rather than reading the diff.
 */
export function hunterPetUnmodelled(options: { killCommand: boolean; frenzy: boolean }): string {
  const pressing = ['Bite and Claw out of its focus bar']
  if (options.killCommand) pressing.push('Kill Command off the owner’s crits')

  const missing = ['Bestial Wrath, which needs a cooldown usage policy']
  if (!options.killCommand) missing.push('Kill Command, which needs the owner to be critting before it fires at all')
  if (!options.frenzy) missing.push('Frenzy, which this build has not talented')
  missing.push('the half of Focused Fire that adds 10% crit a rank to Kill Command specifically')

  return (
    `the pet presses ${pressing.join(', and ')}.` +
    (options.frenzy ? ' Frenzy is speeding its swings.' : '') +
    ' Bite and Claw are flat rolls that do not scale with attack power, so gear moves the pet’s' +
    ` auto attack and leaves them exactly where they are. Not modelled: ${missing.join('; ')}.`
  )
}

/**
 * Kill Command, which is two spells and one attack.
 *
 * **The hunter casts it and the pet lands it.** `sim/hunter/kill_command.go` registers 34026 on the
 * owner — 75 mana, a 5s cooldown — whose only effect is to fire the pet's 34027. So it costs the pet
 * no focus, takes none of the pet's global cooldown, and does not compete with Bite and Claw for
 * anything. It is a free extra pet attack bought with the owner's mana.
 *
 * **It scales, and that is what makes it worth more than the focus abilities.**
 * `BaseDamageConfigMeleeWeapon(core.MainHand, false, 127, 1, true)` is a real weapon swing plus a flat
 * 127 — not the `BaseDamageConfigRoll` that leaves Bite and Claw fixed — so it follows the owner's
 * ranged attack power through the pet's 22% inheritance.
 *
 * **It also takes the family multiplier**, explicitly, which is the line that proves the multiplier
 * is not inherited by abilities that do not ask for it: `DamageMultiplier: hp.config.DamageMultiplier`
 * appears here and nowhere in `pet_abilities.go`. It does not take the auto-attack `0.85`.
 *
 * **Focused Fire is not applied.** Upstream gives this spell `BonusCritRating` of 10% a rank, and the
 * talent has no ingested effect here, so the crit figure is the pet's own. Named because it is a real
 * understatement rather than an absence.
 */
export const HUNTER_PET_KILL_COMMAND = {
  name: 'Kill Command',
  ownerSpellId: 34026,
  petSpellId: 34027,
  ownerManaCost: 75,
  cooldownSeconds: 5,
  /** Added to the pet's weapon swing, before any multiplier. */
  flatBonusDamage: 127,
} as const

/**
 * How often Kill Command actually lands, which is **not** once per cooldown.
 *
 * Upstream gates it twice: a 5s cooldown, and an enable window that only an **owner crit** opens and
 * that lasts 5 seconds. `applyKillCommand` sets `killCommandEnabledUntil` on any owner crit and calls
 * `TryKillCommand` in the same breath, so the spell fires on the first crit after the cooldown comes
 * up rather than the instant it does.
 *
 * Treating owner crits as a Poisson process at rate `λ`, the cycle is the cooldown plus the expected
 * wait for the next crit — `5 + 1/λ` — so the rate is `1 / (5 + 1/λ)`. That degrades correctly at
 * both ends: a hunter critting constantly approaches one per cooldown, and a hunter who never crits
 * gets none at all, which is exactly the upstream gate.
 *
 * **This is where the closed form is weakest and it is worth saying so.** Real crits are not Poisson
 * — auto shots land on a timer — so the wait after the cooldown is less variable than this assumes.
 * The direction is understating, since a regular arrival process waits less on average than an
 * exponential one with the same rate, which is the honest direction for this model.
 *
 * **Mana is deliberately not a third gate**, matching Steady Shot: `StatBlock` has no mana field, so
 * a cap would mean inventing the income. The drain is reported instead.
 */
export function killCommandUsesPerSecond(ownerCritsPerSecond: number): number {
  if (ownerCritsPerSecond <= 0) return 0
  return 1 / (HUNTER_PET_KILL_COMMAND.cooldownSeconds + 1 / ownerCritsPerSecond)
}

export type HunterPetKillCommandInput = {
  /** The pet's finished attack power, which is what its weapon swing scales on. */
  petAttackPower: number
  /** Expected multiplier from the pet's special-attack table. Kill Command rolls as a melee special. */
  specialAttackTableMultiplier: number
  /** Owner crits per second, which is the gate rather than the cooldown. */
  ownerCritsPerSecond: number
  armorMitigation: number
  talents?: HunterPetTalents
}

export type HunterPetKillCommandEstimate = {
  usesPerSecond: number
  damagePerUse: number
  ownerManaPerSecond: number
  dps: number
}

/** The pet's Kill Command hit, priced per use and per second. */
export function estimateHunterPetKillCommand(input: HunterPetKillCommandInput): HunterPetKillCommandEstimate {
  const talents = input.talents ?? noHunterPetTalents
  const usesPerSecond = killCommandUsesPerSecond(input.ownerCritsPerSecond)

  /*
   * A non-normalised weapon swing: the damage roll plus attack power over 14 scaled by the weapon's
   * own speed, which is the same formula the pet's white damage uses per swing rather than per
   * second. Written out rather than reusing the DPS figure, because this is one hit and not a rate.
   */
  const averageRoll = (HUNTER_PET_WEAPON_DAMAGE.min + HUNTER_PET_WEAPON_DAMAGE.max) / 2
  const fromAttackPower = (Math.max(0, input.petAttackPower) / 14) * HUNTER_PET_SWING_SECONDS
  const damagePerUse = averageRoll + fromAttackPower + HUNTER_PET_KILL_COMMAND.flatBonusDamage

  // Happiness and Unleashed Fury are unit-wide; the family multiplier is applied here because
  // upstream applies it here. The auto-attack 0.85 is not, because this is not an auto attack.
  const multiplier =
    HUNTER_PET_HAPPINESS_MULTIPLIER * talents.damageMultiplier * HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER

  const raw = usesPerSecond * damagePerUse * input.specialAttackTableMultiplier * multiplier

  return {
    usesPerSecond,
    damagePerUse,
    ownerManaPerSecond: usesPerSecond * HUNTER_PET_KILL_COMMAND.ownerManaCost,
    dps: Math.max(0, raw) * (1 - input.armorMitigation),
  }
}

/**
 * Frenzy, which is a refreshing aura rather than a consumed stack — and that is why it is not Flurry.
 *
 * On any **pet** crit, at 20% a rank, the pet gains 30% melee speed for 8 seconds. Upstream registers
 * both auras on `hunter.pet`, so the owner's crits do nothing here; that is the opposite gate from
 * Kill Command, which is triggered by the *owner's* crits, and the two sit five lines apart in the
 * source.
 *
 * **It reaches the auto attack and nothing else.** The aura is `MeleeSpeedMultiplier`, and every pet
 * ability is `IgnoreHaste: true` on its cast while Kill Command has no cast at all — so a faster pet
 * swings more and presses its buttons exactly as often. Bite and Claw are focus-bound, not
 * speed-bound.
 *
 * ### Why the closed form differs from `flurrySpeedMultiplier`
 *
 * Flurry is three stacks that a white hit *consumes*, so its uptime is a Markov chain over the stack
 * count. Frenzy is a fixed 8-second duration that any proc *refreshes*, and nothing consumes it. So
 * the question is not "how many stacks remain" but "was there a proc in the last 8 seconds", and for
 * a Poisson process of rate `λ` that is
 *
 *     uptime = 1 - exp(-λ · 8)
 *
 * The multiplier is time-weighted, which for a duration aura is simply `1 + 0.3 · uptime`: the pet
 * spends `uptime` of the fight swinging 30% faster. Flurry needs the extra step of weighting by how
 * long each swing occupies; a duration aura does not, because the clock runs the same either way.
 *
 * ### The fixed point, and why it is iterated rather than solved
 *
 * `λ` counts the pet's crits, and the pet's crits come partly from auto attacks, whose rate Frenzy
 * itself raises. Faster swings mean more crits mean more uptime mean faster swings. Substituting
 * gives a transcendental equation, so it is iterated instead — it converges to four decimal places in
 * three passes, which is the same treatment `SIMULATION-ARCHITECTURE.md` recommends for the Rogue
 * energy loop.
 *
 * **Ability crits are counted and do not compound.** Bite, Claw and Kill Command all crit and all
 * proc Frenzy, but none of their rates depend on melee speed, so they enter `λ` as a constant.
 */
export const HUNTER_PET_FRENZY_HASTE = 1.3
export const HUNTER_PET_FRENZY_DURATION_SECONDS = 8
export const HUNTER_PET_FRENZY_PROC_CHANCE_PER_RANK = 0.2

export type FrenzyInput = {
  /** Proc chance per pet crit, as a fraction. 0.2 a rank, so rank 5 is certain. */
  procChance: number
  /** The pet's crit chance after suppression — its own, since a pet inherits none of the owner's. */
  petCritChance: number
  /** Auto attacks per second **before** Frenzy. The term the fixed point iterates on. */
  baseSwingsPerSecond: number
  /** Bite, Claw and Kill Command together. They crit and proc Frenzy, and their rates are fixed. */
  abilityUsesPerSecond: number
}

/**
 * Frenzy's expected melee-speed multiplier, in closed form. 1 when untalented.
 *
 * Deliberately a **lower bound**, like `flurrySpeedMultiplier` before it: a real proc stream from
 * regular auto attacks is less variable than a Poisson one, and a less variable arrival process
 * spends less time with a stale aura. Understating is the honest direction for a number that exists
 * to correct an already-understated figure.
 */
export function frenzySpeedMultiplier(input: FrenzyInput): number {
  const { procChance, petCritChance, baseSwingsPerSecond, abilityUsesPerSecond } = input
  if (procChance <= 0 || petCritChance <= 0) return 1

  const bonus = HUNTER_PET_FRENZY_HASTE - 1
  let multiplier = 1

  // Three passes: the third moves the answer by less than 1e-4 at every rate this model produces.
  for (let pass = 0; pass < 3; pass += 1) {
    const attacksPerSecond = Math.max(0, baseSwingsPerSecond) * multiplier + Math.max(0, abilityUsesPerSecond)
    const procsPerSecond = attacksPerSecond * Math.min(1, petCritChance) * Math.min(1, procChance)
    const uptime = 1 - Math.exp(-procsPerSecond * HUNTER_PET_FRENZY_DURATION_SECONDS)
    multiplier = 1 + bonus * uptime
  }

  return multiplier
}

export type HunterPetTalents = {
  /** Multiplies the pet's damage. Unleashed Fury, +4% a rank. 1 when untalented. */
  damageMultiplier: number
  /** Multiplies the pet's melee speed. Serpent's Swiftness, +4% a rank. 1 when untalented. */
  meleeSpeedMultiplier: number
  /** Multiplies focus regeneration. Bestial Discipline, +50% a rank. 1 when untalented. */
  focusRegenMultiplier: number
  /** Chance a pet crit procs Frenzy, as a fraction. 0.2 a rank. 0 when untalented. */
  frenzyProcChance: number
}

/** The untalented identity, which an empty tree has to reproduce exactly. */
export const noHunterPetTalents: HunterPetTalents = {
  damageMultiplier: 1,
  meleeSpeedMultiplier: 1,
  focusRegenMultiplier: 1,
  frenzyProcChance: 0,
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
   * The pet's crit chance after suppression, which Frenzy's proc rate is derived from. Optional for
   * the same reason as the special table: a caller that does not supply it gets no Frenzy.
   */
  petCritChance?: number
  /**
   * Kill Command's uses per second, if it is modelled. It crits and procs Frenzy like anything else
   * the pet does, but it is priced **before** this call — its own rate depends on the *owner's* crit
   * rate, which comes from the rotation — so it arrives as a number rather than being derived here.
   */
  killCommandUsesPerSecond?: number
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
  /** Frenzy's expected melee-speed multiplier. 1 when untalented, and it reaches the auto attack only. */
  frenzyMultiplier: number
  /** White plus abilities. What the caller adds to the hunter's total. */
  dps: number
}

/**
 * The pet's finished attack power, which both the auto attack and Kill Command scale on.
 *
 * Extracted so the two cannot disagree. Kill Command is priced before the pet estimate — Frenzy's
 * proc rate counts Kill Command's crits, so it has to know that rate first — and deriving attack
 * power twice across that ordering is exactly how two call sites end up out of step.
 */
export function hunterPetAttackPower(ownerRangedAttackPower: number): number {
  return (
    HUNTER_PET_FLAT_ATTACK_POWER +
    HUNTER_PET_BASE_STRENGTH * HUNTER_PET_STRENGTH_TO_ATTACK_POWER +
    Math.max(0, ownerRangedAttackPower) * HUNTER_PET_ATTACK_POWER_INHERITANCE
  )
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

  const attackPower = hunterPetAttackPower(ownerRangedAttackPower)

  const weaponDps =
    (HUNTER_PET_WEAPON_DAMAGE.min + HUNTER_PET_WEAPON_DAMAGE.max) / 2 / HUNTER_PET_SWING_SECONDS
  // The same attack-power-to-DPS constant the player's white damage uses: 14 attack power is 1 DPS.
  const fromAttackPower = attackPower / 14

  const baseSpeed = HUNTER_PET_MELEE_SPEED_MULTIPLIER * talents.meleeSpeedMultiplier
  // Reaches everything the pet does: happiness is unit-wide upstream, and so is Unleashed Fury.
  const unitDamage = HUNTER_PET_HAPPINESS_MULTIPLIER * talents.damageMultiplier
  // The auto attack alone. See the note above for why these two do not reach the abilities.
  const whiteOnlyDamage = HUNTER_PET_AUTO_ATTACK_MULTIPLIER * HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER

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

  /*
   * **Frenzy, which reaches the auto attack and nothing else.** The aura is `MeleeSpeedMultiplier`,
   * every pet ability is `IgnoreHaste: true`, and Kill Command has no cast at all — so a frenzied pet
   * swings more often and presses its buttons exactly as often. Bite and Claw are focus-bound.
   *
   * Its own proc rate counts every pet attack, abilities included, which is why this sits after the
   * ability rates are known rather than beside the swing speed it modifies.
   */
  const baseSwingsPerSecond = baseSpeed / HUNTER_PET_SWING_SECONDS
  const frenzyMultiplier =
    input.petCritChance === undefined
      ? 1
      : frenzySpeedMultiplier({
          procChance: talents.frenzyProcChance,
          petCritChance: input.petCritChance,
          baseSwingsPerSecond,
          abilityUsesPerSecond:
            abilities.reduce((sum, entry) => sum + entry.usesPerSecond, 0) + (input.killCommandUsesPerSecond ?? 0),
        })

  const whiteRaw =
    (weaponDps + fromAttackPower) * attackTableMultiplier * baseSpeed * frenzyMultiplier * unitDamage * whiteOnlyDamage
  const whiteDps = Math.max(0, whiteRaw) * (1 - armorMitigation)

  return {
    attackPower,
    critChance: hunterPetCritChance(),
    whiteDps,
    abilities,
    abilityDps,
    focusPerSecond,
    frenzyMultiplier,
    dps: whiteDps + abilityDps,
  }
}
