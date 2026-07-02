import type { TbcClass, TbcSpec } from '../character/characterTypes'
import { enhancementShamanPhase2Bis } from './enhancementShamanPhase2'
import { elementalShamanPhase2Bis } from './elementalShamanPhase2'
import { restorationShamanPhase2Bis } from './restorationShamanPhase2'

export const bisLists = [enhancementShamanPhase2Bis, elementalShamanPhase2Bis, restorationShamanPhase2Bis] as const

export function getBisListForSpec(className: TbcClass, spec: TbcSpec) {
  return bisLists.find((list) => list.className === className && list.spec === spec)
}
