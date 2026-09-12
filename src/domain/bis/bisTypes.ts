import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { ItemSource } from '../gear/itemTypes'
import type { GearSlot } from '../gear/gearSlots'

export type RankedGearSource = {
  /**
   * Optional because the guide's source column does not always settle it.
   *
   * `parseRankedSource` never guesses: a string that names where an item comes from without saying
   * what kind of content that is keeps its `instance` and leaves this absent. Stamping those with
   * `'Other'` would read as a classification the data does not support, which is the same invented
   * value the catalogue's `source` field is documented to avoid.
   */
  type?: ItemSource
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
