import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import type { BuildRole, ItemSource, WeaponType } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Enchant = {
  id: string
  name: string
  slot: GearSlot
  stats: Partial<StatBlock>
  source?: ItemSource
  allowedClasses?: TbcClass[]
  allowedSpecs?: TbcSpec[]
  roles?: Array<CharacterRole | BuildRole>
  allowedSlots?: GearSlot[]
  allowedWeaponTypes?: WeaponType[]
  needsVerification?: boolean
  notes?: string
}
