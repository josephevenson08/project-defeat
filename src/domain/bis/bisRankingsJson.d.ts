
declare module "*/bisRankings.json" {
  const rankings: {
    /** When the 27 guides were fetched from Wowhead, as an ISO date. */
    fetchedAt?: string
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
