declare module "*/enchantCatalogue.json" {
  const enchants: { enchantCount: number; enchants: import("./enchantTypes").Enchant[] }
  export default enchants
}
