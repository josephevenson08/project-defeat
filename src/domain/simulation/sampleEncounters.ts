import type { SimulationTarget } from './encounterTypes'

export const sampleEncounters: readonly SimulationTarget[] = [
  {
    id: 'generic-phase-2-raid-boss',
    name: 'Generic Phase 1/2 Raid Boss (Level 73)',
    level: 73,
    armor: 7700,
    needsVerification: true,
    notes:
      'Armor is a commonly used generic TBC raid-boss approximation, not a specific boss tooltip value — real bosses vary. Was 10643 until the encounter became a single fixed target: while three presets existed, 10643 was the one labelled "heavily armored" against 7700 for "typical", so keeping it as the only option meant every physical DPS number was quoted against the heavy end. 7700 is the typical figure, and every DPS number in the app moved up when this changed.',
  },
]

export const defaultSimulationTarget = sampleEncounters[0]

export function getSimulationTargetById(id: string | undefined) {
  return sampleEncounters.find((target) => target.id === id) ?? defaultSimulationTarget
}
