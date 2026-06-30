import type { ItemQuality, SocketColor } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Gem = {
  id: string
  name: string
  color: SocketColor
  quality: ItemQuality
  stats: Partial<StatBlock>
  uniqueEquipped?: boolean
}
