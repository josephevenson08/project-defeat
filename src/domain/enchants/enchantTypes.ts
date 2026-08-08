import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import type { GearSlot } from '../gear/gearSlots'
import type { BuildRole, ItemSource, WeaponType } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Enchant = {
  id: string
  /** Wowhead enchant item id, where the enchant is applied from a scroll or formula. */
  wowEnchantId?: number
  /** The spell effect the enchant applies. Distinct from the item id and useful for cross-referencing. */
  effectId?: number
  /**
   * Every spell id that applies this enchant. TBC re-issued several enchants under fresh ids in 2.4,
   * so "Ring - Spellpower" is both 27924 and 46518 — one enchant, two ids, and a guide may cite
   * either.
   */
  effectIds?: number[]
  name: string
  slot: GearSlot
  stats: Partial<StatBlock>
  source?: ItemSource
  allowedClasses?: TbcClass[]
  allowedSpecs?: TbcSpec[]
  roles?: Array<CharacterRole | BuildRole>
  allowedSlots?: GearSlot[]
  allowedWeaponTypes?: WeaponType[]
  /** Shield-only weapon enchants (e.g. "Shield - Intellect"). */
  requiresShield?: boolean
  /** Two-hand-only weapon enchants (e.g. "Savagery"). */
  requiresTwoHand?: boolean
  /**
   * Set on enchants whose whole value is a proc, like Mongoose or Crusader. They carry no flat stats,
   * so scoring them at zero would be wrong in a different way from leaving them out — this says so
   * explicitly, the same treatment item procs get.
   */
  notModelled?: string
  /** Resistances and school-specific spell power, which `StatBlock` has no fields for. */
  extraStats?: Record<string, number>
  needsVerification?: boolean
  notes?: string
}
