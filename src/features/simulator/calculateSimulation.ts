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

function calculateCasterDps(stats: StatBlock, target: SimulationTarget, debuffs: ReturnType<typeof aggregateTargetDebuffs>): SimulationResult {
  const levelDiff = target.level - PLAYER_LEVEL
  const spellHitChance = computeSpellHitChance(levelDiff, ratingToFraction(stats.spellHitRating, RATING_PER_PERCENT.spellHit))
  const spellCritChance = computeSpellCritChance(ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit)) + debuffs.spellCritTakenBonus
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste)
  const effectiveCastTime = GENERIC_NUKE_CAST_TIME / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const coefficient = directSpellCoefficient(GENERIC_NUKE_CAST_TIME)
  const damagePerCast = stats.spellPower * coefficient * (1 + debuffs.spellDamageTakenMultiplier)
  const expectedDamagePerCast = damagePerCast * (1 + spellCritChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1))
  const dps = expectedDamagePerCast * spellHitChance * castsPerSecond

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Spell power scaling', value: round(stats.spellPower * coefficient * castsPerSecond) },
    { label: 'Spell hit chance', value: toPercent(spellHitChance) },
    { label: 'Spell crit chance', value: toPercent(spellCritChance) },
    { label: 'Casts per second', value: round(castsPerSecond) },
  ]

  return {
    role: 'Caster DPS',
    metricLabel: 'Estimated DPS',
    score: round(dps),
    summary: `Spell hit/crit table vs. a level ${target.level} target using TBC rating conversions, assuming a generic ${GENERIC_NUKE_CAST_TIME}s filler cast. Scales from spell power only — base spell damage per ability isn't modeled yet.`,
    breakdown,
  }
}

function calculateHealing(stats: StatBlock): SimulationResult {
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste)
  const effectiveCastTime = GENERIC_HEAL_CAST_TIME / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const coefficient = directSpellCoefficient(GENERIC_HEAL_CAST_TIME)
  const critChance = computeSpellCritChance(ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit))
  const healPerCast = stats.healingPower * coefficient
  const expectedHealPerCast = healPerCast * (1 + critChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1))
  const hps = expectedHealPerCast * castsPerSecond

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Healing power scaling', value: round(stats.healingPower * coefficient * castsPerSecond) },
    { label: 'Crit chance', value: toPercent(critChance) },
    { label: 'Casts per second', value: round(castsPerSecond) },
    { label: 'MP5', value: stats.mp5 },
  ]

  return {
    role: 'Healer',
    metricLabel: 'Estimated Healing',
    score: round(hps),
    summary: `Heal crit/haste estimate assuming a generic ${GENERIC_HEAL_CAST_TIME}s cast. Scales from healing power only — spell-specific base healing isn't modeled yet.`,
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

  if (role === 'Caster DPS') return calculateCasterDps(stats, target, debuffs)
  if (role === 'Healer') return calculateHealing(stats)
  if (role === 'Tank') return calculateTankSurvivability(stats, target)
  return calculatePhysicalDps(character, gear, stats, target, debuffs)
}
