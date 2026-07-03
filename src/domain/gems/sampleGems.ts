import type { Gem } from './gemTypes'

export const sampleGems: readonly Gem[] = [
  { id: 'bold-living-ruby', name: 'Bold Living Ruby', color: 'Red', quality: 'Rare', stats: { strength: 8 } },
  { id: 'delicate-living-ruby', name: 'Delicate Living Ruby', color: 'Red', quality: 'Rare', stats: { agility: 8 } },
  { id: 'runed-living-ruby', name: 'Runed Living Ruby', color: 'Red', quality: 'Rare', stats: { spellPower: 9 } },
  { id: 'gleaming-dawnstone', name: 'Gleaming Dawnstone', color: 'Yellow', quality: 'Rare', stats: { spellCritRating: 8 } },
  { id: 'rigid-dawnstone', name: 'Rigid Dawnstone', color: 'Yellow', quality: 'Rare', stats: { hitRating: 8 } },
  { id: 'solid-star-of-elune', name: 'Solid Star of Elune', color: 'Blue', quality: 'Rare', stats: { stamina: 12 } },
  { id: 'royal-nightseye', name: 'Royal Nightseye', color: 'Blue', quality: 'Rare', stats: { healingPower: 9, mp5: 2 } },
  { id: 'relentless-earthstorm-diamond', name: 'Relentless Earthstorm Diamond', color: 'Meta', quality: 'Epic', stats: { agility: 12, critRating: 6 }, uniqueEquipped: true },
  {
    id: 'insightful-earthstorm-diamond',
    name: 'Insightful Earthstorm Diamond',
    color: 'Meta',
    quality: 'Epic',
    stats: { intellect: 12 },
    uniqueEquipped: true,
  },
  {
    id: 'chaotic-skyfire-diamond',
    name: 'Chaotic Skyfire Diamond',
    color: 'Meta',
    quality: 'Epic',
    stats: { spellCritRating: 12 },
    uniqueEquipped: true,
  },
  {
    id: 'powerful-earthstorm-diamond',
    name: 'Powerful Earthstorm Diamond',
    color: 'Meta',
    quality: 'Epic',
    stats: { stamina: 18 },
    uniqueEquipped: true,
  },
]

export function getGemById(id: string) {
  return sampleGems.find((gem) => gem.id === id)
}
