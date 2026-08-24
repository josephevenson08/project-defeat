import type { Faction } from '../character/characterTypes'

/**
 * Retribution's Holy damage — the seal riding on every swing, and the judgement on its cooldown.
 *
 * **This is where a Retribution paladin's damage actually is**, and the spec's own ability notes have
 * said so for as long as they have existed: "Retribution's actual damage is dominated by auto attacks
 * with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on
 * cooldown". The model counted none of it, and called Ret "the physical spec where the special-attack
 * share of damage is smallest" without noticing that the missing share was not special-attack damage
 * at all.
 *
 * **None of it fits `SignatureAbility`, and that is not a schema gap.** A seal is a 30-second
 * self-buff whose damage rides passively on white hits; a judgement is unleashed *from* the seal. The
 * repo's notes concluded these "do not fit this schema at all" and stopped there. True — and the
 * simulator is not the schema, so they live here instead, in the same shape `weaponImbues.ts` uses.
 *
 * **All of it is Holy, so armor does not touch it.** That is the first unmitigated damage in the
 * physical path, and the reason this module reports its own total rather than folding into `rawDps`.
 *
 * **It is faction-split, and the split is enormous.** Seal of Blood is a Blood Elf spell — Horde
 * only, in Phase 2, before 2.4 gave Alliance the identical Seal of the Martyr. Judgement of Blood
 * deals **295-325**; Judgement of Command deals **68-73**. That is not a rounding difference, it is
 * the reason Horde Retribution was ahead for the whole of early TBC, and modelling one for both
 * factions would have been wrong by a factor of four on that component alone.
 *
 * Sources: tooltips for spells 20271 (the Judgement button), 31892/31898 (Seal and Judgement of
 * Blood) and 20375 (Seal of Command, whose tooltip carries its own judgement numbers), read the same
 * way `ingest-buff-scope.mjs` reads them; cross-checked against wowsims/tbc `sim/paladin/seals.go`
 * and `sim/paladin/judgement.go` at 3301fca5 where upstream implements them.
 */

/** "All melee attacks deal additional Holy damage equal to 35% of normal weapon damage" — spell 31892. */
export const SEAL_OF_BLOOD_WEAPON_FRACTION = 0.35

/** "a chance to deal additional Holy damage equal to 70% of normal weapon damage" — spell 20375. */
export const SEAL_OF_COMMAND_WEAPON_FRACTION = 0.7

/** wowsims: 7.0 procs per minute with a 1-second internal cooldown, on melee white hits. */
export const SEAL_OF_COMMAND_PROCS_PER_MINUTE = 7
export const SEAL_OF_COMMAND_INTERNAL_COOLDOWN_SECONDS = 1

/** The Judgement button itself: "10 sec cooldown" on spell 20271, shared by whichever seal is up. */
export const JUDGEMENT_COOLDOWN_SECONDS = 10

/** Spell 31898: "instantly causing 295 to 325 Holy damage". wowsims adds a 0.429 spell-power coefficient. */
export const JUDGEMENT_OF_BLOOD_DAMAGE = { min: 295, max: 325 } as const
export const JUDGEMENT_OF_BLOOD_SPELL_POWER_COEFFICIENT = 0.429

/**
 * Spell 20375: "instantly causing 68 to 73 Holy damage, 137 to 146 if the target is stunned or
 * incapacitated". A raid boss is neither, so the lower figure is the one that applies.
 *
 * No spell-power coefficient is applied. Upstream does not implement this judgement at all at the
 * pinned commit, so unlike the Blood one there is no second source to take a coefficient from, and
 * inventing one is what this repo keeps correcting.
 */
export const JUDGEMENT_OF_COMMAND_DAMAGE = { min: 68, max: 73 } as const

/** A crit doubles a Holy hit, the same as a physical one. */
const HOLY_CRIT_DAMAGE_MULTIPLIER = 2

