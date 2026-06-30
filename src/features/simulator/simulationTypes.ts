import type { CharacterRole } from '../character/characterTypes'

export type SimulationBreakdownEntry = {
  label: string
  value: number
}

export type SimulationResult = {
  role: CharacterRole
  metricLabel: 'Estimated DPS' | 'Estimated Healing' | 'Survivability Score'
  score: number
  summary: string
  breakdown: SimulationBreakdownEntry[]
}
