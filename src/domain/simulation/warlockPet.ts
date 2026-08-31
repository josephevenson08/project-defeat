/**
 * The Felguard, and why it is the only demon this model has.
 *
 * **A warlock's demon is either a pet or a damage multiplier, never both.** `sim/warlock/warlock.go`
 * makes the choice explicit:
 *
 *     if warlock.Talents.DemonicSacrifice && warlock.Options.SacrificeSummon {
 *         Succubus -> ShadowDamageDealtMultiplier *= 1.15
 *         Imp      -> FireDamageDealtMultiplier   *= 1.15
 *         Felguard -> ShadowDamageDealtMultiplier *= 1.10
 *     } else {
 *         warlock.Pet = warlock.NewWarlockPet()
 *     }
 *
 * Affliction and Destruction sacrifice — upstream's only preset is a Destruction warlock sacrificing
 * a Succubus — so what they get instead is a **school-scoped damage multiplier**. That was genuinely
 * blocked when this module was written and stopped being so one commit later, when `spellSchool`
 * landed: those two specs now take the multiplier rather than the pet, which is the trade upstream's
 * branch describes rather than a gap.
 *
 * **Demonology is the exception, and it is the spec that needs this.** Summon Felguard is the 41-point
 * Demonology talent — the demon *is* the spec — so a Demonology warlock keeps it, and Demonology is
 * the worst spec in the calibration table at 2.2x. That is the whole scope of this module: one demon,
 * for one spec, chosen because upstream's own branch says the other two do not have one.
 *
 * Every constant is read from wowsims/tbc `sim/warlock/pet.go` at the pinned commit 3301fca5.
 */

/**
 * Felguard base stats, straight out of `PetConfigs`.
 *
 * Only the four that reach damage are here. The block upstream also carries Stamina, Mana, Spirit
 * and MP5, none of which this model has anywhere to put for a pet — the same honest subset the
 * hunter pet takes.
 */
export const FELGUARD_BASE = {
  attackPower: 20,
  strength: 153,
  agility: 108,
} as const

/** 83.4-123.4 on a 2.0s swing, crit multiplier 2. */
export const FELGUARD_WEAPON = { min: 83.4, max: 123.4 } as const
export const FELGUARD_SWING_SECONDS = 2.0

/**
 * The demon's stat conversions, which are its own and not its owner's.
 *
 * **Strength converts at `(strength - 10) * 2`**, and the `- 10` is not a typo — it is the same shape
 * every wowsims pet uses and it is worth carrying rather than rounding away. Agility gives
 * `0.04` crit percent a point, where the hunter pet's is one percent per 33 Agility; two pets, two
 * conversions, and assuming they shared one would have been the easy mistake.
 */
export const FELGUARD_STRENGTH_OFFSET = 10
export const FELGUARD_STRENGTH_TO_ATTACK_POWER = 2
export const FELGUARD_AGILITY_TO_CRIT_PERCENT = 0.04

/**
 * **Attack power comes from the owner's spell power**, which is the one structural difference from
 * the hunter's pet and the reason this could not simply reuse that module.
 *
 * `AttackPower: (ownerStats[SpellPower] + ownerStats[ShadowSpellPower]) * 0.57`. A demon scales off
 * the stat its owner already stacks, so it grows with caster gear rather than needing attack power
 * the warlock never has.
 */
export const FELGUARD_SPELL_POWER_TO_ATTACK_POWER = 0.57

/**
 * **A flat 1.65x on the finished attack power**, and upstream is candid about half of it:
 *
 *     return ap * 1.5 * 1.1 // demonic frenzy + hidden 10% boost
 *
 * The 1.5 is a pre-stacked Demonic Frenzy, which upstream's own comment says it is *simulating*
 * rather than modelling — the real aura stacks from melee hits. The 1.1 is labelled only as a
 * "hidden 10% boost". Both are carried across as read, on the same principle as the hunter pet's
 * unexplained `0.85`: a constant the reference implementation uses is a constant, and substituting
 * this project's reasoning for it would be a silent 65% error in whichever direction the missing
 * rationale points.
 */
export const FELGUARD_ATTACK_POWER_MULTIPLIER = 1.5 * 1.1

/**
 * **There is no family damage multiplier**, and that is worth stating because the hunter pet has one.
 * `PetConfig.DamageMultiplier` and the line that would apply it are both **commented out** upstream,
 * so a demon takes no per-family scaling and needs none of the assumed-family treatment
 * `hunterPet.ts` carries.
 */
