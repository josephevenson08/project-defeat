export type SimulationTarget = {
  id: string
  name: string
  level: number
  /** Base armor before any active target debuffs (e.g. Sunder Armor) reduce it. */
  armor: number
  needsVerification?: boolean
  notes?: string
}