export type PaladinHolyInput = {
  faction: Faction
  /** Main-hand swings per second, after haste. Retribution swings a two-hander, so there is no off hand. */
  mainHandSwingsPerSecond: number
  /**
   * Fraction of those swings that land. Both seals trigger from a white hit that connected, so a
   * miss, dodge or parry carries no Holy damage with it either.
   */
  landedFraction: number
  /** Average main-hand swing damage before armor, which is what both seals take their fraction of. */
  mainHandSwingDamage: number
  spellPower: number
  /** Melee crit chance as a fraction, after suppression — the triggered Holy hit rolls on it. */
  critChance: number
}

export type PaladinHolyEstimate = {
  sealName: string
  sealDps: number
  judgementName: string
  judgementDps: number
  /** Everything in this estimate is Holy, so the caller must not apply armor mitigation to it. */
  totalDps: number
}

/**
 * Seal of Command's proc rate.
 *
 * A procs-per-minute figure is already normalised for weapon speed — chance per swing is
 * `PPM * speed / 60`, so the rate per second is `PPM / 60` whatever is equipped. Multiplying by the
 * swing rate as well is the easy way to get this wrong, and would hand a fast weapon a rate it does
 * not have.
 */
function sealOfCommandProcsPerSecond(landedFraction: number): number {
  const fromPpm = (SEAL_OF_COMMAND_PROCS_PER_MINUTE / 60) * Math.max(0, landedFraction)
  const fromCooldown = 1 / SEAL_OF_COMMAND_INTERNAL_COOLDOWN_SECONDS
  return Math.min(fromPpm, fromCooldown)
}

/**
 * Sustained Holy damage from the active seal and its judgement.
 *
 * The two seals are shaped differently on purpose, because the game shapes them differently: Seal of
 * Blood fires on **every** landed white hit, while Seal of Command is a **7 PPM proc**. A procs-per-
 * minute rate is already normalised for weapon speed — chance per swing is `PPM * speed / 60`, so the
 * rate per second is `PPM / 60` regardless of what is equipped, which is the entire point of the unit
 * and the easy thing to get wrong by multiplying by speed a second time.
 */
export function estimatePaladinHolyDamage(input: PaladinHolyInput): PaladinHolyEstimate {
  const { faction, mainHandSwingsPerSecond, landedFraction, mainHandSwingDamage, spellPower, critChance } = input

  const critMultiplier = 1 + critChance * (HOLY_CRIT_DAMAGE_MULTIPLIER - 1)
  const landedSwingsPerSecond = Math.max(0, mainHandSwingsPerSecond) * Math.max(0, landedFraction)
  const swingDamage = Math.max(0, mainHandSwingDamage)

  const horde = faction === 'Horde'

  const sealDps = horde
    ? // Every landed swing, no proc chance and no cooldown — which is why it outruns Seal of Command
      // even before the judgement is counted.
      landedSwingsPerSecond * swingDamage * SEAL_OF_BLOOD_WEAPON_FRACTION * critMultiplier
    : sealOfCommandProcsPerSecond(landedFraction) * swingDamage * SEAL_OF_COMMAND_WEAPON_FRACTION * critMultiplier

  const judgementsPerSecond = 1 / JUDGEMENT_COOLDOWN_SECONDS
  const judgementDamage = horde
    ? (JUDGEMENT_OF_BLOOD_DAMAGE.min + JUDGEMENT_OF_BLOOD_DAMAGE.max) / 2 +
      spellPower * JUDGEMENT_OF_BLOOD_SPELL_POWER_COEFFICIENT
    : (JUDGEMENT_OF_COMMAND_DAMAGE.min + JUDGEMENT_OF_COMMAND_DAMAGE.max) / 2

  const judgementDps = judgementsPerSecond * judgementDamage * critMultiplier

  return {
    sealName: horde ? 'Seal of Blood' : 'Seal of Command',
    sealDps,
    judgementName: horde ? 'Judgement of Blood' : 'Judgement of Command',
    judgementDps,
    totalDps: sealDps + judgementDps,
  }
}
