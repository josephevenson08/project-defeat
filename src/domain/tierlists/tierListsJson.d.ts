
declare module "*/tierLists.json" {
  const tierLists: {
    /** When the three pages were fetched from Wowhead, as an ISO date. */
    fetchedAt?: string
    listCount: number
    placementCount: number
    specsCovered: number
    lists: {
      role: string
      title: string
      sourceUrl: string
      phase: number
      tiers: { label: string; placements: { className: string; spec: string; slug: string }[] }[]
    }[]
  }
  export default tierLists
}
