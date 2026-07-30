import { getSignatureAbility } from '../../domain/abilities'
import type { SignatureAbility } from '../../domain/abilities'
import { getTargetDebuffById } from '../../domain/buffs/sampleTargetDebuffs'
import { buildRangedAttackTable, buildWhiteAttackTable, computeGlanceDamageRange, computeSkillDiff } from '../../domain/simulation/attackTable'
import {
  EXPERTISE_RATING_PER_SKILL_POINT,
  MELEE_CRIT_DAMAGE_MULTIPLIER,
  RATING_PER_PERCENT,
  SPELL_CRIT_DAMAGE_MULTIPLIER,
  ratingToFraction,
} from '../../domain/simulation/combatConstants'
import { attackPowerToWhiteDps, computeArmorMitigation, directSpellCoefficient, weaponDiceToWhiteDps } from '../../domain/simulation/damageFormulas'
import { defaultSimulationTarget } from '../../domain/simulation/sampleEncounters'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import { computeSpellCritChance, computeSpellHitChance } from '../../domain/simulation/spellTable'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import type { StatBlock } from '../stats/statsTypes'
import type { SimulationBreakdownEntry, SimulationResult } from './simulationTypes'

const PLAYER_LEVEL = 70
const DUAL_WIELD_WEAPON_TYPES = new Set(['Axe', 'Dagger', 'Fist Weapon', 'Mace', 'Sword'])
const GENERIC_NUKE_CAST_TIME = 3
const GENERIC_HEAL_CAST_TIME = 2.5

/**
 * The cast profile the spell-side estimates actually run on: either a spec's real signature ability
 * or the generic placeholder cast it replaces.
 *
 * `castTimeSeconds` is what haste divides into and what determines casts-per-second.
 * `coefficient` is the spell-power/healing-power scaling for the modeled component — read from the
 * ability's researched value where one exists rather than recomputed, because several TBC
 * coefficients are hardcoded exceptions that the castTime/3.5 formula gets wrong (Fireball 1.0,
 * Frostbolt 0.8143).
 * `baseAmount` is the ability's flat base damage/healing before scaling — previously absent
 * entirely, which is why the old summaries said "scales from spell power only".
 */
type CastProfile = {
  label: string
  castTimeSeconds: number
  coefficient: number
  baseAmount: number
  /** Undefined for the generic fallback, so the summary can say so honestly. */
  ability?: SignatureAbility
}

function averageBaseAmount(ability: SignatureAbility) {
  if (!ability.baseAmount) return 0
  return (ability.baseAmount.min + ability.baseAmount.max) / 2
}

/**
 * A signature ability only replaces the placeholder when it is actually a cast the spell-side
 * estimate can model. Physical specials (Bloodthirst, Mutilate, Steady Shot) scale off attack power
 * and weapon damage, so they belong to the physical path, and a spec whose signature ability is one
 * of those keeps the generic cast here rather than being modeled wrongly.
 */
function isSpellCast(ability: SignatureAbility) {
  return (
    ability.effectType === 'Direct Damage' ||
    ability.effectType === 'DoT' ||
    ability.effectType === 'Direct Heal' ||
    ability.effectType === 'HoT'
  )
}

