import rawBaseStats from './baseStats.json' with { type: 'json' }
import type { StatBlock } from '../stats/statTypes'
import { addStats } from '../stats/statUtils'
import type { TbcClass, TbcSpec } from './characterTypes'

export type AttributeConversion = {
  from: keyof StatBlock
  to: keyof StatBlock
  /** How much of `to` one point of `from` grants. Ratings are already in rating, not percent. */
  perPoint: number
  /** The upstream expression this was read from, so the rate stays auditable. */
  upstream: string
}

/**
 * How attributes turn into other stats in TBC.
 *
 * This replaces six hand-written lines that were the app's only attribute conversions and were
 * uncited. Three of them were not TBC mechanics:
 *
 * - **Intellect and Spirit do not grant spell power or healing power.** Every Intellect-to-spell-power
 *   conversion in TBC is talent-gated (Lunar Guidance, Mind Mastery) and every Spirit one is
 *   Spiritual Guidance. There is no baseline, so there is no entry for one here. The old
 *   `intellect * 0.8` was inventing 46% of a Fire Mage's spell power.
 * - **The rates are class-specific.** Strength gives 2 attack power to a Warrior and 1 to a Rogue.
 *   Agility gives melee attack power to Rogues and cat-form Druids only, *ranged* attack power to
 *   Hunters, and nothing to anyone else — the old flat `agility * 0.35` matched no class.
 * - **Agility to crit is a per-class divisor**, so the old `agility * 0.1` understated melee crit by
 *   five to seven times.
 *
 * **A class missing a conversion here is missing it upstream, and that is not the same as the game
 * lacking it.** wowsims implements what it needs to simulate: a Priest has no Strength-to-attack-power
 * entry because a Priest's melee swing is irrelevant to healing output, and a Rogue has no
 * Intellect-to-spell-crit entry for the same reason. Every one of those gaps falls in a row
 * `statRelevance.ts` already hides for that spec, so none of them is visible by default — but they
 * are gaps in the source, not statements about TBC, and filling them in by guesswork would be
 * exactly the invention this file exists to remove.
 */
const CLASS_CONVERSIONS = rawBaseStats.conversions as Partial<Record<TbcClass, readonly AttributeConversion[]>>

/** Agility to Armor, 2 a point. Applies to every class, and nothing in this app modelled it before. */
const UNIVERSAL_CONVERSIONS = rawBaseStats.universalConversions as readonly AttributeConversion[]

/**
 * Cat form, which is how this app already models Feral — the same reasoning that gates
 * `feralAttackPower` on the spec. Read whole rather than in part: upstream writes it as one block of
 * a flat `(2 x Level)` attack power plus two per-point rates, so taking the rates and dropping the
 * flat 140 would understate every Feral druid by exactly that.
 */
const CAT_FORM_CONVERSIONS = rawBaseStats.druidCatFormConversions as readonly AttributeConversion[]
const CAT_FORM_FLAT_STATS = rawBaseStats.druidCatFormFlatStats as Partial<StatBlock>

function isCatForm(className: TbcClass, spec: TbcSpec) {
  return className === 'Druid' && spec === 'Feral'
}

/** Every conversion that applies to this character, for tests and for disclosing the rates in the UI. */
export function getAttributeConversions(className: TbcClass, spec: TbcSpec): readonly AttributeConversion[] {
  return [
    ...UNIVERSAL_CONVERSIONS,
    ...(CLASS_CONVERSIONS[className] ?? []),
    ...(isCatForm(className, spec) ? CAT_FORM_CONVERSIONS : []),
  ]
}

/**
 * Folds every conversion into a stat total.
 *
 * **Sources are read from the totals passed in, never from the running result**, so the conversions
 * cannot cascade into one another. Nothing upstream depends on that today — every destination
 * (attack power, armor, the ratings) is terminal — but reading the running result would make the
 * output depend on the order the ingest happened to emit, which is not something this should be
 * sensitive to.
 */
export function applyAttributeConversions(total: StatBlock, className: TbcClass, spec: TbcSpec): StatBlock {
  const next = { ...total }

  for (const conversion of getAttributeConversions(className, spec)) {
    next[conversion.to] += total[conversion.from] * conversion.perPoint
  }

  return isCatForm(className, spec) ? addStats(next, CAT_FORM_FLAT_STATS) : next
}
