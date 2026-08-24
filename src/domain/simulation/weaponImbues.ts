/**
 * Windfury Weapon — where most of an Enhancement shaman's damage actually comes from.
 *
 * The spec's own signature ability says so in its notes: Stormstrike is on a 10s cooldown and is a
 * small share of the output, while "Enhancement damage is dominated by Windfury Weapon procs on
 * white swings". Until this existed, that sentence described a gap rather than a model.
 *
 * **A weapon imbue is not a rotational ability**, which is why this is not a `SignatureAbility`.
 * There is no button and no usage rate to defend — the rate falls out of how often the main hand
 * swings and lands. `ROTATION-SCOPE.md` originally filed Enhancement under "gets its second and
 * third buttons"; it does not need one, it needs this.
 *
 * Every constant below is read from wowsims/tbc `sim/shaman/weapon_imbues.go` at the pinned commit
 * 3301fca5, not from the tooltip, because the tooltip states neither the internal cooldown nor the
 * behaviour of the extra attacks.
 */

/**
 * 20% per landed swing, on **each** imbued hand.
 *
 * **Both hands carry Windfury**, which is what an Enhancement shaman runs and what the reference
 * parse shows: two `Windfury Attack` rows with average hits of 2.0k and 962.2 — main hand and off
 * hand — and no Flametongue row at all. Between them they are 28.9% of that shaman's damage, so
 * rolling only the main hand was the single largest gap in this file.
 *
 * **Upstream also carries a 0.36 constant for the both-imbued case, and it is deliberately not used
 * here, because the parse falsifies that reading.** Applying 36% to every landed swing predicts 18.3
 * procs per minute; the log records 41 Windfury hits over 116 seconds, which at two attacks per proc
 * is **10.6 per minute**. Rolling 20% per landed swing on each hand predicts **10.1**, inside 5% of
 * observed. So 0.36 is upstream expressing something other than a per-swing chance — plausibly one
 * roll standing in for a pair, since `1 - 0.8²` is 0.36 — and taking it literally would have doubled
 * the rate.
 *
 * The implied chance straight off the parse is **17.4%** per landed swing, slightly under 20%, which
 * is the shape the shared internal cooldown predicts: some procs land inside another one's cooldown
 * and are lost.
 */
export const WINDFURY_PROC_CHANCE = 0.2

/**
 * Three seconds, and it is the reason this is a rate model rather than a multiplication.
 *
 * Upstream registers it as an ICD aura (`Duration: time.Second * 3`), so a fast weapon cannot convert
 * its extra swings into proportionally more procs. It is not binding at Phase 2 speeds — a 2.6s main
 * hand rolls about one proc per 17 seconds against a ceiling of one per 3 — but modelling it as a
 * bare percentage would silently overstate any future fast-weapon or high-haste build, which is
 * exactly the kind of quiet drift this repo keeps finding.
 */
export const WINDFURY_INTERNAL_COOLDOWN_SECONDS = 3

/** Each proc grants two extra attacks. Upstream duplicates one effect: `[]core.SpellEffect{baseEffect, baseEffect}`. */
export const WINDFURY_EXTRA_ATTACKS = 2

/**
 * Rank 5 grants +475 attack power to the extra attacks, which is what makes them hit far harder than
 * a normal swing. Totem of the Astral Winds raises it to 555; that relic is not modelled here, and
 * naming it is cheaper than pretending the figure is unconditional.
 */
export const WINDFURY_BONUS_ATTACK_POWER = 475

