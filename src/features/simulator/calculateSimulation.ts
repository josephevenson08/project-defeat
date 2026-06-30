import type { StatBlock } from '../stats/statsTypes'
import type { SimulationResult } from './simulationTypes'

export function calculateSimulation(stats: StatBlock): SimulationResult {
  const estimatedDps =
    stats.attackPower * 0.35 +
    stats.spellPower * 0.3 +
    stats.critRating * 1.5 +
    stats.hitRating * 1.2

  return {
    estimatedDps: Math.round(estimatedDps * 10) / 10,
    summary: 'Prototype calculation based on current attack power, spell power, crit rating, and hit rating.',
  }
}
