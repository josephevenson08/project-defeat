declare module "*/bisRecommendations.json" {
  const recs: {
    specCount: number
    specs: Record<string, { className: string; spec: string; sourceUrl: string; gems: Record<string, string>; enchants: Record<string, string> }>
  }
  export default recs
}
