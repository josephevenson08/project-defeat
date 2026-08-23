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

/** 20% per landed swing with one hand imbued. Upstream uses 0.36 when *both* hands carry Windfury. */
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
  /**
   * Fraction of those swings that land — hit, crit, glance and block, but not miss, dodge or parry.
   * Upstream gates the proc on `spellEffect.Landed()`, so a swing that never connects cannot roll it.
   */
  landedFraction: number
  /** Expected damage of one extra attack, already rolled through the white attack table. */
  damagePerExtraAttack: number
}

export type WindfuryEstimate = {
  procsPerSecond: number
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
  const { mainHandSwingsPerSecond, landedFraction, damagePerExtraAttack } = input

  if (mainHandSwingsPerSecond <= 0 || landedFraction <= 0 || damagePerExtraAttack <= 0) {
    return { procsPerSecond: 0, dps: 0, limitedByInternalCooldown: false }
  }

  const fromSwings = mainHandSwingsPerSecond * landedFraction * WINDFURY_PROC_CHANCE
  const fromCooldown = 1 / WINDFURY_INTERNAL_COOLDOWN_SECONDS
  const procsPerSecond = Math.min(fromSwings, fromCooldown)

  return {
    procsPerSecond,
    dps: procsPerSecond * WINDFURY_EXTRA_ATTACKS * damagePerExtraAttack,
    limitedByInternalCooldown: fromSwings > fromCooldown,
  }
}
