declare module "*/consumableCatalogue.json" {
  const consumables: { consumableCount: number; consumables: import("./consumableTypes").Consumable[] }
  export default consumables
}
