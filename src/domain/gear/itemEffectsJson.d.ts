
declare module "*/itemEffects.json" {
  const itemEffects: {
    effectCount: number
    skippedCount: number
    effects: {
      wowItemId: number
      name?: string
      kind: 'proc' | 'onUse'
      statBonus: Record<string, number>
      durationSeconds: number
      cooldownSeconds: number
      /** "internal cooldown" or "N procs per minute" — provenance for how the rate was derived. */
      rateBasis?: string
      source: string
    }[]
  }
  export default itemEffects
}
