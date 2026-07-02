import type { Faction, TbcClass, TbcRace } from './characterTypes'

export const racesByFaction: Record<Faction, readonly TbcRace[]> = {
  Alliance: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei'],
  Horde: ['Orc', 'Undead', 'Tauren', 'Troll', 'Blood Elf'],
}

export const factions = Object.keys(racesByFaction) as Faction[]

// TBC-era race/class availability. Cataclysm later added Blood Elf Warrior, Undead Hunter,
// Dwarf/Gnome/Troll Death Knight, etc; none of those apply to TBC Classic Anniversary.
export const racesByClass: Record<TbcClass, readonly TbcRace[]> = {
  Warrior: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei', 'Orc', 'Undead', 'Tauren', 'Troll'],
  Paladin: ['Human', 'Dwarf', 'Draenei', 'Blood Elf'],
  Hunter: ['Dwarf', 'Night Elf', 'Draenei', 'Orc', 'Tauren', 'Troll', 'Blood Elf'],
  Rogue: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Orc', 'Undead', 'Troll', 'Blood Elf'],
  Priest: ['Human', 'Dwarf', 'Night Elf', 'Draenei', 'Undead', 'Troll', 'Blood Elf'],
  Shaman: ['Draenei', 'Orc', 'Tauren', 'Troll'],
  Mage: ['Human', 'Gnome', 'Undead', 'Troll', 'Blood Elf'],
  Warlock: ['Human', 'Gnome', 'Orc', 'Undead', 'Blood Elf'],
  Druid: ['Night Elf', 'Tauren'],
}

export function getRacesForClassAndFaction(className: TbcClass, faction: Faction): readonly TbcRace[] {
  const legalRaces = racesByClass[className]
  return racesByFaction[faction].filter((race) => legalRaces.includes(race))
}

export function getClassesForRace(race: TbcRace): readonly TbcClass[] {
  return (Object.keys(racesByClass) as TbcClass[]).filter((className) => racesByClass[className].includes(race))
}

export function isClassLegalForRace(className: TbcClass, race: TbcRace): boolean {
  return racesByClass[className].includes(race)
}
