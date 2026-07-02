import type { ItemQuality } from './itemTypes'

export const qualityColors: Record<ItemQuality, string> = {
  Poor: '#9d9d9d',
  Common: '#ffffff',
  Uncommon: '#1eff00',
  Rare: '#0070dd',
  Epic: '#a335ee',
  Legendary: '#ff8000',
}

export function getQualityColor(quality: ItemQuality): string {
  return qualityColors[quality]
}
