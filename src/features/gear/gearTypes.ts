import type { StatBlock } from '../stats/statsTypes'

export type GearSlot = 'Head' | 'Chest' | 'Hands' | 'Legs' | 'Weapon' | 'Trinket 1' | 'Trinket 2'

export type GearItem = {
  id: string
  name: string
  slot: GearSlot
  source: string
  stats: Partial<StatBlock>
}

export type EquippedGear = Record<GearSlot, GearItem>
