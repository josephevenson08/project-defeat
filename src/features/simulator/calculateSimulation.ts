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
  averageSwingDamage,
  computeUsageRate,
  estimateSpecialAttack,
  usesCatFormWeapon,
} from '../../domain/simulation/specialAttacks'
import { bloodrageRagePerSecond, rageDumpUsesPerSecond, rageFromDamageTaken, rageFromOneSwing, ragePerSecondFromWeapon } from '../../domain/simulation/rageModel'
import { computeManaBudget } from '../../domain/simulation/manaModel'
import {
  AVOIDANCE_PER_DEFENSE_SKILL_POINT,
  CRUSHING_BLOW_CHANCE,
  CRUSHING_BLOW_DAMAGE_MULTIPLIER,
  CRUSHING_BLOW_LEVEL_GAP,
  DEFENSE_RATING_PER_SKILL_POINT,
  EXPERTISE_RATING_PER_SKILL_POINT,
  HEALTH_PER_STAMINA,
  MELEE_CRIT_DAMAGE_MULTIPLIER,
  RATING_PER_PERCENT,
  SPELL_CRIT_DAMAGE_MULTIPLIER,
  ratingToFraction,
} from '../../domain/simulation/combatConstants'
import { attackPowerToWhiteDps, computeArmorMitigation, directSpellCoefficient, weaponDiceToWhiteDps } from '../../domain/simulation/damageFormulas'
import { defaultSimulationTarget } from '../../domain/simulation/sampleEncounters'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import { computeSpellCritChance, computeSpellHitChance } from '../../domain/simulation/spellTable'
import {
  classHasTalentEffects,
  classesWithTalentEffects,
  deriveTalentModifiers,
  flurrySpeedMultiplier,
  noTalentModifiers,
  unmodelledTalentsInBuild,
  type TalentModifiers,
} from '../../domain/talents/talentModifiers'
import type { TalentPoints } from '../../domain/talents/talentTypes'
import type { TbcClass } from '../../domain/character/characterTypes'
import type { CharacterProfile, CharacterRole } from '../character/characterTypes'
import { twoHanderOccupiesOffHand } from '../../domain/gear/slotCompatibility'
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

/**
 * The spec-specific caveat for whichever ability this estimate is actually built on.
 *
 * Every signature ability carries researched prose about how far a single-ability approximation is
 * from that spec's real rotation, and none of it used to be surfaced. Resolved from the rotation's
 * first entry rather than from `getSignatureAbility`, because the melee path layers several and the
 * first is the one the estimate leans on.
 */
function specNoteFor(character: CharacterProfile): string | undefined {
  const [primary] = getRotationAbilities(character.className, character.spec)
  return primary?.notes
}

/**
 * Names the talents this build took that the model cannot express.
 *
 * Only produced when points are actually spent on one, because warning someone about talents they do
 * not have is noise — and noise is how a caveat stops being read. The list comes from the ingest,
 * which refuses what it cannot express rather than inventing a value, so this is the player-facing
 * half of a decision the data already made honestly.
 */
