import { applyRacialTraits } from '../../domain/character/applyRacialTraits'
import { applyAttributeConversions } from '../../domain/character/attributeConversions'
import { getBaseStats } from '../../domain/character/baseStats'
import type { CharacterProfile } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { getBuffById } from '../../domain/buffs/sampleBuffs'
import { getConsumableById } from '../../domain/consumables/sampleConsumables'
import { sumGearStats } from '../../domain/gear/gearStats'
import { addStats, applyStatMultipliers } from '../../domain/stats/statUtils'
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
   * The gear's own contribution, summed on its own so its armour can be multiplied alone. Toughness
   * and Thick Hide raise "the armor value from your items" and nothing else — armour from Agility,
   * buffs or consumables is untouched, and folding the multiplier into the total would quietly
   * overpay every tank. `sumGearStats` is also what the Gear tab's sheet shows as "From this gear".
   */
  const fromGear = sumGearStats(gear)
  total = addStats(total, { ...fromGear, armor: fromGear.armor * talents.itemArmorMultiplier })

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
