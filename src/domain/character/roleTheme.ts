import type { CharacterRole } from './characterTypes'

/**
 * A muted hue per role, used for the hairline that tells you which role a panel is showing.
 *
 * These are deliberately desaturated. Role is real information, so it keeps a colour — but item
 * quality is the signal a player reads first, and the previous saturated set (amber-500, violet-500,
 * teal-400, blue-400) competed directly with epic purple and rare blue for attention. Muting them
 * keeps the four roles distinguishable from each other while leaving quality the loudest colour on
 * the page, which is the whole point of an otherwise near-monochrome interface.
 */
export const roleAccentColors: Record<CharacterRole, string> = {
  'Physical DPS': '#9c7346',
  'Caster DPS': '#7b6a9c',
  Healer: '#4d8a80',
  Tank: '#587a9c',
}

export function getRoleAccentColor(role: CharacterRole): string {
  return roleAccentColors[role]
}
