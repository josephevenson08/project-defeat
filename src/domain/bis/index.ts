export type { BisList, RankedGearEntry } from './bisTypes'
export { bisLists, getBisListForSpec, requireBisList } from './bisLists'

import { requireBisList } from './bisLists'

/**
 * Per-spec named exports.
 *
 * These used to be 27 hand-written files. The lists are now generated from the Wowhead guides (see
 * `bisLists.ts`), but the named exports are kept because they read far better at a call site than
 * `getBisListForSpec('Shaman', 'Enhancement')`, and because they fail loudly at import if a spec ever
 * drops out of the ingested data.
 */

export const armsWarriorPhase2Bis = requireBisList('Warrior', 'Arms')
export const furyWarriorPhase2Bis = requireBisList('Warrior', 'Fury')
export const protectionWarriorPhase2Bis = requireBisList('Warrior', 'Protection')

export const holyPaladinPhase2Bis = requireBisList('Paladin', 'Holy')
export const protectionPaladinPhase2Bis = requireBisList('Paladin', 'Protection')
export const retributionPaladinPhase2Bis = requireBisList('Paladin', 'Retribution')

export const beastMasteryHunterPhase2Bis = requireBisList('Hunter', 'Beast Mastery')
export const marksmanshipHunterPhase2Bis = requireBisList('Hunter', 'Marksmanship')
export const survivalHunterPhase2Bis = requireBisList('Hunter', 'Survival')

export const assassinationRoguePhase2Bis = requireBisList('Rogue', 'Assassination')
export const combatRoguePhase2Bis = requireBisList('Rogue', 'Combat')
export const subtletyRoguePhase2Bis = requireBisList('Rogue', 'Subtlety')

export const disciplinePriestPhase2Bis = requireBisList('Priest', 'Discipline')
export const holyPriestPhase2Bis = requireBisList('Priest', 'Holy')
export const shadowPriestPhase2Bis = requireBisList('Priest', 'Shadow')

export const elementalShamanPhase2Bis = requireBisList('Shaman', 'Elemental')
export const enhancementShamanPhase2Bis = requireBisList('Shaman', 'Enhancement')
export const restorationShamanPhase2Bis = requireBisList('Shaman', 'Restoration')

export const arcaneMagePhase2Bis = requireBisList('Mage', 'Arcane')
export const fireMagePhase2Bis = requireBisList('Mage', 'Fire')
export const frostMagePhase2Bis = requireBisList('Mage', 'Frost')

export const afflictionWarlockPhase2Bis = requireBisList('Warlock', 'Affliction')
export const demonologyWarlockPhase2Bis = requireBisList('Warlock', 'Demonology')
export const destructionWarlockPhase2Bis = requireBisList('Warlock', 'Destruction')

export const balanceDruidPhase2Bis = requireBisList('Druid', 'Balance')
export const feralDruidPhase2Bis = requireBisList('Druid', 'Feral')
export const restorationDruidPhase2Bis = requireBisList('Druid', 'Restoration')
