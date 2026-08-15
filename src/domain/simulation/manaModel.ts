/**
 * What a caster's mana actually does, so a healing estimate stops pretending mana is free.
 *
 * `calculateHealing` reported an HPS with no mana term at all — a healer who casts forever. That is
 * the single largest reason the Simulation tab is hidden. Every constant here is read from
 * wowsims/tbc `sim/core/mana.go` at the commit the item catalogue is pinned to:
 *
 * ```go
 * MP5ManaRegenPerSecond()    = stats[MP5] / 5.0
 * SpiritManaRegenPerSecond() = 0.001 + Spirit*sqrt(Intellect)*0.009327
 * AddStat(stats.Mana, 20-15*20); Mana += Intellect*15
 * ```
 *
 * **The important one is what happens while casting.** wowsims computes casting regen as MP5 alone
 * and only adds a share of Spirit regen when `SpiritRegenRateCasting` is non-zero — and that comes
 * from talents (Meditation and its equivalents), which this project does not model. So for an
 * untalented healer mid-cast, **Spirit contributes nothing and MP5 is the entire regen**. That is a
 * real TBC property rather than a modelling shortcut, and it is why Spirit prices near zero here.
 */

/** MP5 is "mana per 5 seconds", so a per-second rate divides by this. */
export const MP5_INTERVAL_SECONDS = 5

/** Above the first 20 points, each point of Intellect is worth this much maximum mana. */
export const MANA_PER_INTELLECT = 15

/** Regen from MP5 alone — the whole of it while casting, untalented. */
export function mp5RegenPerSecond(mp5: number): number {
  return mp5 / MP5_INTERVAL_SECONDS
}

/**
 * Spirit-driven regen, per second, **while not casting**.
 *
 * Exported and tested because it is the number Spirit is worth *if* the talents that let it run
 * during casting are ever modelled. Nothing in the healing estimate uses it today, deliberately: a
 * healer casting continuously gets none of it.
 */
export function spiritRegenPerSecond(spirit: number, intellect: number): number {
  return 0.001 + spirit * Math.sqrt(intellect) * 0.009327
}

/**
 * Maximum mana contributed by Intellect.
 *
 * This is **not** a full mana pool: a character's class base mana is added on top, and wowsims takes
 * that from a per-race/class table that is not in its source tree at this commit. So this
 * under-reports the pool, which is why nothing here divides by it to produce a time-to-empty — a
 * precise-looking number computed from a known-incomplete pool would be worse than not offering one.
 */
export function manaFromIntellect(intellect: number): number {
  return intellect * MANA_PER_INTELLECT + (20 - MANA_PER_INTELLECT * 20)
}

export type ManaBudget = {
  /** Mana leaving the pool each second at the modelled cast rate. */
  spentPerSecond: number
  /** Mana returning each second while casting — MP5 only, untalented. */
  regenPerSecond: number
  /** How far short the regen falls. Zero when the rate is genuinely sustainable. */
  deficitPerSecond: number
  /**
   * The share of the cast rate that regen alone could fund forever, capped at 1.
   *
   * Not applied to the headline healing number. A healer who casts flat out until empty and one who
   * throttles to this fraction are both real, and neither is "the" answer — so this is reported
   * beside the unconstrained figure rather than silently replacing it.
   */
  sustainableFraction: number
  /** Healing per point of mana — the efficiency metric that does not depend on a pool at all. */
  healingPerMana: number
}

export function computeManaBudget(options: {
  manaCostPerCast: number
  castsPerSecond: number
  healPerCast: number
  mp5: number
}): ManaBudget {
  const spentPerSecond = options.manaCostPerCast * options.castsPerSecond
  const regenPerSecond = mp5RegenPerSecond(options.mp5)
  const deficitPerSecond = Math.max(0, spentPerSecond - regenPerSecond)

  return {
    spentPerSecond,
    regenPerSecond,
    deficitPerSecond,
    sustainableFraction: spentPerSecond > 0 ? Math.min(1, regenPerSecond / spentPerSecond) : 1,
    healingPerMana: options.manaCostPerCast > 0 ? options.healPerCast / options.manaCostPerCast : 0,
  }
}