function resolveCastProfile(character: CharacterProfile, fallbackCastTime: number): CastProfile {
  const ability = getSignatureAbility(character.className, character.spec)

  if (!ability || !isSpellCast(ability)) {
    return {
      label: `generic ${fallbackCastTime}s cast`,
      castTimeSeconds: fallbackCastTime,
      coefficient: directSpellCoefficient(fallbackCastTime),
      baseAmount: 0,
    }
  }

  // Periodic effects deliver over a duration rather than per cast, so the cast-time divisor for a
  // DoT/HoT is its channel/duration rather than its cast time; an instant DoT would otherwise
  // divide by zero and report infinite casts per second.
  const periodicDuration = ability.periodic?.durationSeconds
  const castTimeSeconds =
    ability.castTimeSeconds > 0
      ? ability.castTimeSeconds
      : (ability.effectType === 'DoT' || ability.effectType === 'HoT') && periodicDuration
        ? periodicDuration
        : ability.gcdSeconds

  const periodicTotal = ability.periodic?.totalBaseAmount ?? 0
  const baseAmount =
    ability.effectType === 'DoT' || ability.effectType === 'HoT'
      ? periodicTotal || averageBaseAmount(ability)
      : averageBaseAmount(ability)

  return {
    label: `${ability.name}${ability.rank ? ` (rank ${ability.rank})` : ''}`,
    castTimeSeconds,
    coefficient: ability.scaling.spellPowerCoefficient ?? directSpellCoefficient(castTimeSeconds),
    baseAmount,
    ability,
  }
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

function toPercent(fraction: number) {
  return round(fraction * 100)
}

function isDualWield(gear: EquippedGear) {
  const offHand = gear['Off Hand']?.item
  return Boolean(offHand?.weaponType && DUAL_WIELD_WEAPON_TYPES.has(offHand.weaponType))
}

function aggregateTargetDebuffs(activeTargetDebuffIds: readonly string[]) {
  return activeTargetDebuffIds.reduce(
    (totals, id) => {
      const debuff = getTargetDebuffById(id)
      if (!debuff) return totals
      return {
        armorReductionPercent: totals.armorReductionPercent + (debuff.armorReductionPercent ?? 0),
        physicalCritTakenBonus: totals.physicalCritTakenBonus + (debuff.physicalCritTakenBonus ?? 0),
        spellCritTakenBonus: totals.spellCritTakenBonus + (debuff.spellCritTakenBonus ?? 0),
        spellDamageTakenMultiplier: totals.spellDamageTakenMultiplier + (debuff.spellDamageTakenMultiplier ?? 0),
      }
    },
    { armorReductionPercent: 0, physicalCritTakenBonus: 0, spellCritTakenBonus: 0, spellDamageTakenMultiplier: 0 },
  )
}

function calculatePhysicalDps(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  target: SimulationTarget,
  debuffs: ReturnType<typeof aggregateTargetDebuffs>,
): SimulationResult {
  const skillDiff = computeSkillDiff(target.level)
  const targetArmor = Math.max(0, target.armor * (1 - debuffs.armorReductionPercent))
  const armorMitigation = computeArmorMitigation(targetArmor, PLAYER_LEVEL)
  const rawCritChance = ratingToFraction(stats.critRating, RATING_PER_PERCENT.meleeCrit) + debuffs.physicalCritTakenBonus

  let breakdown: SimulationBreakdownEntry[]
  let rawDps: number

  if (character.className === 'Hunter') {
    const rangedItem = gear['Ranged']?.item
    const missReduction = ratingToFraction(stats.hitRating, RATING_PER_PERCENT.meleeHit)
    const table = buildRangedAttackTable({ skillDiff, missReduction, rawCritChance })
    const effectiveMultiplier = table.hit + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER
    const weaponDps = weaponDiceToWhiteDps(rangedItem?.weaponDamageMin, rangedItem?.weaponDamageMax, rangedItem?.weaponSpeed)
    rawDps = (weaponDps + attackPowerToWhiteDps(stats.rangedAttackPower)) * effectiveMultiplier
    breakdown = [
      { label: 'Attack power', value: round(attackPowerToWhiteDps(stats.rangedAttackPower)) },
      { label: 'Weapon damage', value: round(weaponDps) },
      { label: 'Hit chance', value: toPercent(table.hit) },
      { label: 'Crit chance', value: toPercent(table.crit) },
      { label: 'Miss chance', value: toPercent(table.miss) },
      { label: 'Armor mitigation', value: toPercent(armorMitigation) },
    ]
  } else {
    const mainHandItem = gear['Main Hand']?.item
    const offHandItem = gear['Off Hand']?.item
    const dualWield = isDualWield(gear)
    const missReduction = ratingToFraction(stats.hitRating, RATING_PER_PERCENT.meleeHit)
    const expertiseSkillPoints = stats.expertiseRating / EXPERTISE_RATING_PER_SKILL_POINT
    const fullTable = buildWhiteAttackTable({ skillDiff, dualWield, expertiseSkillPoints, missReduction, rawCritChance })
    const glanceRange = computeGlanceDamageRange(skillDiff)
    const avgGlanceMultiplier = (glanceRange.low + glanceRange.high) / 2
    const effectiveMultiplier =
      (fullTable.hit + fullTable.block) * 1 + fullTable.crit * MELEE_CRIT_DAMAGE_MULTIPLIER + fullTable.glance * avgGlanceMultiplier

    const mainHandWeaponDps = weaponDiceToWhiteDps(mainHandItem?.weaponDamageMin, mainHandItem?.weaponDamageMax, mainHandItem?.weaponSpeed)
    const offHandWeaponDps = weaponDiceToWhiteDps(offHandItem?.weaponDamageMin, offHandItem?.weaponDamageMax, offHandItem?.weaponSpeed)
    const apDps = attackPowerToWhiteDps(stats.attackPower)
    const mainHandDps = (mainHandWeaponDps + apDps) * effectiveMultiplier
    const offHandDps = dualWield ? (offHandWeaponDps + apDps) * 0.5 * effectiveMultiplier : 0
    rawDps = mainHandDps + offHandDps

    breakdown = [
      { label: 'Attack power', value: round(apDps) },
      { label: 'Weapon damage', value: round(mainHandWeaponDps + offHandWeaponDps) },
      { label: 'Hit chance', value: toPercent(fullTable.hit) },
      { label: 'Crit chance', value: toPercent(fullTable.crit) },
      { label: 'Miss chance', value: toPercent(fullTable.miss) },
      { label: 'Dodge + parry chance', value: toPercent(fullTable.dodge + fullTable.parry) },
      { label: 'Glancing blow chance', value: toPercent(fullTable.glance) },
      { label: 'Armor mitigation', value: toPercent(armorMitigation) },
    ]
  }

  const mitigatedDps = rawDps * (1 - armorMitigation)

  return {
    role: 'Physical DPS',
    metricLabel: 'Estimated DPS',
    score: round(mitigatedDps),
    summary: `White-damage attack-table estimate vs. a level ${target.level} target: weapon damage (where known) plus attack power, scaled by miss/dodge/parry/glance/crit outcomes, then reduced by armor mitigation. Special-ability/rotation damage isn't modeled yet.`,
    breakdown,
  }
}

function calculateCasterDps(
  character: CharacterProfile,
  stats: StatBlock,
  target: SimulationTarget,
  debuffs: ReturnType<typeof aggregateTargetDebuffs>,
): SimulationResult {
  const cast = resolveCastProfile(character, GENERIC_NUKE_CAST_TIME)
  const levelDiff = target.level - PLAYER_LEVEL
  const spellHitChance = computeSpellHitChance(levelDiff, ratingToFraction(stats.spellHitRating, RATING_PER_PERCENT.spellHit))
  const spellCritChance = computeSpellCritChance(ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit)) + debuffs.spellCritTakenBonus
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste)
  const effectiveCastTime = cast.castTimeSeconds / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const damagePerCast = (cast.baseAmount + stats.spellPower * cast.coefficient) * (1 + debuffs.spellDamageTakenMultiplier)
  const expectedDamagePerCast = damagePerCast * (1 + spellCritChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1))
  const dps = expectedDamagePerCast * spellHitChance * castsPerSecond

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Base damage per cast', value: round(cast.baseAmount) },
    { label: 'Spell power scaling', value: round(stats.spellPower * cast.coefficient * castsPerSecond) },
    { label: 'Spell hit chance', value: toPercent(spellHitChance) },
    { label: 'Spell crit chance', value: toPercent(spellCritChance) },
    { label: 'Casts per second', value: round(castsPerSecond) },
  ]

  const summary = cast.ability
    ? `Spell hit/crit table vs. a level ${target.level} target using TBC rating conversions, modeling ${cast.label} at its real ${cast.castTimeSeconds}s cast, ${round(cast.baseAmount)} base damage, and ${cast.coefficient} spell-power coefficient. Single-ability approximation — cooldowns, procs, and multi-spell rotation priority aren't modeled.`
    : `Spell hit/crit table vs. a level ${target.level} target using TBC rating conversions, assuming a ${cast.label}. Scales from spell power only — this spec has no modeled signature cast.`

  return {
    role: 'Caster DPS',
    metricLabel: 'Estimated DPS',
    score: round(dps),
    summary,
    breakdown,
  }
}

