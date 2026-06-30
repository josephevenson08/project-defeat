import type { GearSlot } from '../gear/gearSlots'
import type { ItemSource } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Enchant = {
  id: string
  name: string
  slot: GearSlot
  stats: Partial<StatBlock>
  source?: ItemSource
}