export const FELGUARD_HAS_FAMILY_MULTIPLIER = false

/** Named so the estimate can say what it left out rather than reporting a demon that is quietly small. */
export const WARLOCK_PET_UNMODELLED =
  'the demon contributes white damage only. Cleave and Intercept are not modelled, and neither is Demonic Frenzy as a real stacking aura — upstream pre-stacks it as a flat multiplier and this carries that across. Affliction and Destruction get no demon at all here, because the standard build sacrifices it for a school-scoped damage multiplier — which is modelled, so those two specs gain the multiplier instead of the pet rather than losing both.'

export type WarlockPetTalents = {
  /** Multiplies the demon's damage. Soul Link 1.05, Unholy Power +4% a rank, Master Demonologist +1%. */
  damageMultiplier: number
  /** Added to the demon's crit chance, as a fraction. Demonic Tactics, +1% a rank. */
  critChance: number
}

export const noWarlockPetTalents: WarlockPetTalents = { damageMultiplier: 1, critChance: 0 }

export type WarlockPetInput = {
  /** The owner's spell power. The only stat the demon inherits for damage. */
  ownerSpellPower: number
  /** Expected damage multiplier from the demon's own attack table. */
  attackTableMultiplier: number
  armorMitigation: number
  talents?: WarlockPetTalents
}

export type WarlockPetEstimate = {
  attackPower: number
  critChance: number
  dps: number
}

/**
 * Whether a spec **sacrifices** its demon rather than keeping it, which is the same branch upstream
 * writes and therefore the one place this either/or is decided.
 *
 * **Having Demonic Sacrifice is not the same as using it.** Upstream gates the bonus on
 * `DemonicSacrifice && SacrificeSummon` — the talent *and* the choice — so a Demonology warlock who
 * has spent 41 points in the tree owns the talent and still keeps the Felguard, because Summon
 * Felguard is what those points bought.
 *
 * That distinction is not academic: without it a Demonology warlock reads **both** the pet and the
 * +15%, which upstream's `else` makes impossible, and the number looks entirely plausible. A
 * measurement caught it rather than a test, which is the argument for measuring after every change.
 */
export function sacrificesDemon(spec: string): boolean {
  return spec !== 'Demonology'
}

/** The demon's own crit before talents — its base Agility at its own conversion. */
export function felguardCritChance(): number {
  return (FELGUARD_BASE.agility * FELGUARD_AGILITY_TO_CRIT_PERCENT) / 100
}

/** The demon's finished attack power, inherited half included. */
export function felguardAttackPower(ownerSpellPower: number): number {
  const own =
    FELGUARD_BASE.attackPower +
    (FELGUARD_BASE.strength - FELGUARD_STRENGTH_OFFSET) * FELGUARD_STRENGTH_TO_ATTACK_POWER
  const inherited = Math.max(0, ownerSpellPower) * FELGUARD_SPELL_POWER_TO_ATTACK_POWER
  // The 1.65 applies to the finished figure, because upstream registers it as a dependency on the
  // total rather than folding it into either half.
  return (own + inherited) * FELGUARD_ATTACK_POWER_MULTIPLIER
}

/**
 * The Felguard's sustained white damage.
 *
 * Shaped like the hunter pet's — weapon DPS plus attack power over 14, through an attack table, then
 * armour — because a demon swings a weapon like anything else. What differs is the stat it grows on
 * and the absence of a family multiplier, both of which are stated above rather than left implicit.
 */
export function estimateWarlockPet(input: WarlockPetInput): WarlockPetEstimate {
  const talents = input.talents ?? noWarlockPetTalents
  const attackPower = felguardAttackPower(input.ownerSpellPower)

  const weaponDps = (FELGUARD_WEAPON.min + FELGUARD_WEAPON.max) / 2 / FELGUARD_SWING_SECONDS
  // The same 14-attack-power-per-DPS constant every white-damage path here uses.
  const raw = (weaponDps + attackPower / 14) * input.attackTableMultiplier * talents.damageMultiplier

  return {
    attackPower,
    critChance: felguardCritChance() + Math.max(0, talents.critChance),
    dps: Math.max(0, raw) * (1 - input.armorMitigation),
  }
}
