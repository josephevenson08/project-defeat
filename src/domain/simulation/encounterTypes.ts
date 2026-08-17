export type SimulationTarget = {
  id: string
  name: string
  level: number
  /** Base armor before any active target debuffs (e.g. Sunder Armor) reduce it. */
  armor: number
  /**
   * Incoming damage per second on the player, before their own mitigation.
   *
   * The one rage source a closed-form model cannot derive. TBC grants rage for damage **taken** as
   * well as dealt (`damage * 2.5 / 274.7`), and for a Warrior that is the difference between a
   * rotation that funds its rage dump and one that does not — measured, the Fury shortfall
   * corresponds to roughly 187 damage/sec.
   *
   * **Defaults to 0, deliberately.** How much a melee DPS takes is entirely fight-specific, so any
   * non-zero default would be an invented number dressed as a measurement. Zero understates rage
   * income and says so, which is the direction this project prefers to be wrong in. Set it to model
   * a particular fight.
   */
  damageTakenPerSecond?: number
  needsVerification?: boolean
  notes?: string
}