function calculateHealing(character: CharacterProfile, stats: StatBlock): SimulationResult {
  const cast = resolveCastProfile(character, GENERIC_HEAL_CAST_TIME)
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste)
  const effectiveCastTime = cast.castTimeSeconds / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const critChance = computeSpellCritChance(ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit))
  const healPerCast = cast.baseAmount + stats.healingPower * cast.coefficient
  const expectedHealPerCast = healPerCast * (1 + critChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1))
  const hps = expectedHealPerCast * castsPerSecond

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Base healing per cast', value: round(cast.baseAmount) },
    { label: 'Healing power scaling', value: round(stats.healingPower * cast.coefficient * castsPerSecond) },
    { label: 'Crit chance', value: toPercent(critChance) },
    { label: 'Casts per second', value: round(castsPerSecond) },
    { label: 'MP5', value: stats.mp5 },
  ]

  const summary = cast.ability
    ? `Heal crit/haste estimate modeling ${cast.label} at its real ${cast.castTimeSeconds}s cast, ${round(cast.baseAmount)} base healing, and ${cast.coefficient} healing coefficient. Single-ability approximation — no downranking, HoT overlap, or triage decisions.`
    : `Heal crit/haste estimate assuming a ${cast.label}. Scales from healing power only — this spec has no modeled signature cast.`

  return {
    role: 'Healer',
    metricLabel: 'Estimated Healing',
    score: round(hps),
    summary,
    breakdown,
  }
}

