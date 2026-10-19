import { getEnchantById } from '../enchants/sampleEnchants'
import { getGemById, socketBonusIsActive } from '../gems/sampleGems'
import { metaGemIsActive } from '../gems/gemTypes'
import { effectUptime } from '../simulation/combatConstants'
import { addStats, createEmptyStats, scaleStats } from '../stats/statUtils'
import type { StatBlock } from '../stats/statTypes'
import { deriveItemArmor } from './armorValues'
import type { EquippedGear } from './itemTypes'

/**
 * What the gear alone adds: every item's stats and armour, its gems (a meta only while its condition
 * holds), its socket bonus when the gems match, its enchant, and procs and on-use effects at their
 * average uptime. No base stats, race, talents or buffs.
 *
 * `calculateStats` adds this to the character's base stats, and the Gear tab's character sheet shows
 * it as "From this gear", so the sheet and the stat bar count an item the same way.
 */
export function sumGearStats(gear: EquippedGear): StatBlock {
  let total = createEmptyStats()

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

  return total
}
