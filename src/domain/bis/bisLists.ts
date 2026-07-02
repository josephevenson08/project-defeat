import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { enhancementShamanPhase2Bis } from './enhancementShamanPhase2'
import { armsWarriorPhase2Bis } from './armsWarriorPhase2'
import { furyWarriorPhase2Bis } from './furyWarriorPhase2'
import { protectionWarriorPhase2Bis } from './protectionWarriorPhase2'

export const bisLists = [enhancementShamanPhase2Bis, armsWarriorPhase2Bis, furyWarriorPhase2Bis, protectionWarriorPhase2Bis] as const

export function getBisListForSpec(className: TbcClass, spec: TbcSpec) {
  return bisLists.find((list) => list.className === className && list.spec === spec)
}
