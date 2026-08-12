
declare module "*/tierLists.json" {
  const tierLists: {
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
