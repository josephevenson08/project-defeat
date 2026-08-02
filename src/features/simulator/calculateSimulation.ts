import { getRotationAbilities, getSignatureAbility } from '../../domain/abilities'
import type { SignatureAbility } from '../../domain/abilities'
import { getTargetDebuffById } from '../../domain/buffs/sampleTargetDebuffs'
import {
  buildDefenderAvoidanceBaseline,
  buildIncomingAttackTable,
  buildRangedAttackTable,
  buildSpecialAttackTable,
  buildWhiteAttackTable,
  computeAttackerBaseCritChance,
  computeGlanceDamageRange,
  computeSkillDiff,
} from '../../domain/simulation/attackTable'
import {
  CAT_FORM_WEAPON,
  ENERGY_PER_SECOND,
  computeUsageRate,
  estimateSpecialAttack,
  usesCatFormWeapon,
} from '../../domain/simulation/specialAttacks'
import {
  AVOIDANCE_PER_DEFENSE_SKILL_POINT,
  CRUSHING_BLOW_CHANCE,
  CRUSHING_BLOW_DAMAGE_MULTIPLIER,
  CRUSHING_BLOW_LEVEL_GAP,
  DEFENSE_RATING_PER_SKILL_POINT,
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
import type { TbcClass } from '../../domain/character/characterTypes'
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

type ResolvedSpecial = {
  name: string
  dps: number
  explanation: string
}

/**
 * The yellow-damage layer for melee specs. Returns undefined when the spec's signature ability isn't
 * a melee special, or when its sustained usage rate isn't something this simulator can defend —
 * a rage-costed ability with no cooldown, for instance, depends on rage income that isn't tracked.
 * Reporting nothing is the honest outcome there; inventing a rate would silently fabricate DPS.
 */
type ResolvedRotation = {
  specials: ResolvedSpecial[]
  /** Abilities in the spec's rotation whose sustained rate can't be defended, named so their absence is visible. */
  excluded: { name: string; explanation: string }[]
  /** True when a shared budget — the GCD or energy — rather than an ability's own cooldown limited the modelled rate. */
  contended: boolean
}

/**
 * Resolves every ability in the spec's rotation whose sustained rate is computable, and reports the
 * rest by name rather than dropping them silently.
 *
 * The abilities compete for two shared budgets, so their rates cannot simply be added.
 *
 * **The global cooldown.** A spec cannot press more buttons per second than the GCD allows, however
 * many cooldowns happen to be up. Phase 2 melee sits well under this today — Bloodthirst on 6s plus
 * Whirlwind on 10s is about 0.27 casts/sec against a budget of 0.67.
 *
 * **Energy.** This one binds hard and immediately. `computeUsageRate` derives an energy ability's
 * rate as `10 / cost`, which by construction spends the entire 10/sec regen — so a single energy
 * ability already consumes the whole budget, and a second one added naively would double-count it.
 * Shred at 60 energy plus Mangle at 45 would claim 20 energy/sec against the 10 that exists, and
 * nothing in the output would look wrong.
 *
 * Higher-priority abilities (earlier in the rotation list) claim from both budgets first and a
 * lower-priority one gets whatever is left. That is what a real priority rotation does for cooldowns,
 * but it is only an approximation for energy: allocating a fixed energy pool between competing
 * abilities is an optimisation, and an ability pressed to maintain a debuff rather than for its own
 * damage (Mangle) does not fit priority-by-damage at all. Hence Feral is still one ability — the
 * guard below keeps a second from silently overstating it, but it does not make the answer right.
 */
function resolveRotation(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  skillDiff: number,
  missReduction: number,
  rawCritChance: number,
): ResolvedRotation {
  const abilities = getRotationAbilities(character.className, character.spec).filter(
    (ability) => ability.effectType === 'Melee Special',
  )

  const expertiseSkillPoints = stats.expertiseRating / EXPERTISE_RATING_PER_SKILL_POINT
  const table = buildSpecialAttackTable({ skillDiff, expertiseSkillPoints, missReduction, rawCritChance })
  // Blocked specials still land, just reduced; the block value itself isn't modelled, so a blocked
  // hit is counted at full damage here rather than pretending to know the reduction.
  const effectiveMultiplier = table.hit + table.block + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER

  const specials: ResolvedSpecial[] = []
  const excluded: ResolvedRotation['excluded'] = []
  let gcdBudget = 1 / (abilities[0]?.gcdSeconds || 1.5)
  let energyBudget = ENERGY_PER_SECOND
  let contended = false

  // Cat form swings its own internal weapon, so a Feral druid's specials must not read the equipped
  // item's damage dice — and it has no off-hand to strike with.
  const catForm = usesCatFormWeapon(character.className, character.spec)
  const mainHandProfile = catForm ? CAT_FORM_WEAPON : gear['Main Hand']?.item
  const offHandProfile = catForm ? undefined : gear['Off Hand']?.item

  for (const ability of abilities) {
    const estimate = estimateSpecialAttack(ability, mainHandProfile, offHandProfile, stats.attackPower)

    if (estimate.usesPerSecond <= 0 || estimate.damagePerUse <= 0) {
      excluded.push({ name: ability.name, explanation: estimate.explanation })
      continue
    }

    const energyCost = ability.resource?.type === 'Energy' ? ability.resource.cost : 0
    const energyCeiling = energyCost > 0 ? energyBudget / energyCost : Number.POSITIVE_INFINITY

    const usesPerSecond = Math.max(0, Math.min(estimate.usesPerSecond, gcdBudget, energyCeiling))
    if (usesPerSecond < estimate.usesPerSecond) contended = true

    gcdBudget -= usesPerSecond
    energyBudget -= usesPerSecond * energyCost

    if (usesPerSecond > 0) {
      specials.push({
        name: ability.name,
        dps: estimate.damagePerUse * effectiveMultiplier * usesPerSecond,
        explanation: estimate.explanation,
      })
    } else {
      // Reached only when a higher-priority ability has already spent the shared budget. Naming it
      // keeps a dropped ability visible instead of it quietly contributing nothing.
      excluded.push({
        name: ability.name,
        explanation: 'the abilities ahead of it already spend the available energy and global cooldowns',
      })
    }
  }

  return { specials, excluded, contended }
}

/** Says which specials were skipped and why, so a missing yellow-damage layer is visible rather than silent. */
function describeUnmodelledSpecials(character: CharacterProfile, excluded: ResolvedRotation['excluded']) {
  if (excluded.length === 0) {
    const ability = getSignatureAbility(character.className, character.spec)
    if (!ability) return "This spec's rotational ability isn't in the ability data yet, so no special-attack damage is included."
    const { explanation } = computeUsageRate(ability)
    return `${ability.name} is not included: ${explanation}. Its damage is therefore missing from this estimate.`
  }

  const named = excluded.map((entry) => `${entry.name} (${entry.explanation})`).join('; ')
  return `Not included: ${named}. That damage is missing from this estimate.`
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
  const missReduction = ratingToFraction(stats.hitRating, RATING_PER_PERCENT.meleeHit)

  let breakdown: SimulationBreakdownEntry[]
  let rawDps: number

  if (character.className === 'Hunter') {
    const rangedItem = gear['Ranged']?.item
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
    // Cat form replaces the equipped weapon entirely for white damage too, and cannot dual wield.
    // Without this a Feral druid's auto attacks scale off a staff's damage dice that the form never
    // swings; the equipped weapon's real contribution is its stats, not its weapon damage.
    const catForm = usesCatFormWeapon(character.className, character.spec)
    const mainHandItem = catForm ? CAT_FORM_WEAPON : gear['Main Hand']?.item
    const offHandItem = catForm ? undefined : gear['Off Hand']?.item
    const dualWield = catForm ? false : isDualWield(gear)
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

  // Yellow (special) damage, layered on top of the white swing model above. Only the melee path gets
  // this: the ranged special (Steady Shot) is mana-costed with no cooldown, so its sustained rate
  // depends on auto-shot weaving that isn't modelled.
  const rotation = resolveRotation(character, gear, stats, skillDiff, missReduction, rawCritChance)
  const specialRawDps = rotation.specials.reduce((sum, entry) => sum + entry.dps, 0)

  const mitigatedDps = (rawDps + specialRawDps) * (1 - armorMitigation)

  for (const entry of rotation.specials) {
    breakdown.push({ label: `${entry.name} DPS`, value: round(entry.dps * (1 - armorMitigation)) })
  }

  const modelled = rotation.specials.map((entry) => `${entry.name} (${entry.explanation})`).join(', ')
  const gcdNote = rotation.contended
    ? ' A shared budget — the global cooldown, or energy — rather than their own cooldowns is what caps how often these can be used together.'
    : ''
  const excludedNote = rotation.excluded.length > 0 ? ` ${describeUnmodelledSpecials(character, rotation.excluded)}` : ''

  const specialSummary =
    rotation.specials.length > 0
      ? ` Layered on top: ${modelled}, using the special-attack table (no glancing blows, and no dual-wield miss penalty).${gcdNote}${excludedNote}`
      : ` ${describeUnmodelledSpecials(character, rotation.excluded)}`

  return {
    role: 'Physical DPS',
    metricLabel: 'Estimated DPS',
    score: round(mitigatedDps),
    scoreExact: mitigatedDps,
    summary: `White-damage attack-table estimate vs. a level ${target.level} target: weapon damage (where known) plus attack power, scaled by miss/dodge/parry/glance/crit outcomes, then reduced by armor mitigation.${specialSummary}`,
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
    scoreExact: dps,
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
    scoreExact: hps,
    summary,
    breakdown,
  }
}

/** Sourced from wowsims/tbc: `CanParry` is set unconditionally for these four and never for Druid, Mage, Priest or Warlock. Shaman gets it only from the Enhancement talent Spirit Weapons, which this project does not model. */
const PARRY_CAPABLE_CLASSES: ReadonlySet<TbcClass> = new Set<TbcClass>(['Warrior', 'Paladin', 'Rogue', 'Hunter'])

/**
 * Agility for +1% dodge at level 70. Only the three classes TBC actually tanks with have an
 * Agility-to-dodge dependency in wowsims at all; Rogue, Hunter and Shaman are absent rather than
 * guessed at.
 *
 * **Druid is not reachable today.** `roleForSpec` maps only Protection Warrior and Protection
 * Paladin to Tank, so no Druid spec reaches this calculation — the entry is here because the value
 * is sourced and it goes live unchanged when the Feral bear/cat split lands. Note also that Druids
 * cannot parry in any form, including Dire Bear, which `PARRY_CAPABLE_CLASSES` already handles.
 */
const AGILITY_PER_PERCENT_DODGE: Partial<Record<TbcClass, number>> = {
  Warrior: 30,
  Paladin: 25,
  Druid: 14.7059,
}

function calculateTankSurvivability(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  target: SimulationTarget,
): SimulationResult {
  const baseline = buildDefenderAvoidanceBaseline(target.level)
  const defenseSkillPoints = stats.defenseRating / DEFENSE_RATING_PER_SKILL_POINT
  // One Defense Skill point moves each outcome by the same 0.04%, so this is added to every
  // avoidance term separately rather than summed once and scaled. The old code multiplied a single
  // combined bonus by 3, which happened to land near the right total while making the per-outcome
  // rows below meaningless.
  const fromDefense = defenseSkillPoints * AVOIDANCE_PER_DEFENSE_SKILL_POINT

  const agilityPerPercentDodge = AGILITY_PER_PERCENT_DODGE[character.className]
  const dodgeFromAgility = agilityPerPercentDodge ? stats.agility / agilityPerPercentDodge / 100 : 0
  const dodgeChance = Math.max(
    0,
    dodgeFromAgility + baseline.dodgeLevelPenalty + ratingToFraction(stats.dodgeRating, RATING_PER_PERCENT.dodge) + fromDefense,
  )

  const canParry = PARRY_CAPABLE_CLASSES.has(character.className)
  const parryChance = canParry
    ? Math.max(0, baseline.parry + ratingToFraction(stats.parryRating, RATING_PER_PERCENT.parry) + fromDefense)
    : 0

  // Block is unavailable without a shield no matter how much block rating is stacked.
  const hasShield = gear['Off Hand']?.item.weaponType === 'Shield'
  const blockChance = hasShield
    ? Math.max(0, baseline.block + ratingToFraction(stats.blockRating, RATING_PER_PERCENT.block) + fromDefense)
    : 0

  // A swing that misses is avoided damage exactly as a dodge is, so it belongs in the total. The
  // previous model left it out entirely.
  const missChance = Math.max(0, baseline.miss + fromDefense)

  // Defense Skill and resilience both eat into the boss's crit; neither touches crushing blows.
  const bossCritChance = Math.max(
    0,
    computeAttackerBaseCritChance(target.level) -
      fromDefense -
      ratingToFraction(stats.resilienceRating, RATING_PER_PERCENT.resilience),
  )
  const canBeCrushed = target.level - PLAYER_LEVEL >= CRUSHING_BLOW_LEVEL_GAP

  // Resolved as one ordered roll rather than summed. Summing let the parts total more than a single
  // swing can actually produce, and hid the fact that piling on avoidance is what pushes crushing
  // blows off the bottom of the table.
  const table = buildIncomingAttackTable({
    missChance,
    dodgeChance,
    parryChance,
    blockChance,
    critChance: bossCritChance,
    crushChance: canBeCrushed ? CRUSHING_BLOW_CHANCE : 0,
  })

  const totalAvoidance = table.miss + table.dodge + table.parry + table.block

  const armorMitigation = computeArmorMitigation(stats.armor, target.level)
  const critTakenReduction = toPercent(defenseSkillPoints * AVOIDANCE_PER_DEFENSE_SKILL_POINT)

  // What an average swing actually lands for, relative to an unmitigated hit. A blocked swing still
  // connects — block reduces it by a flat block value rather than a fraction — so it counts here as
  // a full hit, which makes this a slight overestimate for a shield tank.
  const damagePerSwing =
    (table.hit +
      table.block +
      table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER +
      table.crush * CRUSHING_BLOW_DAMAGE_MULTIPLIER) *
    (1 - armorMitigation)

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Total avoidance', value: toPercent(totalAvoidance) },
    { label: 'Dodge', value: toPercent(table.dodge) },
    { label: canParry ? 'Parry' : 'Parry (this class cannot parry)', value: toPercent(table.parry) },
    { label: hasShield ? 'Block' : 'Block (no shield equipped)', value: toPercent(table.block) },
    { label: 'Boss miss chance', value: toPercent(table.miss) },
    { label: 'Crit taken', value: toPercent(table.crit) },
    { label: canBeCrushed ? 'Crushing blows taken' : 'Crushing blows (target too low to crush)', value: toPercent(table.crush) },
    { label: 'Armor mitigation', value: toPercent(armorMitigation) },
    { label: 'Damage taken per swing vs. unmitigated', value: toPercent(damagePerSwing) },
    { label: 'Stamina', value: stats.stamina },
    { label: 'Block value', value: stats.blockValue },
    { label: 'Crit-taken reduction from Defense', value: critTakenReduction },
  ]

  const survivabilityScore = totalAvoidance * 100 * 2 + armorMitigation * 100 * 1.5 + stats.stamina * 0.1

  return {
    role: 'Tank',
    metricLabel: 'Survivability Score',
    score: round(survivabilityScore),
    scoreExact: survivabilityScore,
    summary: `Resolved as one ordered roll against a level ${target.level} attacker — miss, dodge, parry, block, crit, crushing blow, hit — using the defender-side base chances, so a level gap lowers your avoidance rather than raising it. Crushing blows can only be pushed off the bottom of that table, never reduced directly. Uncrittable still requires 490 total Defense Skill. The score itself weights avoidance, armor and stamina; it does not yet price how much worse a crit or a crush is than a plain hit, so read the damage-per-swing row for that.`,
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
  if (role === 'Tank') return calculateTankSurvivability(character, gear, stats, target)
  return calculatePhysicalDps(character, gear, stats, target, debuffs)
}