function calculateTankSurvivability(stats: StatBlock, target: SimulationTarget): SimulationResult {
  const skillDiff = computeSkillDiff(target.level)
  // Approximation: player avoidance-vs-boss baseline chances aren't as firmly sourced as the
  // player-attacks-target direction, so this reuses the same skill-differential formulas
  // symmetrically. Flagged as needsVerification pending a dedicated tank-mechanics research pass.
  const baselineDodge = 0.05 + skillDiff * 0.001
  const baselineParry = 0.05 + skillDiff * (skillDiff >= 11 ? 0.006 : 0.001)
  const baselineBlock = 0.05

  const dodgeChance = Math.max(0, baselineDodge) + ratingToFraction(stats.dodgeRating, RATING_PER_PERCENT.dodge)
  const parryChance = Math.max(0, baselineParry) + ratingToFraction(stats.parryRating, RATING_PER_PERCENT.parry)
  const blockChance = baselineBlock + ratingToFraction(stats.blockRating, RATING_PER_PERCENT.block)
  const defenseSkillPoints = stats.defenseRating / 2.4
  const defenseAvoidanceBonus = defenseSkillPoints * 0.0004 * 3
  const totalAvoidance = Math.min(0.99, dodgeChance + parryChance + blockChance + defenseAvoidanceBonus)

  const armorMitigation = computeArmorMitigation(stats.armor, target.level)
  const critTakenReduction = toPercent(defenseSkillPoints * 0.0004)

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Total avoidance', value: toPercent(totalAvoidance) },
    { label: 'Armor mitigation', value: toPercent(armorMitigation) },
    { label: 'Stamina', value: stats.stamina },
    { label: 'Block value', value: stats.blockValue },
    { label: 'Crit-taken reduction from Defense', value: critTakenReduction },
  ]

  const score = round(totalAvoidance * 100 * 2 + armorMitigation * 100 * 1.5 + stats.stamina * 0.1)

  return {
    role: 'Tank',
    metricLabel: 'Survivability Score',
    score,
    summary: `Avoidance (dodge/parry/block vs. a level ${target.level} target) and armor mitigation from real TBC rating conversions, plus stamina. Uncrittable status still requires ~490 total Defense Skill regardless of this score.`,
    breakdown,
  }
}

export function calculateSimulation(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  role: CharacterRole,
  activeTargetDebuffIds: readonly string[] = [],
  target: SimulationTarget = defaultSimulationTarget,
): SimulationResult {
  const debuffs = aggregateTargetDebuffs(activeTargetDebuffIds)

  if (role === 'Caster DPS') return calculateCasterDps(character, stats, target, debuffs)
  if (role === 'Healer') return calculateHealing(character, stats)
  if (role === 'Tank') return calculateTankSurvivability(stats, target)
  return calculatePhysicalDps(character, gear, stats, target, debuffs)
}
