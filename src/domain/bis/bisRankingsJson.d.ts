
declare module "*/bisRankings.json" {
  const rankings: {
    specs: Record<string, {
      className: string
      spec: string
      phase: number
      sourceName: string
      sourceUrl: string
      slots: Record<string, { rank: number; wowItemId: number; note?: string; source?: string; section: string }[]>
    }>
  }
  export default rankings
}
