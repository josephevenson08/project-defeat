import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { enhancementShamanPhase2Bis } from './enhancementShamanPhase2'
import { elementalShamanPhase2Bis } from './elementalShamanPhase2'
import { restorationShamanPhase2Bis } from './restorationShamanPhase2'
import { armsWarriorPhase2Bis } from './armsWarriorPhase2'
import { furyWarriorPhase2Bis } from './furyWarriorPhase2'
import { protectionWarriorPhase2Bis } from './protectionWarriorPhase2'
import { holyPaladinPhase2Bis } from './holyPaladinPhase2'
import { protectionPaladinPhase2Bis } from './protectionPaladinPhase2'
import { retributionPaladinPhase2Bis } from './retributionPaladinPhase2'
import { disciplinePriestPhase2Bis } from './disciplinePriestPhase2'
import { holyPriestPhase2Bis } from './holyPriestPhase2'
import { shadowPriestPhase2Bis } from './shadowPriestPhase2'
import { balanceDruidPhase2Bis } from './balanceDruidPhase2'
import { feralDruidPhase2Bis } from './feralDruidPhase2'
import { restorationDruidPhase2Bis } from './restorationDruidPhase2'
import { beastMasteryHunterPhase2Bis } from './beastMasteryHunterPhase2'
import { marksmanshipHunterPhase2Bis } from './marksmanshipHunterPhase2'
import { survivalHunterPhase2Bis } from './survivalHunterPhase2'
import { arcaneMagePhase2Bis } from './arcaneMagePhase2'
import { fireMagePhase2Bis } from './fireMagePhase2'
import { frostMagePhase2Bis } from './frostMagePhase2'
import { assassinationRoguePhase2Bis } from './assassinationRoguePhase2'
import { combatRoguePhase2Bis } from './combatRoguePhase2'
import { subtletyRoguePhase2Bis } from './subtletyRoguePhase2'
import { afflictionWarlockPhase2Bis } from './afflictionWarlockPhase2'
import { demonologyWarlockPhase2Bis } from './demonologyWarlockPhase2'
import { destructionWarlockPhase2Bis } from './destructionWarlockPhase2'

export const bisLists = [
  enhancementShamanPhase2Bis,
  elementalShamanPhase2Bis,
  restorationShamanPhase2Bis,
  armsWarriorPhase2Bis,
  furyWarriorPhase2Bis,
  protectionWarriorPhase2Bis,
  holyPaladinPhase2Bis,
  protectionPaladinPhase2Bis,
  retributionPaladinPhase2Bis,
  disciplinePriestPhase2Bis,
  holyPriestPhase2Bis,
  shadowPriestPhase2Bis,
  balanceDruidPhase2Bis,
  feralDruidPhase2Bis,
  restorationDruidPhase2Bis,
  beastMasteryHunterPhase2Bis,
  marksmanshipHunterPhase2Bis,
  survivalHunterPhase2Bis,
  arcaneMagePhase2Bis,
  fireMagePhase2Bis,
  frostMagePhase2Bis,
  assassinationRoguePhase2Bis,
  combatRoguePhase2Bis,
  subtletyRoguePhase2Bis,
  afflictionWarlockPhase2Bis,
  demonologyWarlockPhase2Bis,
  destructionWarlockPhase2Bis,
] as const

export function getBisListForSpec(className: TbcClass, spec: TbcSpec) {
  return bisLists.find((list) => list.className === className && list.spec === spec)
}
