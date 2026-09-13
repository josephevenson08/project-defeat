declare module "*/acquisitionCosts.json" {
  const costs: {
    fetchedAt: string
    source: string
    costs: {
      wowItemId: number
      name: string
      type: 'Crafted' | 'Vendor'
      profession?: string
      requiredSkill?: number
      reagents?: { wowItemId: number; name: string; quantity: number }[]
      vendor?: string
      price?: { name: string; quantity: number; wowItemId?: number }[]
      source: string
    }[]
  }
  export default costs
}
