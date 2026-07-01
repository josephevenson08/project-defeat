import type { Faction, TbcRace } from './characterTypes'

export const racesByFaction: Record<Faction, readonly TbcRace[]> = {
  Alliance: ['Human', 'Dwarf', 'Night Elf', 'Gnome', 'Draenei'],
  Horde: ['Orc', 'Undead', 'Tauren', 'Troll', 'Blood Elf'],
}

export const factions = Object.keys(racesByFaction) as Faction[]
