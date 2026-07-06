import type { SimulationTarget } from './encounterTypes'

export const sampleEncounters: readonly SimulationTarget[] = [
  {
    id: 'generic-phase-2-raid-boss',
    name: 'Generic Phase 1/2 Raid Boss (Level 73)',
    level: 73,
    armor: 10643,
    needsVerification: true,
    notes:
      'Armor is a commonly used generic TBC raid-boss approximation, not a specific boss tooltip value — real bosses vary. Use this as a reasonable default until per-boss data is added.',
  },
]

export const defaultSimulationTarget = sampleEncounters[0]

export function getSimulationTargetById(id: string | undefined) {
  return sampleEncounters.find((target) => target.id === id) ?? defaultSimulationTarget
}
