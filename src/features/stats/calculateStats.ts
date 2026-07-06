import { getClassDefinition } from '../character/characterData'
import type { CharacterProfile } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { getBuffById } from '../../domain/buffs/sampleBuffs'
import { getConsumableById } from '../../domain/consumables/sampleConsumables'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getGemById } from '../../domain/gems/sampleGems'
import { addStats, applyStatMultipliers } from '../../domain/stats/statUtils'
import type { SocketColor } from '../../domain/gear/itemTypes'
import { type StatBlock } from './statsTypes'

function socketBonusIsActive(sockets: readonly SocketColor[] = [], gemIds: readonly string[]) {
  if (sockets.length === 0) return false

  return sockets.every((socket, index) => {
    const gem = getGemById(gemIds[index])
    if (!gem) return false
    if (socket === 'Meta') return gem.color === 'Meta'
    return gem.color === socket
  })
}

export function calculateStats(
  character: CharacterProfile,
  gear: EquippedGear,
  activeBuffIds: readonly string[] = [],
  activeConsumableIds: readonly string[] = [],
): StatBlock {
  const classDefinition = getClassDefinition(character.className)
  let total: StatBlock = { ...classDefinition.baseStats }

  Object.values(gear).forEach((slot) => {
    total = addStats(total, slot.item.stats)

    slot.gemIds.forEach((gemId) => {
      const gem = getGemById(gemId)
      if (gem) total = addStats(total, gem.stats)
    })

    if (socketBonusIsActive(slot.item.sockets, slot.gemIds)) {
      total = addStats(total, slot.item.socketBonus)
    }

    total = addStats(total, getEnchantById(slot.enchantId)?.stats)
  })

  total.attackPower += Math.round(total.strength * 2 + total.agility * 0.35)
  total.rangedAttackPower += Math.round(total.agility * 1.8)
  total.spellPower += Math.round(total.intellect * 0.8 + total.spirit * 0.15)
  total.healingPower += Math.round(total.intellect * 0.9 + total.spirit * 0.35)
  total.critRating += Math.round(total.agility * 0.1)
  total.spellCritRating += Math.round(total.intellect * 0.08)

  activeBuffIds.forEach((id) => {
    const buff = getBuffById(id)
    if (!buff) return
    total = addStats(total, buff.stats)
    total = applyStatMultipliers(total, buff.statMultipliers)
  })

  activeConsumableIds.forEach((id) => {
    const consumable = getConsumableById(id)
    if (consumable) total = addStats(total, consumable.stats)
  })

  return total
}
