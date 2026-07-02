import type { CharacterRole } from './characterTypes'

export const roleAccentColors: Record<CharacterRole, string> = {
  'Physical DPS': '#f59e0b',
  'Caster DPS': '#8b5cf6',
  Healer: '#2dd4bf',
  Tank: '#60a5fa',
}

export function getRoleAccentColor(role: CharacterRole): string {
  return roleAccentColors[role]
}
