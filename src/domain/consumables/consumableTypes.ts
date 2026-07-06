import type { BuildRole } from '../gear/itemTypes'
import type { CraftingInfo, ItemSource } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type ConsumableCategory = 'Flask' | 'Battle Elixir' | 'Guardian Elixir' | 'Food'

export type Consumable = {
  id: string
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
  needsVerification?: boolean
  notes?: string
}
