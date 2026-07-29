import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { calculateStats } from '../stats/calculateStats'
import { statLabels, type StatBlock } from '../stats/statsTypes'
import { calculateSimulation } from './calculateSimulation'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'

/**
 * How much of a stat to add when probing its value. Large enough that the resulting metric change
 * clears the simulation's 1-decimal rounding (a +1 probe would often round away to zero), small
 * enough to stay in a roughly linear part of the curve. Results are divided back down to per-point.
 */
const PROBE_AMOUNT = 100

/** Stats worth probing for each role, in rough "player cares about this" order. */
const STATS_BY_ROLE: Record<CharacterRole, readonly (keyof StatBlock)[]> = {
  'Physical DPS': ['strength', 'agility', 'attackPower', 'rangedAttackPower', 'critRating', 'hitRating', 'expertiseRating', 'hasteRating', 'armorPenetration'],
  'Caster DPS': ['intellect', 'spirit', 'spellPower', 'spellCritRating', 'spellHitRating', 'spellHasteRating'],
  Healer: ['intellect', 'spirit', 'healingPower', 'spellCritRating', 'spellHasteRating', 'mp5'],
  Tank: ['stamina', 'armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'agility'],
}

/**
 * Stats the simulation engine currently reads for each role, either directly or via a derived stat.
 * Anything probed but absent here scores zero because the model doesn't consider it *yet* — which is
 * a very different statement from "this stat is worthless", so the UI must not conflate the two.
 */
const STATS_CONSUMED_BY_ROLE: Record<CharacterRole, ReadonlySet<keyof StatBlock>> = {
  'Physical DPS': new Set<keyof StatBlock>(['strength', 'agility', 'attackPower', 'rangedAttackPower', 'critRating', 'hitRating', 'expertiseRating']),
  'Caster DPS': new Set<keyof StatBlock>(['intellect', 'spirit', 'spellPower', 'spellCritRating', 'spellHitRating', 'spellHasteRating']),
  Healer: new Set<keyof StatBlock>(['intellect', 'spirit', 'healingPower', 'spellCritRating', 'spellHasteRating']),
  Tank: new Set<keyof StatBlock>(['stamina', 'armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'agility']),
}

/** The stat each role's weights are normalized against, so 1.0 means "worth the same as one point of this". */
const REFERENCE_STAT_BY_ROLE: Record<CharacterRole, keyof StatBlock> = {
  'Physical DPS': 'attackPower',
  'Caster DPS': 'spellPower',
  Healer: 'healingPower',
  Tank: 'stamina',
}

const STAT_LABEL_LOOKUP = new Map<keyof StatBlock, string>(statLabels)

function labelFor(stat: keyof StatBlock) {
  return STAT_LABEL_LOOKUP.get(stat) ?? stat
}

export type StatWeightEntry = {
  stat: keyof StatBlock
  label: string
  /** Change in the role's metric per single point of this stat. */
  perPoint: number
  /** `perPoint` normalized so the reference stat equals 1. */
  relative: number
  /** True when the simulation doesn't read this stat yet, so a 0 here means "unmodeled", not "worthless". */
  notModeledYet: boolean
}

export type StatWeightsResult = {
  role: CharacterRole
  metricLabel: string
  baselineScore: number
  referenceStat: keyof StatBlock
  referenceLabel: string
  probeAmount: number
  entries: readonly StatWeightEntry[]
}

/**
 * Estimates each stat's marginal value by adding a fixed amount of it, re-running the full
 * stat -> simulation pipeline, and measuring how much the role's headline metric moved. This is the
 * same idea as an EP/stat-weight table in WoWSims, and it inherits every limitation of the
 * simulation it probes: a stat the engine ignores scores zero, and a stat already past its cap
 * (e.g. hit rating at the cap) correctly scores zero because the extra points genuinely do nothing.
 */
export function calculateStatWeights(
  character: CharacterProfile,
  gear: EquippedGear,
  role: CharacterRole,
  activeBuffIds: readonly string[] = [],
  activeConsumableIds: readonly string[] = [],
  activeTargetDebuffIds: readonly string[] = [],
  target?: SimulationTarget,
): StatWeightsResult {
  const runScore = (bonusStats?: Partial<StatBlock>) => {
    const stats = calculateStats(character, gear, activeBuffIds, activeConsumableIds, bonusStats)
    return calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, target)
  }

  const baseline = runScore()
  const consumed = STATS_CONSUMED_BY_ROLE[role]

  const rawEntries = STATS_BY_ROLE[role].map((stat) => {
    const probed = runScore({ [stat]: PROBE_AMOUNT })
    return {
      stat,
      label: labelFor(stat),
      perPoint: (probed.score - baseline.score) / PROBE_AMOUNT,
      notModeledYet: !consumed.has(stat),
    }
  })

  const referenceStat = REFERENCE_STAT_BY_ROLE[role]
  const referencePerPoint = rawEntries.find((entry) => entry.stat === referenceStat)?.perPoint ?? 0

  const entries = rawEntries
    .map((entry) => ({
      ...entry,
      relative: referencePerPoint === 0 ? 0 : entry.perPoint / referencePerPoint,
    }))
    .sort((a, b) => b.relative - a.relative)

  return {
    role,
    metricLabel: baseline.metricLabel,
    baselineScore: baseline.score,
    referenceStat,
    referenceLabel: labelFor(referenceStat),
    probeAmount: PROBE_AMOUNT,
    entries,
  }
}
