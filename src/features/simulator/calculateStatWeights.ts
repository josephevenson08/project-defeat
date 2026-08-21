import { deriveTalentModifiers } from '../../domain/talents/talentModifiers'
import type { TalentPoints } from '../../domain/talents/talentTypes'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { calculateStats } from '../stats/calculateStats'
import { statLabels, type StatBlock } from '../stats/statsTypes'
import { calculateSimulation } from './calculateSimulation'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'

/**
 * How much of a stat to add when probing its value. Large enough that the resulting metric change
 * large enough to stay well clear of floating-point noise while small
 * enough to stay in a roughly linear part of the curve. Results are divided back down to per-point.
 */
const PROBE_AMOUNT = 100

/** Melee physical DPS. Ranged attack power is deliberately absent — the melee path never reads it. */
const MELEE_DPS_STATS: readonly (keyof StatBlock)[] = [
  'strength',
  'agility',
  'attackPower',
  'critRating',
  'hitRating',
  'expertiseRating',
  'hasteRating',
  'armorPenetration',
]

/**
 * Hunters run the ranged attack table instead, which reads ranged attack power and never consults
 * Strength, melee attack power, or Expertise — so probing those would only ever print a misleading
 * row of zeroes.
 */
const RANGED_DPS_STATS: readonly (keyof StatBlock)[] = ['agility', 'rangedAttackPower', 'critRating', 'hitRating', 'hasteRating', 'armorPenetration']

/**
 * Feral reads everything melee does plus Feral Attack Power, which is only worth anything to a
 * shapeshifted druid. It stays out of `MELEE_DPS_STATS` deliberately: for a Warrior it is not an
 * unmodeled stat, it is a genuinely worthless one, and probing it there would print a zero the UI
 * would then explain as "not modeled yet".
 */
const FERAL_DPS_STATS: readonly (keyof StatBlock)[] = [...MELEE_DPS_STATS, 'feralAttackPower']

const CASTER_DPS_STATS: readonly (keyof StatBlock)[] = ['intellect', 'spirit', 'spellPower', 'spellCritRating', 'spellHitRating', 'spellHasteRating']
const HEALER_STATS: readonly (keyof StatBlock)[] = ['intellect', 'spirit', 'healingPower', 'spellCritRating', 'spellHasteRating', 'mp5']
const TANK_STATS: readonly (keyof StatBlock)[] = ['stamina', 'armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'agility']

/**
 * Stats the simulation engine currently reads, either directly or via a derived stat. Anything
 * probed but absent here scores zero because the model doesn't consider it *yet* — a very different
 * statement from "this stat is worthless in TBC", so the UI must not conflate the two.
 */
const CONSUMED_STATS: Record<CharacterRole, ReadonlySet<keyof StatBlock>> = {
  'Physical DPS': new Set<keyof StatBlock>([
    'strength',
    'agility',
    'attackPower',
    'rangedAttackPower',
    'feralAttackPower',
    'critRating',
    'hitRating',
    'expertiseRating',
    /*
     * Melee haste has been read since white damage started scaling by `(1 + haste)`; this list was
     * simply never updated, so the panel kept telling players a modelled stat was unmodelled.
     *
     * That mattered more than a stale label usually does. Probed, haste is worth **0.059 per point**
     * on the default Fury set — above Agility and close to Expertise — so the panel was hiding a
     * genuinely strong stat behind "the engine doesn't read this". Not to be confused with the
     * separate, still-true fact that Phase 2 gear carries almost no haste to *find*: what a point is
     * worth and how many points exist are different questions, and only the second one is bleak.
     */
    'hasteRating',
  ]),
  'Caster DPS': new Set<keyof StatBlock>(['intellect', 'spirit', 'spellPower', 'spellCritRating', 'spellHitRating', 'spellHasteRating']),
  Healer: new Set<keyof StatBlock>(['intellect', 'spirit', 'healingPower', 'spellCritRating', 'spellHasteRating']),
  Tank: new Set<keyof StatBlock>(['stamina', 'armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'agility']),
}

function statsToProbe(role: CharacterRole, character: CharacterProfile): readonly (keyof StatBlock)[] {
  if (role === 'Caster DPS') return CASTER_DPS_STATS
  if (role === 'Healer') return HEALER_STATS
  if (role === 'Tank') return TANK_STATS
  if (character.className === 'Hunter') return RANGED_DPS_STATS
  if (character.className === 'Druid' && character.spec === 'Feral') return FERAL_DPS_STATS
  return MELEE_DPS_STATS
}

/** The stat each role's weights are normalized against, so 1.0 means "worth the same as one point of this". */
const REFERENCE_STAT_BY_ROLE: Record<CharacterRole, keyof StatBlock> = {
  'Physical DPS': 'attackPower',
  'Caster DPS': 'spellPower',
  Healer: 'healingPower',
  Tank: 'stamina',
}

function referenceStatFor(role: CharacterRole, character: CharacterProfile): keyof StatBlock {
  if (role === 'Physical DPS' && character.className === 'Hunter') return 'rangedAttackPower'
  return REFERENCE_STAT_BY_ROLE[role]
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
  talentPoints: TalentPoints = {},
): StatWeightsResult {
  // Derived once rather than per probe: the weights run the whole simulation a dozen times over, and
  // the modifiers depend only on the point allocation.
  const talents = deriveTalentModifiers(talentPoints)

  const runScore = (bonusStats?: Partial<StatBlock>) => {
    const stats = calculateStats(character, gear, activeBuffIds, activeConsumableIds, bonusStats, talents)
    return calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, target, talentPoints)
  }

  const baseline = runScore()
  const consumed = CONSUMED_STATS[role]

  const rawEntries = statsToProbe(role, character).map((stat) => {
    const probed = runScore({ [stat]: PROBE_AMOUNT })
    return {
      stat,
      label: labelFor(stat),
      perPoint: (probed.scoreExact - baseline.scoreExact) / PROBE_AMOUNT,
      notModeledYet: !consumed.has(stat),
    }
  })

  const referenceStat = referenceStatFor(role, character)
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
