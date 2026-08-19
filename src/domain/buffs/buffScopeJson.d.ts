declare module "*/buffScope.json" {
  const scopes: {
    scopes: Record<
      string,
      { name: string; spellId: number; scope: string; evidence: string; fromOverride?: boolean }
    >
    unresolved: { name: string; spellId?: number; why: string; tooltip?: string }[]
  }
  export default scopes
}
