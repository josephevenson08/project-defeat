import type { CharacterProfile } from '../character/characterTypes'
import { getClassDefinition } from '../character/characterData'
import type { EquippedGear } from '../gear/gearTypes'
import { emptyStats, type StatBlock } from './statsTypes'

export function calculateStats(character: CharacterProfile, gear: EquippedGear): StatBlock {
  const classDefinition = getClassDefinition(character.className)
  const total: StatBlock = { ...emptyStats, ...classDefinition.baseStats }

  Object.values(gear).forEach((item) => {
    Object.entries(item.stats).forEach(([stat, value]) => {
      total[stat as keyof StatBlock] += value ?? 0
    })
  })

  total.attackPower += Math.round(total.strength * 2 + total.agility * 0.4)
  total.spellPower += Math.round(total.intellect * 1.5 + total.spirit * 0.2)
  total.critRating += Math.round(total.agility * 0.12)
  total.hitRating += character.spec === 'Fury' || character.spec === 'Destruction' ? 8 : 0

  return total
}
