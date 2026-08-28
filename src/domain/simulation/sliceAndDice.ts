/**
 * Slice and Dice, and the energy economy that pays for it.
 *
 * **A finisher that deals no damage at all**, which is why it fits nowhere in `SignatureAbility`: it
 * spends 25 energy and five combo points to make the rogue swing 30% faster for a while. The repo's
 * ability schema describes things that hit; this describes something that changes how often
 * everything else does. It lives here for the same reason `weaponImbues.ts` does — a buff folded into
 * white damage rather than layered on top of it.
 *
 * Every constant is read from wowsims/tbc `sim/rogue/slice_and_dice.go` and `sim/rogue/talents.go`
 * at the pinned commit 3301fca5.
 */

/** `SliceAndDiceEnergyCost = 25.0`. */
export const SLICE_AND_DICE_ENERGY_COST = 25

/**
 * `hasteBonus := 1.3` — a flat 30% melee speed, both hands.
 *
 * Slayer's 2-piece adds another 0.05 upstream. Not applied here: this model has no tier-set lookup on
 * the physical path, and inventing the bonus would overstate every rogue rather than only the ones
 * wearing it.
 */
export const SLICE_AND_DICE_HASTE = 1.3

/**
 * A **one second** global cooldown, not the usual 1.5, and `IgnoreHaste: true` on top.
 *
 * Both are read off the cast config rather than assumed. The GCD matters because it is the ceiling
 * that actually binds when energy does not.
 */
export const SLICE_AND_DICE_GCD_SECONDS = 1

/**
 * Duration in seconds by combo points spent — index 0 is unused, matching upstream's `[6]` array.
 *
 * A rogue refreshes at five, which is the only entry this model reads. The other four are kept
 * because they are the same array upstream writes and a future combo-point model would need them;
 * dropping them would mean re-reading the source to get them back.
 */
export const SLICE_AND_DICE_BASE_DURATIONS = [0, 9, 12, 15, 18, 21] as const

/** The refresh a raiding rogue actually uses. */
export const SLICE_AND_DICE_COMBO_POINTS = 5

/**
 * Combat Potency: a **20% chance on a landed off-hand hit** to return 3 energy a rank.
 *
 * The proc mask is the load-bearing detail — `ProcMaskMeleeOH`, with upstream citing the spell's own
 * mask of 8838608. Main-hand swings and specials return nothing, so this talent is worth exactly what
 * the off-hand swing rate is worth, and Slice and Dice raises that by 30%.
 */
export const COMBAT_POTENCY_PROC_CHANCE = 0.2
export const COMBAT_POTENCY_ENERGY_PER_RANK = 3

/** Relentless Strikes returns 25 energy on a finisher, and at five combo points it is guaranteed. */
export const RELENTLESS_STRIKES_ENERGY = 25

/**
 * Energy per second returned by Combat Potency.
 *
 * Takes **landed** off-hand swings rather than attempted ones, because upstream checks
 * `spellEffect.Landed()` before the proc mask — a miss or a dodge returns nothing, and a dual-wielding
 * rogue misses a lot before hit cap.
 */
export function combatPotencyEnergyPerSecond(landedOffHandSwingsPerSecond: number, energyPerProc: number): number {
  if (energyPerProc <= 0) return 0
  return Math.max(0, landedOffHandSwingsPerSecond) * COMBAT_POTENCY_PROC_CHANCE * energyPerProc
}

export type SliceAndDiceInput = {
  /** Improved Slice and Dice, as a factor. 1 when untalented. */
  durationMultiplier: number
  /** Energy handed back per finisher. Relentless Strikes, 25 at five combo points. 0 untalented. */
  energyRefundPerFinisher: number
  /** Energy per second the rogue has, including Combat Potency. */
  energyPerSecond: number
  /** Global cooldowns per second not already spent by the rotation. */
  gcdBudgetPerSecond: number
  /** Combo points per second the rotation generates. One per Sinister Strike landed. */
  comboPointsPerSecond: number
}

export type SliceAndDiceEstimate = {
  durationSeconds: number
  /** Refreshes per second actually achievable, after all three ceilings. */
  refreshesPerSecond: number
  /** Refreshes per second needed to hold it at 100%. */
  refreshesNeededPerSecond: number
  /** Net energy per second, after Relentless Strikes hands some back. Can be zero or negative. */
  netEnergyPerSecond: number
  uptime: number
  /** The melee speed multiplier to fold into white damage. 1 when it cannot be held up at all. */
  speedMultiplier: number
}

/**
 * How much Slice and Dice a rogue can actually hold up, and what that is worth.
 *
 * **Three ceilings, and which one binds is worth knowing.** A refresh needs energy, a global
 * cooldown, and five combo points. The combo-point ceiling is the interesting one and the reason this
 * takes a generation rate at all: five points is five Sinister Strikes, and the rotation's shot rate
 * is itself energy-bound, so a rogue who spends everything on the filler still cannot refresh faster
 * than they generate.
 *
 * **Relentless Strikes very nearly makes it free.** It returns 25 energy on a five-point finisher,
 * against Slice and Dice's 25 cost — so for a rogue who has it the net energy cost is *exactly zero*
 * and only the global cooldown and the combo points are left. That is not an approximation, it is
 * the two constants cancelling, and it is why a talented rogue holds the buff at 100% without
 * visibly paying for it.
 *
 * **What it is not is a damage source.** The returned multiplier belongs in the white-damage swing
 * rate beside gear haste and Flurry. It must not reach the specials: Sinister Strike is bounded by
 * energy and the global cooldown, neither of which melee haste touches, so a rogue swinging 30%
 * faster presses exactly as many buttons. The one indirect route is real and modelled — faster
 * off-hand swings mean more Combat Potency procs mean more energy — but it runs through the energy
 * budget rather than through the swing rate.
 */
export function estimateSliceAndDice(input: SliceAndDiceInput): SliceAndDiceEstimate {
  const durationSeconds =
    SLICE_AND_DICE_BASE_DURATIONS[SLICE_AND_DICE_COMBO_POINTS] * Math.max(1, input.durationMultiplier)

  const refreshesNeededPerSecond = 1 / durationSeconds
  const netEnergyCost = Math.max(0, SLICE_AND_DICE_ENERGY_COST - input.energyRefundPerFinisher)

  const fromEnergy =
    netEnergyCost > 0 ? Math.max(0, input.energyPerSecond) / netEnergyCost : Number.POSITIVE_INFINITY
  const fromGcd = Math.max(0, input.gcdBudgetPerSecond) / SLICE_AND_DICE_GCD_SECONDS
  const fromComboPoints = Math.max(0, input.comboPointsPerSecond) / SLICE_AND_DICE_COMBO_POINTS

  const refreshesPerSecond = Math.min(refreshesNeededPerSecond, fromEnergy, fromGcd, fromComboPoints)
  const uptime = refreshesNeededPerSecond > 0 ? Math.min(1, refreshesPerSecond / refreshesNeededPerSecond) : 0

  return {
    durationSeconds,
    refreshesPerSecond,
    refreshesNeededPerSecond,
    netEnergyPerSecond: refreshesPerSecond * netEnergyCost,
    uptime,
    // Time-weighted, the same shape Frenzy uses: the rogue swings faster for `uptime` of the fight.
    speedMultiplier: 1 + (SLICE_AND_DICE_HASTE - 1) * uptime,
  }
}
