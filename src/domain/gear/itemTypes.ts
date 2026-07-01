import type { TbcClass } from '../character/characterTypes'
import type { StatBlock } from '../stats/statTypes'
import type { GearSlot } from './gearSlots'

export type ItemQuality = 'Poor' | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export type ItemSource =
  | 'Dungeon'
  | 'Heroic Dungeon'
  | 'Raid'
  | 'Quest'
  | 'Crafted'
  | 'PvP'
  | 'Reputation'
  | 'World Drop'
  | 'Vendor'
  | 'Other'

export type SocketColor = 'Red' | 'Yellow' | 'Blue' | 'Meta'

export type GearItem = {
  id: string
  wowItemId?: number
  name: string
  slot: GearSlot
  quality: ItemQuality
  source: ItemSource
  phase?: number
  requiredLevel?: number
  itemLevel?: number
  unique?: boolean
  stats: Partial<StatBlock>
  sockets?: SocketColor[]
  socketBonus?: Partial<StatBlock>
  allowedClasses?: TbcClass[]
  zone?: string
  instance?: string
  boss?: string
  vendor?: string
  reputation?: string
  craftedBy?: string
  notes?: string
}

export type EquippedSlot = {
  item: GearItem
  gemIds: string[]
  enchantId?: string
}

export type EquippedGear = Record<GearSlot, EquippedSlot>
