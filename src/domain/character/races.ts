import type { Faction, TbcClass, TbcRace } from './characterTypes'

export const racesByFaction: Record<Faction, readonly TbcRace[]> = {
  Alliance: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei'],
  Horde: ['Orc', 'Undead', 'Tauren', 'Troll', 'Blood Elf'],
}

export const factions = Object.keys(racesByFaction) as Faction[]

// TBC-era race/class availability. Cataclysm later added Blood Elf Warrior, Undead Hunter,
// Dwarf/Gnome/Troll Death Knight, etc; none of those apply to TBC Classic Anniversary.
//
// **Draenei Mage is TBC, and this table refused it until 2026-09-16.** A code comment in
// `baseStats.ts` asserted it was "added in Cataclysm", and the row was built on that. It was a
// launch combination: warcraft.wiki.gg's draenei page lists "Hunter, Mage, Paladin, Priest, Shaman,
// Warrior" at patch 2.0.3, its mage page marks draenei with the Burning Crusade icon, Warcraft
// Tavern's TBC race guide agrees, and wowsims/tbc - the pinned upstream this app's base stats come
// from - carries Draenei Mage base stats. The other nine rows were checked against the same sources
// and are unchanged. Verify a combination against a source before excluding it; this one was
// removed on a remembered fact.
export const racesByClass: Record<TbcClass, readonly TbcRace[]> = {
  Warrior: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei', 'Orc', 'Undead', 'Tauren', 'Troll'],
  Paladin: ['Human', 'Dwarf', 'Draenei', 'Blood Elf'],
  Hunter: ['Dwarf', 'Night Elf', 'Draenei', 'Orc', 'Tauren', 'Troll', 'Blood Elf'],
  Rogue: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Orc', 'Undead', 'Troll', 'Blood Elf'],
  Priest: ['Human', 'Dwarf', 'Night Elf', 'Draenei', 'Undead', 'Troll', 'Blood Elf'],
  Shaman: ['Draenei', 'Orc', 'Tauren', 'Troll'],
  Mage: ['Human', 'Gnome', 'Draenei', 'Undead', 'Troll', 'Blood Elf'],
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
