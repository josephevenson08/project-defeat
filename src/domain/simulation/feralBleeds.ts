/**
 * Rake and Rip, the two bleeds that make a Feral druid — and the reason it has been the worst spec in
 * this model at 2.3x.
 *
 * **Bleeds ignore armor, and upstream says so in a comment rather than leaving it to be inferred.**
 * `sim/core/spell_resistances.go`:
 *
 *     if spell.SpellSchool.Matches(SpellSchoolPhysical) {
 *         // All physical dots (Bleeds) ignore armor.
 *         if spellEffect.IsPeriodic { return }
 *         spellEffect.Damage *= attackTable.ArmorDamageReduction
 *     }
 *
 * That is worth about 26% of every tick against this app's 7,700-armour target, and getting it wrong
 * would have been silent. **Rake's opening hit is not periodic**, so it takes armour like any other
 * special while its own ticks do not — a split inside one ability, and the reason this module returns
 * the two halves separately rather than one number.
 *
 * Every constant is read from wowsims/tbc `sim/druid/rake.go` and `sim/druid/rip.go` at the pinned
 * commit 3301fca5.
 */

/**
 * Rake, spell 27003: an opening hit plus a 9-second bleed.
 *
 * The energy cost is reduced by **Ferocity**, which is the Druid talent of that name rather than the
 * Hunter one — `cost := 40.0 - float64(druid.Talents.Ferocity)`, one energy a rank. Two classes, one
 * talent name, completely different effects; the repo already records Precision and Weapon Mastery
 * doing the same thing, and the effects are keyed by talent id for exactly this reason.
 */
export const RAKE = {
  spellId: 27003,
  baseEnergyCost: 40,
  gcdSeconds: 1,
  /** `78 + 0.01 * MeleeAttackPower`, armour-mitigated because the opener is not periodic. */
  initialFlat: 78,
  initialAttackPowerCoefficient: 0.01,
  ticks: 3,
  tickSeconds: 3,
  /** `36 + 0.02 * MeleeAttackPower` a tick, and these ignore armour. */
  tickFlat: 36,
  tickAttackPowerCoefficient: 0.02,
} as const

/**
 * Rip, spell 27008: a finisher whose **opening hit deals no damage at all**.
 *
 * Upstream gives it `OutcomeFuncMeleeSpecialHit()` with no base damage — the cast exists only to
 * apply the dot and spend the combo points. All of Rip is in the ticks, all of which ignore armour.
 *
 * Only the five-point entry is modelled. Upstream carries 3, 4 and 5 and **panics below three**,
 * which is a fair statement of what a real Feral does: the coefficients are kept so a future
 * combo-point model can read them rather than re-fetch the file.
 */
export const RIP = {
  spellId: 27008,
  energyCost: 30,
  gcdSeconds: 1,
  comboPoints: 5,
  ticks: 6,
  tickSeconds: 2,
  /** Total damage by combo points, divided across the six ticks upstream. */
  byComboPoints: {
    3: { flat: 990, attackPowerCoefficient: 0.18 },
    4: { flat: 1272, attackPowerCoefficient: 0.24 },
    5: { flat: 1554, attackPowerCoefficient: 0.24 },
  },
} as const

export type FeralBleedInput = {
  /** Melee attack power, which both bleeds scale on. */
  attackPower: number
  /** Expected multiplier from the special-attack table. Rake's opener rolls on it; the ticks do not. */
  specialAttackTableMultiplier: number
  /** Armor mitigation as a fraction. Applied to Rake's opener only — the ticks ignore it. */
  armorMitigation: number
  /** Energy per second available to maintain the bleeds, before the filler takes what is left. */
  energyPerSecond: number
  /** Combo points per second the filler generates. Rip needs five per cast. */
  comboPointsPerSecond: number
  /** Rake's cost reduction from the Druid's own Ferocity, in energy. 0 when untalented. */
  rakeCostReduction: number
}

export type FeralBleedEstimate = {
  rakeDps: number
  ripDps: number
  totalDps: number
  /** Energy a second the two bleeds consume, which the filler no longer has. */
  energyPerSecond: number
  /** Share of the time each bleed is actually up, after the energy and combo-point ceilings. */
  rakeUptime: number
  ripUptime: number
}

