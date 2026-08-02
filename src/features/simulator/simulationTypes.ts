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
  breakdown: SimulationBreakdownEntry[]
}