function unmodelledTalentNoteFor(
  character: CharacterProfile,
  talentPoints: TalentPoints,
  role: CharacterRole,
): string | undefined {
  const pointsSpent = Object.values(talentPoints).reduce((total, rank) => total + rank, 0)
  if (pointsSpent === 0) return undefined

  /*
   * The louder case, and the one that was silent: this class has no ingested talent effects at all,
   * so every point spent changes the estimate by exactly nothing. A Mage could spend all 41 and watch
   * the number not move, with no way to learn why.
   */
  if (!classHasTalentEffects(character.className)) {
    return (
      `Talent effects are only ingested for ${classesWithTalentEffects.join(' and ')} so far, so the ` +
      `${pointsSpent} points spent here reach this estimate not at all. The talents themselves are real ` +
      'and the tree is complete — it is the effect extraction that stops at those classes.'
    )
  }

  /*
   * Tanks receive no talents at all — they are applied in `calculatePhysicalDps`, and a tank is
   * scored by `calculateTankSurvivability`. Listing only the *skipped* talents here would imply the
   * rest are counted, which is the precise kind of wrong caveat this file keeps having to correct.
   */
  if (role === 'Tank') {
    return (
      `Effective Health does not read talents at all yet, so the ${pointsSpent} points spent here change ` +
      'nothing. Toughness, Vitality, Anticipation, Defiance and the shield talents are all extractable — ' +
      'the gap is that talents are applied on the damage path only.'
    )
  }

  const taken = unmodelledTalentsInBuild(character.className, talentPoints)
  if (taken.length === 0) return undefined

  return (
    `${taken.join(', ')} ${taken.length === 1 ? 'is' : 'are'} spent but not modelled here, so this estimate is ` +
    'low by whatever they are worth. They need a damage-over-time layer, a cooldown usage policy or an ' +
    'incoming-damage stream, none of which a closed-form model has.'
  )
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

/**
 * Sums the active debuffs. Armor reduction is summed in **flat armor points**, which is both how
 * the values are stored and how they combine in game — wowsims applies each as its own
 * `AddStatDynamic(stats.Armor, -x)`, so Sunder, Faerie Fire and Curse of Recklessness add up.
 *
 * A debuff carrying `notModelled` contributes nothing by construction: it has no numeric fields to
 * contribute. It stays reachable through `getTargetDebuffById` so a saved build that has one ticked
 * still loads.
 */
function aggregateTargetDebuffs(activeTargetDebuffIds: readonly string[]) {
  return activeTargetDebuffIds.reduce(
    (totals, id) => {
      const debuff = getTargetDebuffById(id)
      if (!debuff) return totals
      return {
        armorReduction: totals.armorReduction + (debuff.armorReduction ?? 0),
        physicalCritTakenBonus: totals.physicalCritTakenBonus + (debuff.physicalCritTakenBonus ?? 0),
        spellCritTakenBonus: totals.spellCritTakenBonus + (debuff.spellCritTakenBonus ?? 0),
        spellDamageTakenMultiplier: totals.spellDamageTakenMultiplier + (debuff.spellDamageTakenMultiplier ?? 0),
      }
    },
    { armorReduction: 0, physicalCritTakenBonus: 0, spellCritTakenBonus: 0, spellDamageTakenMultiplier: 0 },
  )
}

type ResolvedSpecial = {
  name: string
  dps: number
  explanation: string
}

type ResolvedRotation = {
  specials: ResolvedSpecial[]
  /** Abilities in the spec's rotation whose sustained rate can't be defended, named so their absence is visible. */
  excluded: { name: string; explanation: string }[]
  /** True when a shared budget — the GCD, energy or rage — rather than an ability's own cooldown limited the modelled rate. */
  contended: boolean
  /** Rage income, for the breakdown. Undefined for specs that do not use rage. */
  ragePerSecond?: number
}

/**
 * What the white-swing model already worked out, handed to the rotation so rage can be budgeted.
 *
 * Rage income is a property of the auto attacks, so it has to be computed where the attack table and
 * the swing damage already exist rather than recomputed from the stat block. Passing it in also keeps
 * `resolveRotation` honest about the feedback loop: an on-next-swing ability displaces one of these
 * swings, and both its damage and its rage have to be netted off.
 */
type MeleeSwingContext = {
  ragePerSecond: number
  mainHandSwingsPerSecond: number
  /** What one main-hand swing generates, so a swing-replacing ability can give it back. */
  ragePerMainHandSwing: number
  /** Expected damage of the main-hand swing a replacement displaces, after the white attack table. */
  displacedSwingDamage: number
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
  melee?: MeleeSwingContext,
  talents: TalentModifiers = noTalentModifiers,
): ResolvedRotation {
  const abilities = getRotationAbilities(character.className, character.spec).filter(
    (ability) => ability.effectType === 'Melee Special',
  )

  const expertiseSkillPoints = stats.expertiseRating / EXPERTISE_RATING_PER_SKILL_POINT + talents.expertiseSkillPoints
  // A melee DPS spends the whole fight behind the boss, where parry and block cannot happen.
  const table = buildSpecialAttackTable({ skillDiff, expertiseSkillPoints, missReduction, rawCritChance, attacksFromBehind: true })
  // Blocked specials still land, just reduced; the block value itself isn't modelled, so a blocked
  // hit is counted at full damage here rather than pretending to know the reduction.
  const effectiveMultiplier = table.hit + table.block + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER

  const specials: ResolvedSpecial[] = []
  const excluded: ResolvedRotation['excluded'] = []
  let gcdBudget = 1 / (abilities[0]?.gcdSeconds || 1.5)
  let energyBudget = ENERGY_PER_SECOND
  // A third shared budget, and the one that was missing. Cooldown abilities spend from it in
  // priority order and whatever survives funds the dump at the bottom of the list.
  let rageBudget = melee?.ragePerSecond ?? 0
  let contended = false

  // Cat form swings its own internal weapon, so a Feral druid's specials must not read the equipped
  // item's damage dice — and it has no off-hand to strike with.
  const catForm = usesCatFormWeapon(character.className, character.spec)
  const mainHandProfile = catForm ? CAT_FORM_WEAPON : gear['Main Hand']?.item
  const offHandProfile = catForm ? undefined : gear['Off Hand']?.item

  for (const ability of abilities) {
    const estimate = estimateSpecialAttack(ability, mainHandProfile, offHandProfile, stats.attackPower)
    const rageCost = ability.resource?.type === 'Rage' ? ability.resource.cost : 0

    /*
     * A rage dump — rage-costed, no cooldown of its own. Its rate is not "as often as possible" but
     * "as often as the surplus funds", and because it replaces a main-hand swing each use also hands
     * back the rage that swing would have made. `rageDumpUsesPerSecond` solves both at once.
     *
     * This is the branch that made Heroic Strike computable. Without it `computeUsageRate` returns
     * `unmodelled` and the ability contributes nothing at all.
     */
    const isRageDump = rageCost > 0 && !ability.cooldownSeconds && melee !== undefined

    if (isRageDump && melee) {
      const displacedRage = ability.replacesMainHandSwing ? melee.ragePerMainHandSwing : 0
      const uses = rageDumpUsesPerSecond({
        surplusRagePerSecond: rageBudget,
        cost: rageCost,
        ragePerSuppressedSwing: displacedRage,
        mainHandSwingsPerSecond: melee.mainHandSwingsPerSecond,
      })

      if (uses <= 0 || estimate.damagePerUse <= 0) {
        // Quantified rather than hand-waved: this is the number that has to move before a rage dump
        // is worth anything, and naming the missing sources says what would move it.
        /*
         * This message named Bloodrage, Unbridled Wrath, damage taken and Flurry as "unmodelled
         * rage income" long after all four were modelled — the same stale-disclosure failure the
         * feature flag had. What actually keeps the dump unfunded now is a *declared* zero rather
         * than a missing model, so that is what it says.
         */
        excluded.push({
          name: ability.name,
          explanation:
            `rage income is ${melee.ragePerSecond.toFixed(1)}/sec and the cooldowns ahead of it already commit ` +
            `${(melee.ragePerSecond - rageBudget).toFixed(1)}, leaving no surplus to dump. Swings, Bloodrage, Anger ` +
            `Management, Unbridled Wrath, Endless Rage and Flurry-driven haste are all counted; what is not is rage ` +
            `from damage taken, which is an encounter setting and defaults to 0 — a Fury warrior's rotation starts ` +
            `funding this somewhere around 250-300 damage/sec taken`,
        })
        continue
      }

      /*
       * An on-next-swing ability is worth the *difference* it makes, not its whole damage: the swing
       * it replaces would have landed anyway. Counting the full amount roughly doubles it.
       *
       * The two sides are scored against different tables on purpose — a special cannot glance, so
       * part of what the ability buys is trading a glancing white swing for one that cannot glance.
       */
      const perUse = ability.replacesMainHandSwing
        ? estimate.damagePerUse * effectiveMultiplier - melee.displacedSwingDamage
        : estimate.damagePerUse * effectiveMultiplier

      rageBudget = Math.max(0, rageBudget - uses * (rageCost + displacedRage))
      if (!ability.offGlobalCooldown) gcdBudget -= uses
      contended = true

      specials.push({
        name: ability.name,
        dps: Math.max(0, perUse) * uses,
        explanation: ability.replacesMainHandSwing
          ? `funded by surplus rage at roughly one per ${(1 / uses).toFixed(1)}s, counted as the gain over the main-hand swing it replaces`
          : `funded by surplus rage at roughly one per ${(1 / uses).toFixed(1)}s`,
      })
      continue
    }

    if (estimate.usesPerSecond <= 0 || estimate.damagePerUse <= 0) {
      excluded.push({ name: ability.name, explanation: estimate.explanation })
      continue
    }

    const energyCost = ability.resource?.type === 'Energy' ? ability.resource.cost : 0
    const energyCeiling = energyCost > 0 ? energyBudget / energyCost : Number.POSITIVE_INFINITY

    /*
     * Rage-costed *cooldowns* are deliberately NOT capped by modelled rage income, and that is a
     * judgement worth stating.
     *
     * This model captures one rage source: auto attacks. It has no Bloodrage, no Unbridled Wrath, no
     * damage taken, and — most of all — no haste, so no Flurry, which is a large part of why a Fury
     * warrior's real swing rate and rage income are far above what is computed here. Measured on the
     * default set, white swings fund about 4-5 rage/sec while Bloodthirst and Whirlwind on cooldown
     * need 7.5.
     *
     * Treating an admittedly partial income as a hard budget would throttle abilities a real warrior
     * presses on cooldown, and would report a DPS *loss* as if it were an accuracy gain. So the
     * priority is assumed affordable, income is still spent against it, and only a genuine surplus
     * funds the dump below — which is the one place the number has to be defensible.
     */
    const usesPerSecond = Math.max(0, Math.min(estimate.usesPerSecond, gcdBudget, energyCeiling))
    if (usesPerSecond < estimate.usesPerSecond) contended = true

    gcdBudget -= usesPerSecond
    energyBudget -= usesPerSecond * energyCost
    rageBudget = Math.max(0, rageBudget - usesPerSecond * rageCost)

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

  return { specials, excluded, contended, ragePerSecond: melee?.ragePerSecond }
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
  talents: TalentModifiers = noTalentModifiers,
  unmodelledTalentNote?: string,
): SimulationResult {
  const skillDiff = computeSkillDiff(target.level)
  const targetArmor = Math.max(0, target.armor - debuffs.armorReduction)
  const armorMitigation = computeArmorMitigation(targetArmor, PLAYER_LEVEL)
  /*
   * Talent crit and hit are added as **chances**, alongside the debuff bonus, rather than converted
   * back into ratings. Cruelty grants 5% crit outright; expressing that as rating would run the
   * conversion backwards and make the answer depend on the rating-per-percent constant, which is not
   * what the talent says.
   */
  const rawCritChance =
    ratingToFraction(stats.critRating, RATING_PER_PERCENT.meleeCrit) + debuffs.physicalCritTakenBonus + talents.meleeCritChance
  const missReduction = ratingToFraction(stats.hitRating, RATING_PER_PERCENT.meleeHit) + talents.meleeHitChance

  // Improved Berserker Stance multiplies attack power, so it has to land before any of the
  // attack-power-derived damage below rather than being added to the total afterwards.
  const attackPower = stats.attackPower * talents.attackPowerMultiplier

  /*
   * Attack speed. Until this existed, `hasteRating` reached no output at all: the white-damage
   * formulas are `weaponDice/speed` and `AP/14`, and neither read it — so the rail displayed a stat
   * that did nothing, and the stat-weight engine priced it at exactly zero.
   *
   * Haste does not make a swing hit harder, it makes swings more frequent. Damage per swing stays
   * `weaponRoll + (AP/14) * baseSpeed` — the attack-power term uses the weapon's **base** speed, not
   * its hasted one — while swings per second becomes `(1 + haste) / baseSpeed`. Multiply those and
   * the whole white-damage total simply scales by `(1 + haste)`, which is why this lands as one
   * factor rather than as changes to both formulas.
   *
   * It moves nothing on Phase 2 gear, and that is correct rather than a failure: only 78 of 4,560
   * catalogued items carry melee haste and none of them is Phase 2 raid gear. TBC put almost no
   * haste rating on early-expansion items.
   */
  const hasteFraction = ratingToFraction(stats.hasteRating, RATING_PER_PERCENT.meleeHaste)
  // Gear haste only. Flurry multiplies on top of this inside the melee branch below, where the
  // attack table exists — it needs the crit chance that actually occurs, not the raw one.
  const gearAttackSpeedMultiplier = 1 + hasteFraction

  let breakdown: SimulationBreakdownEntry[]
  let rawDps: number
  // Only the melee path builds this. A Hunter's ranged auto attacks generate no rage at all, so
  // leaving it undefined is what keeps the rage budget from being offered to a spec that has none.
  let meleeContext: MeleeSwingContext | undefined

  if (character.className === 'Hunter') {
    const rangedItem = gear['Ranged']?.item
    // Lethal Shots is ranged crit specifically, so it joins here rather than in the shared figure.
    const table = buildRangedAttackTable({ skillDiff, missReduction, rawCritChance: rawCritChance + talents.rangedCritChance })
    const effectiveMultiplier = table.hit + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER
    const weaponDps = weaponDiceToWhiteDps(rangedItem?.weaponDamageMin, rangedItem?.weaponDamageMax, rangedItem?.weaponSpeed)
    // Ranged haste uses the same rating and behaves the same way: more shots, not bigger ones.
    rawDps =
      (weaponDps + attackPowerToWhiteDps(stats.rangedAttackPower)) *
      effectiveMultiplier *
      gearAttackSpeedMultiplier *
      talents.rangedAttackSpeedMultiplier *
      talents.rangedDamageMultiplier
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
    // Talent expertise arrives as skill points and is added to the converted rating, not folded
    // into it — Weapon Expertise grants 5 points per rank outright, which is not a rating.
    const expertiseSkillPoints = stats.expertiseRating / EXPERTISE_RATING_PER_SKILL_POINT + talents.expertiseSkillPoints
    const fullTable = buildWhiteAttackTable({
      skillDiff,
      dualWield,
      expertiseSkillPoints,
      missReduction,
      rawCritChance,
      attacksFromBehind: true,
      dodgeReduction: talents.targetDodgeReduction,
    })

    /*
     * Flurry, now that the table exists. It is fed `fullTable.crit` rather than `rawCritChance`
     * because crit suppression against a higher-level target is real: a crit that never happens
     * cannot refresh a stack, and using the raw figure would overstate the uptime.
     */
    const attackSpeedMultiplier = gearAttackSpeedMultiplier * flurrySpeedMultiplier(talents.flurryBonus, fullTable.crit)
    const glanceRange = computeGlanceDamageRange(skillDiff)
    const avgGlanceMultiplier = (glanceRange.low + glanceRange.high) / 2
    const effectiveMultiplier =
      (fullTable.hit + fullTable.block) * 1 + fullTable.crit * MELEE_CRIT_DAMAGE_MULTIPLIER + fullTable.glance * avgGlanceMultiplier

    const mainHandWeaponDps = weaponDiceToWhiteDps(mainHandItem?.weaponDamageMin, mainHandItem?.weaponDamageMax, mainHandItem?.weaponSpeed)
    const offHandWeaponDps = weaponDiceToWhiteDps(offHandItem?.weaponDamageMin, offHandItem?.weaponDamageMax, offHandItem?.weaponSpeed)
    const apDps = attackPowerToWhiteDps(attackPower)
    // Two-Handed Weapon Specialization is gated on actually holding one, exactly as upstream gates
    // it on HandType — a Fury warrior dual-wielding gets nothing from it.
    // The equipped item, not `mainHandItem` -- that may be the cat-form profile, which is a damage
    // profile rather than a real weapon. The talent gates on what is actually held.
    const twoHandedMultiplier = twoHanderOccupiesOffHand(gear['Main Hand']?.item) ? talents.twoHandedDamageMultiplier : 1
    const physicalMultiplier = talents.physicalDamageMultiplier * twoHandedMultiplier
    const mainHandDps = (mainHandWeaponDps + apDps) * effectiveMultiplier * attackSpeedMultiplier * physicalMultiplier
    const offHandDps = dualWield
      ? (offHandWeaponDps + apDps) * 0.5 * effectiveMultiplier * attackSpeedMultiplier * talents.offHandDamageMultiplier * physicalMultiplier
      : 0
    rawDps = mainHandDps + offHandDps

    /*
     * Rage income, from the same swings the white damage above is built on.
     *
     * Haste is not modelled for auto attacks anywhere in this file, so swings per second is simply
     * 1/speed and the weapon's base speed is also its real one — which happens to be exactly what
     * the hit-factor term wants, since that term does not scale with haste either.
     *
     * The damage fed in is **post-armor**, because wowsims generates rage from damage actually
     * dealt. Using the pre-mitigation figure would inflate rage income by the whole armor
     * reduction, about a third against a raid boss.
     */
    const outcomes = {
      miss: fullTable.miss,
      dodge: fullTable.dodge,
      parry: fullTable.parry,
      glance: fullTable.glance,
      block: fullTable.block,
      crit: fullTable.crit,
      hit: fullTable.hit,
    }
    const mainHandSpeed = mainHandItem?.weaponSpeed ?? 0
    // Hasted, because rage income scales with how often you swing. The hit-factor term below still
    // takes the *base* speed, which is the distinction `rageModel` was written to keep.
    const mainHandSwingsPerSecond = mainHandSpeed > 0 ? attackSpeedMultiplier / mainHandSpeed : 0
    /*
     * Two figures for the same swing, in two different units, and mixing them is the easy mistake:
     * rage is generated from damage *dealt*, so it needs the post-armor number, while every special's
     * DPS stays pre-armor here because `mitigatedDps` applies mitigation once at the end. Feeding the
     * post-armor figure to `displacedSwingDamage` would mitigate the displaced swing twice and make
     * the replacement look better than it is.
     */
    const mainHandSwingDamage = averageSwingDamage(mainHandItem, attackPower, false)

    const mainHandRageInput = {
      damagePerLandedSwing: mainHandSwingDamage * (1 - armorMitigation),
      swingsPerSecond: mainHandSwingsPerSecond,
      baseSwingSpeed: mainHandSpeed,
      isOffHand: false,
      outcomes,
      glanceMultiplier: avgGlanceMultiplier,
      rageMultiplier: talents.rageGeneratedMultiplier,
    }

    let ragePerSecond = mainHandSwingsPerSecond > 0 ? ragePerSecondFromWeapon(mainHandRageInput) : 0

    if (dualWield && offHandItem?.weaponSpeed) {
      ragePerSecond += ragePerSecondFromWeapon({
        // An off-hand swing lands for half, and that halved figure is what generates rage.
        damagePerLandedSwing:
          averageSwingDamage(offHandItem, attackPower, false) * 0.5 * talents.offHandDamageMultiplier * (1 - armorMitigation),
        swingsPerSecond: attackSpeedMultiplier / offHandItem.weaponSpeed,
        baseSwingSpeed: offHandItem.weaponSpeed,
        isOffHand: true,
        outcomes,
        glanceMultiplier: avgGlanceMultiplier,
        rageMultiplier: talents.rageGeneratedMultiplier,
      })
    }

    /*
     * The three rage talents, and the reason this pass exists at all. Auto attacks alone fund about
     * 3.1 rage/sec against the 7.5 Bloodthirst and Whirlwind want, which is why the dump has never
     * been affordable.
     *
     * Endless Rage multiplies only the swing-derived income, because that is what it modifies -- it
     * raises rage generated *from damage dealt*, so a flat trickle and a proc that grants a fixed
     * rage point are outside it. Applying it to the total would silently inflate both.
     */
    ragePerSecond += talents.flatRagePerSecond + talents.rageProcsPerMinute / 60

    /*
     * Bloodrage is an ability rather than a talent — every warrior has it from level 10 — so it is
     * baseline income this model was simply missing, and it sits outside Endless Rage for the same
     * reason the flat trickle does: Endless Rage multiplies rage generated *from damage dealt*.
     */
    if (character.className === 'Warrior') ragePerSecond += bloodrageRagePerSecond()

    /*
     * Rage from damage taken. Zero unless the encounter says otherwise, because how much a melee
     * DPS takes is fight-specific and a default would be invented rather than measured. Endless
     * Rage does not apply: upstream's `OnSpellHitTaken` carries no rage multiplier.
     */
    ragePerSecond += rageFromDamageTaken(target.damageTakenPerSecond ?? 0)


    if (mainHandSwingsPerSecond > 0) {
      meleeContext = {
        ragePerSecond,
        mainHandSwingsPerSecond,
        ragePerMainHandSwing: rageFromOneSwing(mainHandRageInput),
        // Pre-armor, matching every other special's DPS, since mitigation is applied once at the end.
        displacedSwingDamage: mainHandSwingDamage * effectiveMultiplier,
      }
    }

    breakdown = [
      { label: 'Attack power', value: round(apDps) },
      { label: 'Weapon damage', value: round(mainHandWeaponDps + offHandWeaponDps) },
      { label: 'Hit chance', value: toPercent(fullTable.hit) },
      { label: 'Crit chance', value: toPercent(fullTable.crit) },
      { label: 'Miss chance', value: toPercent(fullTable.miss) },
      // Parry and block are zero for a melee DPS, who is behind the target, so this is the dodge row
      // alone. Kept as a sum rather than renamed to `fullTable.dodge` so that a future tank or
      // front-facing caller shows the right total without this line needing to change again.
      { label: 'Dodge chance', value: toPercent(fullTable.dodge + fullTable.parry) },
      { label: 'Glancing blow chance', value: toPercent(fullTable.glance) },
      { label: 'Armor mitigation', value: toPercent(armorMitigation) },
    ]
  }

  // Yellow (special) damage, layered on top of the white swing model above. Only the melee path gets
  // this: the ranged special (Steady Shot) is mana-costed with no cooldown, so its sustained rate
  // depends on auto-shot weaving that isn't modelled.
  const rotation = resolveRotation(character, gear, stats, skillDiff, missReduction, rawCritChance, meleeContext, talents)
  const specialRawDps = rotation.specials.reduce((sum, entry) => sum + entry.dps, 0)

  const mitigatedDps = (rawDps + specialRawDps) * (1 - armorMitigation)

  for (const entry of rotation.specials) {
    breakdown.push({ label: `${entry.name} DPS`, value: round(entry.dps * (1 - armorMitigation)) })
  }

  // Shown rather than kept internal: rage income is what decides whether the dump at the bottom of
  // the priority is worth anything, so a reader can see why it contributes what it does.
  if (rotation.ragePerSecond !== undefined && rotation.ragePerSecond > 0) {
    breakdown.push({ label: 'Rage per second', value: round(rotation.ragePerSecond) })
  }

  // Only shown when there is any, so it does not add a permanent 0 row to every melee readout —
  // Phase 2 gear carries no melee haste at all.
  if (hasteFraction > 0) {
    breakdown.push({ label: 'Attack speed increase', value: toPercent(hasteFraction) })
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
    specNote: specNoteFor(character),
    unmodelledTalentNote,
    metricLabel: 'Estimated DPS',
    score: round(mitigatedDps),
    scoreExact: mitigatedDps,
    summary: `White-damage attack-table estimate vs. a level ${target.level} target: weapon damage (where known) plus attack power, scaled by miss/dodge/glance/crit outcomes, then reduced by armor mitigation. Attacks are taken from behind the target, so parry and block cannot occur.${specialSummary}`,
    breakdown,
  }
}

function calculateCasterDps(
  character: CharacterProfile,
  stats: StatBlock,
  target: SimulationTarget,
  debuffs: ReturnType<typeof aggregateTargetDebuffs>,
  unmodelledTalentNote?: string,
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
    specNote: specNoteFor(character),
    unmodelledTalentNote,
    metricLabel: 'Estimated DPS',
    score: round(dps),
    scoreExact: dps,
    summary,
    breakdown,
  }
}

function calculateHealing(character: CharacterProfile, stats: StatBlock, unmodelledTalentNote?: string): SimulationResult {
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

  /*
   * The mana term. This estimate used to have none at all — a healer casting forever — which is the
   * single largest reason the Simulation tab is hidden.
   *
   * The deficit is reported rather than used to throttle the headline. Both a healer who casts flat
   * out until empty and one who paces to the sustainable rate are real, and picking one silently
   * would replace an overstated number with a differently wrong one. What was actually missing was
   * any statement that the rate costs more than it earns, and by how much.
   */
  const manaCost = cast.ability?.resource?.type === 'Mana' ? cast.ability.resource.cost : 0
  const mana = manaCost > 0 ? computeManaBudget({ manaCostPerCast: manaCost, castsPerSecond, healPerCast: expectedHealPerCast, mp5: stats.mp5 }) : undefined

  if (mana) {
    breakdown.push(
      { label: 'Mana per second spent', value: round(mana.spentPerSecond) },
      { label: 'Mana per second regained', value: round(mana.regenPerSecond) },
      { label: 'Healing per point of mana', value: round(mana.healingPerMana) },
      { label: 'Share of this rate regen can fund', value: toPercent(mana.sustainableFraction) },
    )
  }

  const manaNote = mana
    ? mana.deficitPerSecond > 0
      ? ` **This rate is not sustainable.** ${cast.label} costs ${manaCost} mana and at ${round(castsPerSecond)} casts/sec that is ${round(mana.spentPerSecond)} mana/sec against ${round(mana.regenPerSecond)} regained — a shortfall of ${round(mana.deficitPerSecond)}/sec, so regen alone funds ${toPercent(mana.sustainableFraction)}% of it. Note that while casting, an untalented healer regenerates from MP5 only: Spirit's contribution is gated behind Meditation and its equivalents, which are not modelled, so Spirit prices near zero here. How long you last before running dry is deliberately not given — that needs a mana pool, and class base mana is not in the pinned source.`
      : ` At ${round(castsPerSecond)} casts/sec this costs ${round(mana.spentPerSecond)} mana/sec against ${round(mana.regenPerSecond)} regained, so it is sustainable indefinitely.`
    : ' Mana is not modelled for this spec — its signature ability records no mana cost.'

  const summary = cast.ability
    ? `Heal crit/haste estimate modeling ${cast.label} at its real ${cast.castTimeSeconds}s cast, ${round(cast.baseAmount)} base healing, and ${cast.coefficient} healing coefficient. Single-ability approximation — no downranking, HoT overlap, or triage decisions.${manaNote}`
    : `Heal crit/haste estimate assuming a ${cast.label}. Scales from healing power only — this spec has no modeled signature cast.`

  return {
    role: 'Healer',
    specNote: specNoteFor(character),
    unmodelledTalentNote,
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
  unmodelledTalentNote?: string,
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
    { label: 'Health from Stamina', value: stats.stamina * HEALTH_PER_STAMINA },
    { label: 'Stamina', value: stats.stamina },
    { label: 'Block value', value: stats.blockValue },
    { label: 'Crit-taken reduction from Defense', value: critTakenReduction },
  ]

  /**
   * Effective Health: how much raw boss damage this character absorbs before dying, once avoidance,
   * block, armor and the severity of crits and crushes are all accounted for. Health divided by the
   * fraction of a swing that actually lands.
   *
   * This replaced a composite of `avoidance*2 + armor*1.5 + stamina*0.1`, whose weights were
   * invented. Effective Health is the metric TBC tanks were actually compared on, it has no free
   * parameters, and every tank stat earns its place in it rather than being assigned an importance.
   *
   * Two honest caveats. Classic Effective Health deliberately *excludes* avoidance, because avoidance
   * is random and does not save you from a burst sequence — including it here makes this an
   * average-case figure rather than a worst-case one, so it reads optimistic against exactly the
   * spike damage that kills tanks. And only Stamina-derived health is counted; a level 70's base
   * health is not modelled, which understates the absolute number and slightly overstates how much
   * each point of Stamina is worth.
   */
  const healthFromStamina = stats.stamina * HEALTH_PER_STAMINA
  const effectiveHealth = damagePerSwing > 0 ? healthFromStamina / damagePerSwing : healthFromStamina

  return {
    role: 'Tank',
    specNote: specNoteFor(character),
    unmodelledTalentNote,
    metricLabel: 'Effective Health',
    score: round(effectiveHealth),
    scoreExact: effectiveHealth,
    summary: `Effective Health — the raw boss damage you absorb before dying — against a level ${target.level} attacker. Swings resolve as one ordered roll (miss, dodge, parry, block, crit, crushing blow, hit) using the defender-side base chances, so a level gap lowers your avoidance rather than raising it, and crushing blows can only be pushed off the bottom of that table rather than reduced directly. Uncrittable still requires 490 total Defense Skill. Two caveats: avoidance is averaged in, where the classic metric excludes it because avoidance doesn't save you from a burst, so this reads optimistic against spike damage; and only Stamina-derived health is counted, since a level 70's base health isn't modelled.`,
    breakdown,
  }
}

/**
 * `talentPoints` reaches the simulation and **deliberately nothing else**.
 *
 * Talents change plenty that `calculateStats` would care about — Vitality's Stamina, Toughness's
 * armour — but routing them there moves the always-visible stat rail, every gear ranking and the
 * upgrade finder at once, on the strength of a model that has not been checked yet. Starting here
 * keeps the blast radius inside a tab that is hidden anyway, and leaves widening it as a later
 * decision rather than a side effect of this one.
 */
export function calculateSimulation(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  role: CharacterRole,
  activeTargetDebuffIds: readonly string[] = [],
  target: SimulationTarget = defaultSimulationTarget,
  talentPoints: TalentPoints = {},
): SimulationResult {
  const debuffs = aggregateTargetDebuffs(activeTargetDebuffIds)
  // Warrior-only for now: `talentEffects.json` covers one class, and a spec with no ingested effects
  // derives the identity modifiers, so this is a no-op everywhere else rather than a wrong answer.
  const talents = deriveTalentModifiers(talentPoints)

  const talentNote = unmodelledTalentNoteFor(character, talentPoints, role)

  if (role === 'Caster DPS') return calculateCasterDps(character, stats, target, debuffs, talentNote)
  if (role === 'Healer') return calculateHealing(character, stats, talentNote)
  if (role === 'Tank') return calculateTankSurvivability(character, gear, stats, target, talentNote)
  return calculatePhysicalDps(character, gear, stats, target, debuffs, talents, talentNote)
}
