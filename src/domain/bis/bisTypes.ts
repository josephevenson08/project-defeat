import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { ItemSource } from '../gear/itemTypes'
import type { GearSlot } from '../gear/gearSlots'

export type RankedGearSource = {
  type: ItemSource
  instance?: string
  boss?: string
  vendor?: string
  reputation?: string
  craftedBy?: string
  phase?: number
  notes?: string
  needsVerification?: boolean
}

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
  source?: RankedGearSource
  needsVerification?: boolean
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
