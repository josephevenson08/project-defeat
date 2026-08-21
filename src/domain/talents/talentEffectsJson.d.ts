declare module "*/talentEffects.json" {
  const talentEffects: {
    classes: string[]
    effectCount: number
    effects: {
      /** Which class's tree this talent belongs to. Talent ids are globally unique, but two classes
       *  can share a talent *name* (Warrior and Rogue both have Precision), so the class is what
       *  keeps a name-based lookup honest. */
      className: string
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
      /** Which `StatBlock` key a `statFactor` multiplies. */
      stat?: string
      /** Source and destination of a `statConversion`. */
      from?: string
      to?: string
      caveat?: string
      source: string
    }[]
    skipped: { className: string; talent: string; reason: string }[]
  }
  export default talentEffects
}
