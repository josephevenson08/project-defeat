declare module "*/talentEffects.json" {
  const talentEffects: {
    className: string
    effectCount: number
    effects: {
      talentId: number
      talent: string
      tree: string
      maxRank: number
      kind: string
      unit: string
      /** Present for per-rank effects; absent for flat ones. */
      perRank?: number
      /** Present for effects that do not scale with rank (Anger Management, Endless Rage). */
      flatValue?: number
      caveat?: string
      source: string
    }[]
    skipped: { talent: string; reason: string }[]
  }
  export default talentEffects
}
