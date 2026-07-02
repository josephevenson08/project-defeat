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
] as const

export function getBisListForSpec(className: TbcClass, spec: TbcSpec) {
  return bisLists.find((list) => list.className === className && list.spec === spec)
}
