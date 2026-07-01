import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'

export type RankedGearEntry = {
  className: TbcClass
  spec: TbcSpec
  phase: number
  slot: GearSlot
  rank: number
  itemId: string
  wowItemId?: number
  recommendedEnchantId?: string
  recommendedGemIds?: string[]
  notes?: string
  sourceName: string
  sourceUrl?: string
}

export type BisList = {
  id: string
  className: TbcClass
  spec: TbcSpec
  phase: number
  title: string
  sourceName: string
  sourceUrl?: string
  entries: readonly RankedGearEntry[]
}
