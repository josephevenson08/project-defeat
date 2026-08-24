import { applyRacialTraits } from '../../domain/character/applyRacialTraits'
import { applyAttributeConversions } from '../../domain/character/attributeConversions'
import { getBaseStats } from '../../domain/character/baseStats'
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
import { noTalentModifiers, type TalentModifiers } from '../../domain/talents/talentModifiers'
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
  /**
   * What the talent build changes about the character's *stats*, as opposed to its damage.
   *
   * Defaulted, and the default is the identity, so an empty tree reproduces the untalented totals
   * exactly — the invariant a test pins. Only three of the fields reach here: the rest of
   * `TalentModifiers` describes damage, rage and attack-table effects that are not stats at all.
   */
  talents: TalentModifiers = noTalentModifiers,
): StatBlock {
  let total: StatBlock = getBaseStats(character.className, character.race)

  /*
   * Where armour stood before any gear was counted, so the gear loop's contribution can be
   * multiplied on its own afterwards. Toughness and Thick Hide raise "the armor value from your
   * items" and nothing else — armour from Agility, buffs or consumables is untouched, and folding
   * the multiplier into the total would quietly overpay every tank.
   */
  const armorBeforeGear = total.armor

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

  total.armor = armorBeforeGear + (total.armor - armorBeforeGear) * talents.itemArmorMultiplier

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

  /*
   * Talent stat multipliers land beside the racials, and for the same reason: both multiply a
   * finished total, and both have to be in before the conversions below read it — Arcane Mind has to
   * raise Intellect before Mind Mastery turns Intellect into spell power. Their order relative to
   * each other does not matter, since multiplication commutes.
   *
   * `statFactors` holds the factor itself rather than the `+0.06` fraction `applyStatMultipliers`
   * takes, so it is applied directly.
   */
  for (const [stat, factor] of Object.entries(talents.statFactors)) {
    total[stat as keyof StatBlock] *= factor
  }

  /*
   * Attributes become attack power, armor and ratings last, once every source above has been summed.
   *
   * The rates are class-specific and sourced — see `attributeConversions.ts`, which replaced six
   * uncited lines that had been the app's only conversions. Two of those lines granted spell power
   * and healing power for Intellect and Spirit, which TBC does not do at any point without a talent;
   * they were inventing roughly half of every caster's spell power on the always-visible rail.
   *
   * Feral Attack Power is folded in here too rather than by hand. It adds 1:1 into attack power but
   * only while shapeshifted — the stat's own wording is "in Cat, Bear, Dire Bear and Moonkin forms
   * only" — so it arrives as part of the cat-form block, gated on the same spec check as before.
   */
  total = applyAttributeConversions(total, character.className, character.spec, talents.statConversions)

  /*
   * Buffs that multiply a **derived** stat, applied last because that is the only place the number
   * they multiply is finished.
   *
   * Unleashed Rage is why this exists: +10% attack power, where attack power is mostly Strength and
   * Agility converted a few lines above. Applied with the other buff multipliers it would have
   * caught only the flat attack power from gear and missed the larger derived half — which is what
   * its `notModelled` note said, and it was right.
   */
  activeBuffIds.forEach((id) => {
    const buff = getBuffById(id)
    if (buff?.statMultipliersAfterConversion) {
      total = applyStatMultipliers(total, buff.statMultipliersAfterConversion)
    }
  })

  return total
}
