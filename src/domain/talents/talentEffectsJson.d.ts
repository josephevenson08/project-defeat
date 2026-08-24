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
      /**
       * A constant added to a multiplier's bonus once any rank is spent, on top of `perRank`.
       *
       * Only Shaman's Flurry needs it, and it is the whole reason that talent was refused: upstream
       * computes `1.05 + 0.05*rank` where Warrior's is `1 + 0.05*rank`. Same slope, plus a flat 5%
       * for owning the talent at all, which is why the Shaman ranks read 10/15/20/25/30 against the
       * Warrior's 5/10/15/20/25.
       */
      baseBonus?: number
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
