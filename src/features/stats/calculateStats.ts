import { applyRacialTraits } from '../../domain/character/applyRacialTraits'
import { getClassDefinition } from '../character/characterData'
import type { CharacterProfile } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { getBuffById } from '../../domain/buffs/sampleBuffs'
import { getConsumableById } from '../../domain/consumables/sampleConsumables'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { deriveItemArmor } from '../../domain/gear/armorValues'
import { getGemById, socketBonusIsActive } from '../../domain/gems/sampleGems'
import { metaGemIsActive } from '../../domain/gems/gemTypes'
import { effectUptime } from '../../domain/simulation/combatConstants'
import { addStats, applyStatMultipliers, scaleStats } from '../../domain/stats/statUtils'
import { type StatBlock } from './statsTypes'

export function calculateStats(
  character: CharacterProfile,
  gear: EquippedGear,
  activeBuffIds: readonly string[] = [],
  activeConsumableIds: readonly string[] = [],
  /**
   * Extra stats folded in *before* the primary-stat derivations below, so that adding e.g. Strength
   * correctly cascades into Attack Power. Used by the stat-weight engine to perturb one stat at a
   * time; leave undefined for a normal character calculation.
   */
  bonusStats?: Partial<StatBlock>,
): StatBlock {
  const classDefinition = getClassDefinition(character.className)
  let total: StatBlock = { ...classDefinition.baseStats }

  /*
   * Every gem equipped, gathered before anything is summed, because a meta gem's condition is about
   * the *whole set* rather than its own item — "requires at least 2 Red gems" counts red gems in
   * every socket you have. Nothing checked this before, so a meta's stats applied the moment it was
   * socketed whether or not the player had actually met the condition.
   */
  const socketedGems = Object.values(gear).flatMap((slot) =>
    slot.gemIds.map((gemId) => getGemById(gemId)).filter((gem): gem is NonNullable<typeof gem> => gem !== undefined),
  )

  Object.values(gear).forEach((slot) => {
    total = addStats(total, slot.item.stats)

    // Almost no armour piece in this catalog records its own armor, which left tank mitigation —
    // and therefore Effective Health — systematically understated. TBC armor is deterministic given
    // item level, armour class, slot and quality, so it is derived where an item does not state it.
    // An item's own recorded armor always wins, so sourcing one later simply replaces this.
    const derivedArmor = deriveItemArmor(slot.item)
    if (derivedArmor !== undefined) total = addStats(total, { armor: derivedArmor })

    // A proc or on-use contributes its stats only while active, so it is folded in at its average
    // uptime rather than at face value. Without this, trinkets price at nearly zero — an audit of
    // every catalogued trinket found not one is a pure stat stick, and two have no flat stats at all.
    const effect = slot.item.effect
    if (effect) {
      const uptime = effectUptime(effect.durationSeconds, effect.cooldownSeconds)
      total = addStats(total, scaleStats(effect.statBonus, uptime))
    }

    slot.gemIds.forEach((gemId) => {
      const gem = getGemById(gemId)
      if (!gem) return
      // A meta gem whose colour condition is unmet grants nothing at all — not a reduced amount.
      // This early return is also what gates the proc below: an inactive meta's proc is part of the
      // nothing it grants.
      if (gem.color === 'Meta' && !metaGemIsActive(gem, socketedGems)) return
      total = addStats(total, gem.stats)

      // Two meta gems are pure procs — Mystical Skyfire and Thundering Skyfire both carry no flat
      // stats at all, so without this they contribute exactly zero. Averaged over uptime the same
      // way an item's effect is, since it is the same ingest and the same approximation.
      if (gem.effect) {
        total = addStats(total, scaleStats(gem.effect.statBonus, effectUptime(gem.effect.durationSeconds, gem.effect.cooldownSeconds)))
      }
    })

    if (socketBonusIsActive(slot.item.sockets, slot.gemIds)) {
      total = addStats(total, slot.item.socketBonus)
    }

    total = addStats(total, getEnchantById(slot.enchantId)?.stats)
  })

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

  if (bonusStats) total = addStats(total, bonusStats)

  // Before the derivations below, so a percentage bonus to a primary stat (Gnome's Intellect,
  // Human's Spirit) reaches the spell power and healing power that stat feeds.
  total = applyRacialTraits(total, character.race, character.className, gear)

  total.attackPower += Math.round(total.strength * 2 + total.agility * 0.35)

  // Feral Attack Power adds 1:1 into attack power, but only while shapeshifted. The stat's own
  // wording is "in Cat, Bear, Dire Bear and Moonkin forms only", and of the specs this app models
  // only Feral both shapeshifts and reads attack power — a Moonkin has no use for it. Applying it
  // unconditionally would hand it to every class wearing a druid weapon.
  if (character.className === 'Druid' && character.spec === 'Feral') {
    total.attackPower += total.feralAttackPower
  }

  total.rangedAttackPower += Math.round(total.agility * 1.8)
  total.spellPower += Math.round(total.intellect * 0.8 + total.spirit * 0.15)
  total.healingPower += Math.round(total.intellect * 0.9 + total.spirit * 0.35)
  total.critRating += Math.round(total.agility * 0.1)
  total.spellCritRating += Math.round(total.intellect * 0.08)

  return total
}
