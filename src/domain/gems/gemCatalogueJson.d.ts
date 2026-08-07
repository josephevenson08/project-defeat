declare module "*/gemCatalogue.json" {
  const gems: { gemCount: number; gems: import("./gemTypes").Gem[] }
  export default gems
}