/**
 * Both bleeds, maintained.
 *
 * **A bleed is not priced like a special.** A special's rate is how often you can afford to press it;
 * a bleed's is how often it *falls off*, because refreshing early throws away the remainder. So each
 * is modelled at one cast per its own duration, and the ceilings decide whether even that is
 * affordable — which for Rip means combo points as well as energy, since it is a finisher.
 *
 * **They compete with Shred for the same energy**, and that is the warning `ROTATION-SCOPE.md` already
 * records about second abilities: energy spent here is energy the filler does not get. What makes
 * these worth it where Mangle was not is the armour split — Shred's damage is reduced by roughly a
 * quarter against a raid boss and the bleed ticks are not, so a bleed's effective return per energy
 * beats its raw one.
 *
 * The caller subtracts `energyPerSecond` from the rotation's budget, so the trade is made explicitly
 * rather than by both sides quietly assuming the whole bar.
 */
export function estimateFeralBleeds(input: FeralBleedInput): FeralBleedEstimate {
  const attackPower = Math.max(0, input.attackPower)
  const unmitigated = 1
  const mitigated = 1 - Math.max(0, Math.min(1, input.armorMitigation))

  const rakeCost = Math.max(0, RAKE.baseEnergyCost - Math.max(0, input.rakeCostReduction))
  const rakeDuration = RAKE.ticks * RAKE.tickSeconds
  const ripDuration = RIP.ticks * RIP.tickSeconds

  // One cast per duration is what maintaining a bleed means; refreshing early discards the remainder.
  const rakeCastsWanted = 1 / rakeDuration
  const ripCastsWanted = 1 / ripDuration

  /*
   * Rake is maintained first. It is the cheaper of the two per cast and it does not need combo
   * points, so a druid short of either keeps Rake and drops Rip — which is also the priority every
   * Feral guide gives.
   */
  let energyLeft = Math.max(0, input.energyPerSecond)
  const rakeCasts = Math.min(rakeCastsWanted, rakeCost > 0 ? energyLeft / rakeCost : Number.POSITIVE_INFINITY)
  energyLeft -= rakeCasts * rakeCost

  const ripFromEnergy = RIP.energyCost > 0 ? energyLeft / RIP.energyCost : Number.POSITIVE_INFINITY
  const ripFromComboPoints = Math.max(0, input.comboPointsPerSecond) / RIP.comboPoints
  const ripCasts = Math.min(ripCastsWanted, ripFromEnergy, ripFromComboPoints)

  const rakeUptime = rakeCastsWanted > 0 ? Math.min(1, rakeCasts / rakeCastsWanted) : 0
  const ripUptime = ripCastsWanted > 0 ? Math.min(1, ripCasts / ripCastsWanted) : 0

  /*
   * Rake's two halves take different mitigation, which is the whole reason they are added separately:
   * the opener is a normal special and the ticks are a bleed.
   */
  const rakeOpener =
    (RAKE.initialFlat + RAKE.initialAttackPowerCoefficient * attackPower) *
    input.specialAttackTableMultiplier *
    mitigated
  const rakeTickTotal = RAKE.ticks * (RAKE.tickFlat + RAKE.tickAttackPowerCoefficient * attackPower) * unmitigated
  const rakeDps = rakeCasts * (rakeOpener + rakeTickTotal)

  const rip = RIP.byComboPoints[RIP.comboPoints]
  // The opener deals nothing at all; every point of Rip is in the ticks, and none of it takes armour.
  const ripTotal = (rip.flat + rip.attackPowerCoefficient * attackPower) * unmitigated
  const ripDps = ripCasts * ripTotal

  return {
    rakeDps: Math.max(0, rakeDps),
    ripDps: Math.max(0, ripDps),
    totalDps: Math.max(0, rakeDps) + Math.max(0, ripDps),
    energyPerSecond: rakeCasts * rakeCost + ripCasts * RIP.energyCost,
    rakeUptime,
    ripUptime,
  }
}
