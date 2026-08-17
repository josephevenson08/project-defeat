import type { CharacterRole } from '../character/characterTypes'

export type SimulationBreakdownEntry = {
  label: string
  value: number
}

export type SimulationResult = {
  role: CharacterRole
  metricLabel: 'Estimated DPS' | 'Estimated Healing' | 'Effective Health'
  /** Rounded to one decimal for display. */
  score: number
  /**
   * The same value unrounded. Anything that *computes* with a result — stat weights, upgrade deltas —
   * must use this: those take small differences between two runs, and rounding to one decimal first
   * turns a 1.5% quantisation error into a visibly wrong weight.
   */
  scoreExact: number
  summary: string
  /**
   * What this estimate is missing **for this spec specifically**, from the modelled ability's own
   * `notes`.
   *
   * Every one of the 31 signature abilities carries researched, spec-specific prose about how far a
   * single-ability approximation is from that spec's real rotation — that a Beast Mastery hunter's
   * damage largely bypasses Steady Shot, that Survival is brought for Expose Weakness rather than
   * personal DPS. All of it was written and **none of it reached the interface**.
   *
   * Kept separate from `summary` rather than appended to it. The summary explains how the number was
   * computed and is already long; this explains why the number is wrong for you, which is a different
   * question and the one a reader is more likely to need.
   */
  specNote?: string
  /**
   * Talents this character has spent points in that the model cannot express, named.
   *
   * Only set when points are actually spent, because a warning about talents you do not have is
   * noise — and noise is how a caveat stops being read. The list itself comes from the ingest, which
   * refuses what it cannot express rather than inventing a value for it, so this is the player-facing
   * half of a decision already made honestly in the data.
   */
  unmodelledTalentNote?: string
  breakdown: SimulationBreakdownEntry[]
}
