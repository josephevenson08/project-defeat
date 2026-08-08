import type { BuildRole } from '../gear/itemTypes'
import type { CraftingInfo, ItemSource } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type ConsumableCategory = 'Flask' | 'Battle Elixir' | 'Guardian Elixir' | 'Food'

export type Consumable = {
  id: string
  /** Wowhead item id. The name and id come from Wowhead; the stat values come from wowsims. */
  wowItemId?: number
  name: string
  category: ConsumableCategory
  /** Which roles this is a reasonable pick for; omit for something every role could use. */
  roles?: BuildRole[]
  stats: Partial<StatBlock>
  source: ItemSource
  vendor?: string
  reputation?: string
  craftedBy?: string
  crafting?: CraftingInfo
  /**
   * School-specific spell power, Health and resistances, which `StatBlock` has no fields for. Nine
   * consumables carry these, and for several — Elixir of Major Firepower among them — it is the
   * *only* thing they grant, so dropping it would leave them looking like empty entries.
   */
  extraStats?: Record<string, number>
  needsVerification?: boolean
  notes?: string
}
