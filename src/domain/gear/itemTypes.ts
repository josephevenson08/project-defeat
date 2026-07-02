import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
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

export type ArmorType = 'Cloth' | 'Leather' | 'Mail' | 'Plate' | 'Shield' | 'Relic' | 'Other'

export type WeaponType =
  | 'Axe'
  | 'Dagger'
  | 'Fist Weapon'
  | 'Mace'
  | 'Sword'
  | 'Staff'
  | 'Polearm'
  | 'Bow'
  | 'Gun'
  | 'Crossbow'
  | 'Thrown'
  | 'Wand'
  | 'Shield'
  | 'Held In Off-hand'
  | 'Totem'
  | 'Libram'
  | 'Idol'
  | 'Other'

export type BuildRole = CharacterRole | 'Hybrid'

export type CraftingMaterial = {
  name: string
  quantity: number
  wowItemId?: number
  /** Where/how to obtain this material: farmed mob(s) + zone, vendor, auction house, sub-recipe, etc. */
  farmSource: string
  needsVerification?: boolean
}

export type CraftingInfo = {
  /** Profession skill level required to learn/craft the recipe. */
  requiredSkill?: number
  /** Profession specialization required, if any (e.g. "Spellfire Tailoring", "Hammersmith"). */
  specialization?: string
  /** Where the recipe/pattern/plans/schematic itself is obtained. */
  recipeSource: string
  materials: readonly CraftingMaterial[]
  needsVerification?: boolean
  notes?: string
}

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
  uniqueEquipped?: boolean
  stats: Partial<StatBlock>
  armorType?: ArmorType
  weaponType?: WeaponType
  sockets?: SocketColor[]
  socketBonus?: Partial<StatBlock>
  allowedClasses?: TbcClass[]
  allowedSpecs?: TbcSpec[]
  roles?: BuildRole[]
  zone?: string
  instance?: string
  boss?: string
  vendor?: string
  reputation?: string
  craftedBy?: string
  crafting?: CraftingInfo
  needsVerification?: boolean
  notes?: string
}

export type EquippedSlot = {
  item: GearItem
  gemIds: string[]
  enchantId?: string
}

export type EquippedGear = Record<GearSlot, EquippedSlot>
