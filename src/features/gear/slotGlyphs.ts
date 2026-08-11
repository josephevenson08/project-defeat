import type { GearSlot } from './gearTypes'

/**
 * Two-letter glyph standing in for an item icon, so a slot still has something to anchor the eye
 * even with no art assets in the repo and no network calls at runtime.
 *
 * Shared between the gear paperdoll and the ranked-gear list so a slot looks the same wherever it
 * appears. Sized in CSS to the icon it will eventually become, so dropping real icons in later is a
 * swap rather than a layout change.
 */
const SLOT_GLYPH: Record<string, string> = {
  Head: 'HD',
  Neck: 'NK',
  Shoulders: 'SH',
  Back: 'BK',
  Chest: 'CH',
  Wrists: 'WR',
  Hands: 'HN',
  Waist: 'WT',
  Legs: 'LG',
  Feet: 'FT',
  'Finger 1': 'R1',
  'Finger 2': 'R2',
  'Trinket 1': 'T1',
  'Trinket 2': 'T2',
  'Main Hand': 'MH',
  'Off Hand': 'OH',
  Ranged: 'RG',
  Relic: 'RL',
}

export function slotGlyph(slot: GearSlot | string): string {
  return SLOT_GLYPH[slot] ?? '--'
}