export type WindfuryInput = {
  /** Main-hand swings per second, after haste. */
  mainHandSwingsPerSecond: number
  /** Off-hand swings per second, after haste. Zero or absent when nothing is dual-wielded. */
  offHandSwingsPerSecond?: number
  /**
   * Fraction of those swings that land — hit, crit, glance and block, but not miss, dodge or parry.
   * Upstream gates the proc on `spellEffect.Landed()`, so a swing that never connects cannot roll it.
   */
  landedFraction: number
  /** Expected damage of one extra main-hand attack, already rolled through the white attack table. */
  damagePerExtraAttack: number
  /**
   * The same for the off hand, already carrying the off-hand damage penalty.
   *
   * The parse is the check on this: 962.2 average against the main hand's 2.0k is 48%, which is the
   * ordinary off-hand penalty and *not* the doubled attack-power bonus a first read of upstream
   * suggested. Modelled as a plain off-hand swing with the same +475.
   */
  damagePerOffHandExtraAttack?: number
}

export type WindfuryEstimate = {
  procsPerSecond: number
  /** Split out so a reader can compare against a log, which reports the two hands separately. */
  mainHandDps: number
  offHandDps: number
  dps: number
  /**
   * True when the 3s internal cooldown, rather than the swing rate, is what caps the procs. False at
   * every Phase 2 weapon speed — surfaced so that a build which *does* reach the cap says so instead
   * of quietly flattening.
   */
  limitedByInternalCooldown: boolean
}

/**
 * Sustained Windfury damage, as a rate rather than a simulated proc.
 *
 * Two ceilings, the same shape as the hunter shot weave: how often a landed swing rolls the proc, and
 * how often the internal cooldown will allow one. The lower wins.
 *
 * **The extra attacks cannot re-proc it.** Upstream gives them `ProcMask: core.ProcMaskEmpty`, so
 * there is no cascade to model and the rate stays linear in the swing rate — which is the single
 * assumption that would have made a closed form wrong if it were false.
 */
export function estimateWindfury(input: WindfuryInput): WindfuryEstimate {
  const {
    mainHandSwingsPerSecond,
    offHandSwingsPerSecond = 0,
    landedFraction,
    damagePerExtraAttack,
    damagePerOffHandExtraAttack = 0,
  } = input

  const empty = { procsPerSecond: 0, mainHandDps: 0, offHandDps: 0, dps: 0, limitedByInternalCooldown: false }
  if (mainHandSwingsPerSecond <= 0 || landedFraction <= 0 || damagePerExtraAttack <= 0) return empty

  /*
   * Both hands imbued is the Enhancement setup, and what it changes is that the **off hand rolls for
   * the proc too** — not the chance itself, which the parse pins at 20% per landed swing either way.
   * Missing the off hand is most of why this model read 5.7x under the log.
   */
  const dualImbue = offHandSwingsPerSecond > 0 && damagePerOffHandExtraAttack > 0

  const mainLanded = mainHandSwingsPerSecond * landedFraction
  const offLanded = dualImbue ? offHandSwingsPerSecond * landedFraction : 0
  const totalLanded = mainLanded + offLanded

  /*
   * **One internal cooldown, shared.** Upstream registers a single Windfury aura holding both the
   * main-hand and off-hand spells, so the 3s ICD is spent by whichever hand procs first — it is not
   * one cooldown per weapon. Capping the hands separately would have let a dual-wielder roll twice
   * as many procs as the aura allows.
   */
  const fromSwings = totalLanded * WINDFURY_PROC_CHANCE
  const fromCooldown = 1 / WINDFURY_INTERNAL_COOLDOWN_SECONDS
  const procsPerSecond = Math.min(fromSwings, fromCooldown)

  // Procs land on whichever hand happened to swing, so they divide by each hand's share of the
  // landed swings rather than evenly.
  const mainShare = totalLanded > 0 ? mainLanded / totalLanded : 1
  const mainHandDps = procsPerSecond * mainShare * WINDFURY_EXTRA_ATTACKS * damagePerExtraAttack
  const offHandDps = procsPerSecond * (1 - mainShare) * WINDFURY_EXTRA_ATTACKS * damagePerOffHandExtraAttack

  return {
    procsPerSecond,
    mainHandDps,
    offHandDps,
    dps: mainHandDps + offHandDps,
    limitedByInternalCooldown: fromSwings > fromCooldown,
  }
}
