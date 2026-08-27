import { getRotationAbilities, getSignatureAbility } from '../../domain/abilities'
import type { SignatureAbility } from '../../domain/abilities'
import { getTargetDebuffById } from '../../domain/buffs/sampleTargetDebuffs'
import { getBuffById } from '../../domain/buffs/sampleBuffs'
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
import type { WeaponDamageProfile } from '../../domain/simulation/specialAttacks'
import { WINDFURY_BONUS_ATTACK_POWER, estimateWindfury } from '../../domain/simulation/weaponImbues'
import { estimatePaladinHolyDamage } from '../../domain/simulation/paladinSeals'
import {
  HUNTER_PET_DEFAULT_FAMILY,
  HUNTER_PET_UNMODELLED,
  estimateHunterPet,
  hunterPetCritChance,
} from '../../domain/simulation/hunterPet'
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
import type { DamageSource, SimulationBreakdownEntry, SimulationResult } from './simulationTypes'

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

  /*
   * Periodic effects deliver over a duration rather than per cast, so the divisor for a DoT or HoT is
   * its duration — `baseAmount` below is the **whole** periodic total, and dividing that by a cast
   * time would deliver the entire DoT every time it is cast.
   *
   * **This used to be guarded on `castTimeSeconds === 0` and that was wrong.** The zero check was
   * written for the divide-by-zero an instant DoT causes, and a DoT that *has* a cast time fell
   * straight past it: Unstable Affliction is a 1.5s cast with an 18-second duration, so the model
   * delivered its full 18s of damage every 1.5 seconds — twelve times over, and enough to make
   * Affliction the one spec in the game that read *above* what players actually parse.
   *
   * `Math.max` rather than a branch, because both bounds are real: a DoT cannot be re-applied faster
   * than it can be cast, nor faster than it runs. Mind Flay is a 3s channel over a 3s duration and is
   * unaffected either way, which is the check that this is the right shape rather than a patch aimed
   * at one ability.
   */
  const periodicDuration = ability.periodic?.durationSeconds
  const isPeriodic = ability.effectType === 'DoT' || ability.effectType === 'HoT'
  const castTimeSeconds =
    isPeriodic && periodicDuration
      ? Math.max(ability.castTimeSeconds, periodicDuration)
      : ability.castTimeSeconds > 0
        ? ability.castTimeSeconds
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
   * **Unreachable as of 2026-08-19, and kept as a guard** — the same treatment `TalentsPanel` gives
   * its "class has no talents yet" path. All nine classes now carry ingested effects, so no class can
   * take this branch. It was the loud case while it lasted: a Mage could spend all 41 points and watch
   * the number not move, with nothing on screen to explain why. Deleting it would remove the safety
   * net for a tenth class or a failed ingest, either of which should say this rather than go silent.
   */
  if (!classHasTalentEffects(character.className)) {
    return (
      `Talent effects are only ingested for ${classesWithTalentEffects.join(' and ')} so far, so the ` +
      `${pointsSpent} points spent here reach this estimate not at all. The talents themselves are real ` +
      'and the tree is complete — it is the effect extraction that stops at those classes.'
    )
  }

  /*
   * The tank message used to say Effective Health read no talents at all. As of 2026-08-19 it reads
   * three — Anticipation, Deflection and Shield Specialization — and the remaining gap is a *specific*
   * one worth naming rather than a blanket absence, because the reason is a product decision rather
   * than missing work: Toughness and Vitality multiply armour and stamina, which `calculateStats`
   * owns, and routing talents there would move the always-visible stat rail, the gear rankings and
   * the upgrade finder.
   *
   * Falling through to the generic per-build note would be wrong here — that one says the listed
   * talents are "spent but not modelled", implying everything unlisted is counted, and for a tank the
   * unlisted set includes the two biggest survivability talents in the tree.
   */
  if (role === 'Tank') {
    /*
     * Named per class rather than as a fixed list, because the two tanks genuinely differ: Warrior's
     * Shield Specialization raises block **chance**, which the incoming-attack table rolls, while
     * Paladin's talent of the same name raises block **value**, which the table does not model at
     * all. Listing it for a Paladin would be a wrong caveat of exactly the kind this file keeps
     * having to correct — and it would be wrong in the confident direction.
     */
    const read =
      character.className === 'Warrior'
        ? 'Anticipation, Deflection and Shield Specialization'
        : 'Anticipation and Deflection'
    return (
      `Effective Health reads ${read}, which is where most of a tank tree's avoidance lives. Toughness ` +
      'and Vitality are not counted: they multiply armour and stamina, and talents do not reach the stat ' +
      'pipeline those come from — so this figure is low by whatever those two are worth to you.'
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
        physicalHitTakenBonus: totals.physicalHitTakenBonus + (debuff.physicalHitTakenBonus ?? 0),
        spellCritTakenBonus: totals.spellCritTakenBonus + (debuff.spellCritTakenBonus ?? 0),
        spellDamageTakenMultiplier: totals.spellDamageTakenMultiplier + (debuff.spellDamageTakenMultiplier ?? 0),
      }
    },
    { armorReduction: 0, physicalCritTakenBonus: 0, physicalHitTakenBonus: 0, spellCritTakenBonus: 0, spellDamageTakenMultiplier: 0 },
  )
}

/**
 * Sums the buff effects that are **not** stats, and so could not reach the simulator through
 * `calculateStats` like everything else.
 *
 * Flat and multiplied stats already arrive folded into `stats`. Percentage haste and a damage
 * multiplier have no `StatBlock` field to land in, which is precisely why every buff of that shape
 * was `notModelled` — the caveat described a missing field rather than a missing mechanic.
 */
function aggregateBuffEffects(activeBuffIds: readonly string[]) {
  return activeBuffIds.reduce(
    (totals, id) => {
      const buff = getBuffById(id)
      if (!buff) return totals
      return {
        hastePercent: totals.hastePercent + (buff.hastePercent ?? 0),
        damageMultiplier: totals.damageMultiplier + (buff.damageMultiplier ?? 0),
      }
    },
    { hastePercent: 0, damageMultiplier: 0 },
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
  /**
   * Mana per second the modelled shot rate spends. Reported, never enforced: nothing in `StatBlock`
   * holds a mana pool, so capping the rate on it would mean inventing the income too.
   */
  manaPerSecond?: number
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
 * What the ranged white-shot model already worked out, handed to the rotation the same way
 * `MeleeSwingContext` is.
 *
 * Passed rather than recomputed because every one of these is a gear-and-talent figure the caller
 * has already derived. Deriving them twice is how haste ends up applied differently in two places,
 * which is the failure the melee context was introduced to avoid.
 */
type RangedShotContext = {
  /** Seconds between auto shots after gear and talent haste. Undefined with nothing in the slot. */
  swingSeconds: number | undefined
  weapon: WeaponDamageProfile | undefined
  /** Ranged attack power, which is a different stat from the melee figure for every class that has both. */
  attackPower: number
  /** Ranged crit including Lethal Shots, matching the white-shot table rather than the shared figure. */
  rawCritChance: number
  /** Ranged Weapon Specialization. Upstream applies it to every ranged attack, Steady Shot included. */
  damageMultiplier: number
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
  ranged?: RangedShotContext,
): ResolvedRotation {
  /*
   * Which kind of yellow damage this spec layers on. The filter used to be the literal
   * `'Melee Special'`, and that one word is what kept every hunter's Steady Shot out of the model —
   * not missing data, and not a missing mechanism. The ability was catalogued, sourced and correct,
   * and `resolveRotation` simply never looked at it, so a hunter's estimate did not so much as name
   * the button they press all fight.
   */
  const effectType = ranged ? 'Ranged Special' : 'Melee Special'
  const abilities = getRotationAbilities(character.className, character.spec).filter(
    (ability) => ability.effectType === effectType,
  )

  const expertiseSkillPoints = stats.expertiseRating / EXPERTISE_RATING_PER_SKILL_POINT + talents.expertiseSkillPoints

  /*
   * A ranged special is rolled on the ranged table, which has no dodge, parry, block or glance —
   * a shot taken from outside melee range cannot be any of them. Reusing the melee special table
   * would have subtracted a dodge chance that does not exist.
   */
  let effectiveMultiplier: number
  if (ranged) {
    const table = buildRangedAttackTable({ skillDiff, missReduction, rawCritChance: ranged.rawCritChance })
    // No block term to add: a shot from range cannot be blocked, so there is nothing to fold in.
    effectiveMultiplier = table.hit + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER
  } else {
    // A melee DPS spends the whole fight behind the boss, where parry and block cannot happen.
    const table = buildSpecialAttackTable({ skillDiff, expertiseSkillPoints, missReduction, rawCritChance, attacksFromBehind: true })
    // Blocked specials still land, just reduced; the block value itself isn't modelled, so a blocked
    // hit is counted at full damage here rather than pretending to know the reduction.
    effectiveMultiplier = table.hit + table.block + table.crit * MELEE_CRIT_DAMAGE_MULTIPLIER
  }

  const specials: ResolvedSpecial[] = []
  const excluded: ResolvedRotation['excluded'] = []
  let gcdBudget = 1 / (abilities[0]?.gcdSeconds || 1.5)
  let energyBudget = ENERGY_PER_SECOND
  // A third shared budget, and the one that was missing. Cooldown abilities spend from it in
  // priority order and whatever survives funds the dump at the bottom of the list.
  let rageBudget = melee?.ragePerSecond ?? 0
  // Counted, not budgeted — see `manaPerSecond` on the return type for why the distinction matters.
  let manaSpent = 0
  let contended = false

  // Cat form swings its own internal weapon, so a Feral druid's specials must not read the equipped
  // item's damage dice — and it has no off-hand to strike with.
  const catForm = usesCatFormWeapon(character.className, character.spec)
  const mainHandProfile = ranged ? ranged.weapon : catForm ? CAT_FORM_WEAPON : gear['Main Hand']?.item
  const offHandProfile = ranged || catForm ? undefined : gear['Off Hand']?.item

  // Steady Shot normalises to the 2.8s ranged speed and scales off *ranged* attack power. Handing it
  // the melee figure would have been silently wrong for every hunter, since the two differ.
  const specialAttackPower = ranged ? ranged.attackPower : stats.attackPower

  for (const ability of abilities) {
    const estimate = estimateSpecialAttack(ability, mainHandProfile, offHandProfile, specialAttackPower, {
      rangedSwingSeconds: ranged?.swingSeconds,
    })
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
    if (ability.resource?.type === 'Mana') manaSpent += usesPerSecond * ability.resource.cost

    if (usesPerSecond > 0) {
      /*
       * Ranged Weapon Specialization multiplies this too. wowsims applies it as a blanket
       * `RangedDamageDealtMultiplier` at the pinned commit rather than gating it on a proc mask, so
       * it reaches Steady Shot exactly as it reaches an auto shot — read from `sim/hunter/talents.go`
       * rather than assumed from the talent's wording, which says "ranged weapon" and could be taken
       * either way. The melee path applies no equivalent to its specials, and that asymmetry is a
       * pre-existing gap rather than something this introduced.
       */
      const damageMultiplier = ranged ? ranged.damageMultiplier : 1
      specials.push({
        name: ability.name,
        dps: estimate.damagePerUse * effectiveMultiplier * damageMultiplier * usesPerSecond,
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

  return { specials, excluded, contended, ragePerSecond: melee?.ragePerSecond, manaPerSecond: manaSpent }
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

/**
 * Turns a list of named DPS figures into shares, dropping anything that contributes nothing.
 *
 * Sorted by size, because the first question anyone asks a damage table is "what is the biggest
 * thing here" and a log answers it by sorting. Zero-DPS rows are dropped rather than shown at 0%:
 * an ability that contributes nothing is reported through `excluded` with a *reason*, and a silent
 * 0% row would say the same thing while explaining nothing.
 */
function toDamageSources(sources: readonly { name: string; dps: number }[]): DamageSource[] {
  const total = sources.reduce((sum, source) => sum + source.dps, 0)
  if (total <= 0) return []

  return sources
    .filter((source) => source.dps > 0)
    .map((source) => ({ name: source.name, dps: source.dps, share: source.dps / total }))
    .sort((a, b) => b.dps - a.dps)
}

function calculatePhysicalDps(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  target: SimulationTarget,
  debuffs: ReturnType<typeof aggregateTargetDebuffs>,
  talents: TalentModifiers = noTalentModifiers,
  unmodelledTalentNote?: string,
  buffs: ReturnType<typeof aggregateBuffEffects> = { hastePercent: 0, damageMultiplier: 0 },
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
  /*
   * Debuff hit joins here rather than anywhere downstream because it is attacker hit, not target
   * avoidance: Improved Faerie Fire raises the chance an attack lands, exactly as hit rating does.
   * One term therefore reaches all three tables — white swings, specials through `resolveRotation`,
   * and the ranged table — and each floors miss at zero, so a raid at the hit cap gains nothing.
   */
  const missReduction =
    ratingToFraction(stats.hitRating, RATING_PER_PERCENT.meleeHit) + talents.meleeHitChance + debuffs.physicalHitTakenBonus

  // Improved Berserker Stance multiplies attack power, so it has to land before any of the
  // attack-power-derived damage below rather than being added to the total afterwards.
  // Flat talent attack power lands BEFORE the multiplier, matching upstream: Predatory Strikes
  // adds a stat, and Improved Berserker Stance then scales the total.
  const attackPower = (stats.attackPower + talents.flatAttackPower) * talents.attackPowerMultiplier

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
  /*
   * Percentage haste from buffs joins gear haste additively, which is how TBC stacks them — Bloodlust
   * is 30% whatever the gear says, and it does not pass through the rating conversion at all.
   */
  const gearAttackSpeedMultiplier = 1 + hasteFraction + buffs.hastePercent

  let breakdown: SimulationBreakdownEntry[]
  let rawDps: number
  // Only the melee path builds this. A Hunter's ranged auto attacks generate no rage at all, so
  // leaving it undefined is what keeps the rage budget from being offered to a spec that has none.
  let meleeContext: MeleeSwingContext | undefined
  // And its mirror. Exactly one of the two is ever set, which is what tells `resolveRotation` which
  // kind of special this spec layers and which table to roll it on.
  let rangedContext: RangedShotContext | undefined
  // Windfury is white damage rather than a special, so it is folded into `rawDps` inside the melee
  // branch and kept here only so the breakdown and the summary can name what it contributed.
  let windfury: ReturnType<typeof estimateWindfury> | undefined
  /*
   * Retribution's seal and judgement, which are **Holy** and therefore not reduced by armor. Kept out
   * of `rawDps` for exactly that reason: everything in `rawDps` gets mitigated once at the end, and
   * this must not be.
   */
  let paladinHoly: ReturnType<typeof estimatePaladinHolyDamage> | undefined
  /*
   * White damage, itemised as it is built rather than reconstructed afterwards.
   *
   * `rawDps` stays exactly as it was and is still what the total is computed from — this records the
   * same numbers a second time so they can be reported per source. Deriving the split afterwards
   * would mean recomputing terms and risking a decomposition that does not add up to the answer.
   */
  const whiteSources: { name: string; raw: number }[] = []
  /*
   * Kept apart from `whiteSources` because a pet's damage is already post-armour when it arrives —
   * it is a separate actor with its own table, so it cannot ride the player's mitigation step.
   */
  let hunterPet: ReturnType<typeof estimateHunterPet> | undefined

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
    /*
     * Everything the shot rotation needs, taken from the figures this branch has already derived
     * rather than recomputed. The swing interval is the white-shot speed after gear haste and
     * Serpent's Swiftness — the same two multipliers `rawDps` above is scaled by, which is the point
     * of reading it from here instead of deriving it a second time.
     */
    const rangedSwingSeconds = rangedItem?.weaponSpeed
      ? rangedItem.weaponSpeed / (gearAttackSpeedMultiplier * talents.rangedAttackSpeedMultiplier)
      : undefined

    whiteSources.push({ name: 'Auto Shot', raw: rawDps })

    /*
     * The pet, which is a **second attacker** rather than an ability — its own attack power, its own
     * crit, its own weapon, none of which `SignatureAbility` can express. Every hunter estimate
     * before this described a hunter standing alone.
     *
     * Its table is built here rather than reused: a pet inherits **no crit at all** from its owner
     * (upstream inherits attack power, spell power, stamina and armour, and nothing else), so it
     * rolls on its own crit chance and would be badly overstated on the hunter's.
     *
     * The two figures that are *not* zero are the pet's own talents. Ferocity is crit the pet has
     * and the hunter does not; Animal Handler is the same for hit. They enter the pet's table and
     * only the pet's table, which is the whole reason they are separate `TalentModifiers` fields
     * rather than the melee ones.
     */
    const petTable = buildWhiteAttackTable({
      skillDiff,
      dualWield: false,
      expertiseSkillPoints: 0,
      missReduction: talents.petHitChance,
      rawCritChance: hunterPetCritChance() + talents.petCritChance,
      attacksFromBehind: true,
    })
    const petGlance = computeGlanceDamageRange(skillDiff)
    const petMultiplier =
      petTable.hit +
      petTable.block +
      petTable.crit * MELEE_CRIT_DAMAGE_MULTIPLIER +
      petTable.glance * ((petGlance.low + petGlance.high) / 2)

    /*
     * **A second table for the pet, because Bite and Claw are specials and cannot glance.** Reusing
     * the white one would price them at a glancing blow's reduced damage on a share of every use —
     * the same distinction the player's own yellow damage already makes, applied to the other actor.
     */
    const petSpecialTable = buildSpecialAttackTable({
      skillDiff,
      expertiseSkillPoints: 0,
      missReduction: talents.petHitChance,
      rawCritChance: hunterPetCritChance() + talents.petCritChance,
      attacksFromBehind: true,
    })

    hunterPet = estimateHunterPet({
      ownerRangedAttackPower: stats.rangedAttackPower,
      attackTableMultiplier: petMultiplier,
      specialAttackTableMultiplier:
        petSpecialTable.hit + petSpecialTable.block + petSpecialTable.crit * MELEE_CRIT_DAMAGE_MULTIPLIER,
      armorMitigation,
      talents: {
        damageMultiplier: talents.petDamageMultiplier,
        meleeSpeedMultiplier: talents.petMeleeSpeedMultiplier,
        focusRegenMultiplier: talents.petFocusRegenMultiplier,
      },
    })

    rangedContext = {
      swingSeconds: rangedSwingSeconds,
      weapon: rangedItem,
      attackPower: stats.rangedAttackPower,
      rawCritChance: rawCritChance + talents.rangedCritChance,
      damageMultiplier: talents.rangedDamageMultiplier,
    }

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
    whiteSources.push({ name: 'Melee main hand', raw: mainHandDps })
    if (offHandDps > 0) whiteSources.push({ name: 'Melee off hand', raw: offHandDps })

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

    /*
     * Windfury Weapon, which is most of what an Enhancement shaman does and reached nothing until
     * now — the spec's own ability notes said its damage "is dominated by Windfury Weapon procs on
     * white swings" while the model counted none of them.
     *
     * Gated on the class rather than the spec deliberately: Shaman's only Physical DPS spec is
     * Enhancement, so this branch is already the Enhancement branch, and naming the spec would add a
     * condition that cannot be false. Elemental and Restoration never reach here at all.
     *
     * **Assumed, and worth stating: the main hand carries Windfury.** That is what an Enhancement
     * shaman runs in Phase 2, but this app has no weapon-imbue slot to read, so it is a stated
     * convention rather than something the character told us. Flametongue on the off-hand is not
     * modelled, and upstream's higher 36% chance for *both* hands imbued is therefore not used.
     */
    if (character.className === 'Shaman' && mainHandItem) {
      /*
       * Landed, not swung. Upstream gates the proc on `Landed()`, so miss, dodge and parry cannot
       * roll it — while a glance and a block both can, which is why they are in this sum.
       */
      const landedFraction = fullTable.hit + fullTable.crit + fullTable.glance + fullTable.block

      /*
       * The extra attack swings the main hand with +475 attack power, and is a normal white attack:
       * it rolls the same table, glancing included. It does **not** take `attackSpeedMultiplier` —
       * haste already reached this through the proc rate, and applying it again would count it twice.
       */
      const damagePerExtraAttack =
        averageSwingDamage(mainHandItem, attackPower + WINDFURY_BONUS_ATTACK_POWER, false) *
        effectiveMultiplier *
        physicalMultiplier

      /*
       * The off hand carries Windfury too, which is what an Enhancement shaman runs and what the
       * reference parse shows — two `Windfury Attack` rows and no Flametongue. Its extra attacks are
       * ordinary off-hand swings, so they take the off-hand penalty and the off-hand talent
       * multiplier exactly as the white off-hand damage above does.
       */
      const offHandWindfuryDamage =
        dualWield && offHandItem
          ? averageSwingDamage(offHandItem, attackPower + WINDFURY_BONUS_ATTACK_POWER, false) *
            0.5 *
            talents.offHandDamageMultiplier *
            effectiveMultiplier *
            physicalMultiplier
          : 0

      windfury = estimateWindfury({
        mainHandSwingsPerSecond,
        offHandSwingsPerSecond: dualWield && offHandItem?.weaponSpeed ? attackSpeedMultiplier / offHandItem.weaponSpeed : 0,
        landedFraction,
        damagePerExtraAttack,
        damagePerOffHandExtraAttack: offHandWindfuryDamage,
      })

      rawDps += windfury.dps
      // Split by hand, because a log reports two Windfury rows and a reader comparing them wants the
      // same two here rather than one number they have to take apart.
      if (windfury.mainHandDps > 0) whiteSources.push({ name: 'Windfury main hand', raw: windfury.mainHandDps })
      if (windfury.offHandDps > 0) whiteSources.push({ name: 'Windfury off hand', raw: windfury.offHandDps })
    }

    /*
     * Retribution's Holy damage: the seal on every landed swing, and the judgement on its cooldown.
     *
     * Gated on the class rather than the spec for the same reason Windfury is: Retribution is the
     * only Paladin spec that reaches this branch, since Holy is a Healer and Protection a Tank.
     *
     * **Faction decides which seal, and the gap is enormous.** Seal of Blood is a Blood Elf spell, so
     * Horde only in Phase 2 — Judgement of Blood hits for 295-325 against Judgement of Command's
     * 68-73. Modelling one for both factions would have been wrong by a factor of four.
     */
    if (character.className === 'Paladin' && mainHandItem) {
      paladinHoly = estimatePaladinHolyDamage({
        faction: character.faction,
        mainHandSwingsPerSecond,
        landedFraction: fullTable.hit + fullTable.crit + fullTable.glance + fullTable.block,
        mainHandSwingDamage,
        spellPower: stats.spellPower,
        critChance: fullTable.crit,
      })
    }

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

  /*
   * Yellow (special) damage, layered on top of the white model above — for both paths now.
   *
   * The comment that stood here said the ranged special was excluded because "its sustained rate
   * depends on auto-shot weaving that isn't modelled". That was true when written and is the reason
   * this was worth doing: the weave is now two computable ceilings rather than an unknown, so
   * Steady Shot reaches all three hunter specs. See `computeUsageRate`'s weave branch.
   */
  const rotation = resolveRotation(
    character,
    gear,
    stats,
    skillDiff,
    missReduction,
    rawCritChance,
    meleeContext,
    talents,
    rangedContext,
  )
  const specialRawDps = rotation.specials.reduce((sum, entry) => sum + entry.dps, 0)

  /*
   * Armor reduces physical damage and nothing else, so the Holy total is added **after** mitigation
   * rather than inside it. Before Retribution's seals existed every damage source on this path was
   * physical and the distinction could not arise; folding Holy damage into `rawDps` would have
   * quietly shaved a third off it against a raid boss.
   */
  const unmitigatedDps = paladinHoly?.totalDps ?? 0
  /*
   * A buff damage multiplier scales everything, physical and Holy alike — Ferocious Inspiration is
   * "damage dealt", with no school attached — so it lands on the total rather than inside either half.
   */
  const damageMultiplier = 1 + buffs.damageMultiplier
  const mitigatedDps =
    ((rawDps + specialRawDps) * (1 - armorMitigation) + unmitigatedDps) * damageMultiplier +
    (hunterPet?.dps ?? 0) * damageMultiplier

  /*
   * The same total, itemised. Every physical source takes armour and the damage multiplier; the Holy
   * sources take only the multiplier, which is the one asymmetry in this list and the reason it is
   * built here rather than by scaling a flat list uniformly.
   *
   * A test asserts these sum to `mitigatedDps`. That is what makes the decomposition worth having:
   * a source dropped, double-counted, or mitigated on the wrong side of the armour term shows up as
   * a sum that no longer matches the answer, instead of as a plausible row nobody checks.
   */
  const physical = (raw: number) => raw * (1 - armorMitigation) * damageMultiplier
  // Already mitigated by its own model, so it takes the damage multiplier and nothing else.
  const petDps = (hunterPet?.dps ?? 0) * damageMultiplier
  const sources: { name: string; dps: number }[] = [
    ...whiteSources.map((entry) => ({ name: entry.name, dps: physical(entry.raw) })),
    ...rotation.specials.map((special) => ({ name: special.name, dps: physical(special.dps) })),
  ]
  /*
   * The pet is split into its auto attack and each focus ability rather than reported as one row.
   *
   * That split is worth the extra rows because the two halves behave completely differently: the
   * white damage scales with the owner's ranged attack power, while Bite and Claw are flat rolls that
   * do not scale at all. One "Pet" line would hide a source that shrinks as a share of every upgrade
   * behind one that grows, and the whole point of this table is that a change shows up per source.
   */
  if (hunterPet && hunterPet.whiteDps > 0) sources.push({ name: 'Pet melee', dps: hunterPet.whiteDps * damageMultiplier })
  for (const ability of hunterPet?.abilities ?? []) {
    if (ability.dps > 0) sources.push({ name: `Pet ${ability.name}`, dps: ability.dps * damageMultiplier })
  }
  if (paladinHoly) {
    sources.push({ name: paladinHoly.sealName, dps: paladinHoly.sealDps * damageMultiplier })
    sources.push({ name: paladinHoly.judgementName, dps: paladinHoly.judgementDps * damageMultiplier })
  }

  for (const entry of rotation.specials) {
    breakdown.push({ label: `${entry.name} DPS`, value: round(entry.dps * (1 - armorMitigation)) })
  }

  /*
   * Shown rather than kept internal: rage income is what decides whether the dump at the bottom of
   * the priority is worth anything, so a reader can see why it contributes what it does.
   *
   * **Gated on the spec actually having a rage-costed ability**, which it was not. Rage is derived
   * from swings for every melee spec because the arithmetic is the same, so the row appeared for a
   * Combat Rogue (4.1) and an Enhancement Shaman (3.9) — classes with no rage bar at all. The figure
   * was inert either way, since nothing in those rotations spends it, so this was a display bug
   * rather than a wrong number, and reads worse than one: a reader has no way to tell an inert row
   * from a meaningful one.
   */
  const spendsRage = getRotationAbilities(character.className, character.spec).some(
    (ability) => ability.resource?.type === 'Rage',
  )
  if (spendsRage && rotation.ragePerSecond !== undefined && rotation.ragePerSecond > 0) {
    breakdown.push({ label: 'Rage per second', value: round(rotation.ragePerSecond) })
  }

  /*
   * Named individually rather than as one "Holy damage" line, because which seal a paladin is running
   * is a faction fact a reader will want to see stated rather than inferred from a number.
   */
  if (hunterPet) {
    breakdown.push({ label: 'Pet DPS', value: round(petDps) })
    breakdown.push({ label: 'Pet attack power', value: round(hunterPet.attackPower) })
    /*
     * Shown for the same reason the hunter's own mana drain is: the ability rate is derived from
     * this number and is bounded by it rather than by the global cooldown, so a reader who wants to
     * know why Bite lands as rarely as it does needs the income in front of them.
     */
    if (hunterPet.abilityDps > 0) {
      breakdown.push({ label: 'Pet focus per second', value: round(hunterPet.focusPerSecond) })
      for (const ability of hunterPet.abilities) {
        breakdown.push({ label: `Pet ${ability.name} per minute`, value: round(ability.usesPerSecond * 60) })
      }
    }
  }

  if (paladinHoly && paladinHoly.totalDps > 0) {
    breakdown.push({ label: `${paladinHoly.sealName} DPS`, value: round(paladinHoly.sealDps) })
    breakdown.push({ label: `${paladinHoly.judgementName} DPS`, value: round(paladinHoly.judgementDps) })
  }

  /*
   * Windfury is folded into white damage rather than layered as a special, so without this row a
   * reader would see a shaman's total move with no line saying why.
   */
  if (windfury && windfury.dps > 0) {
    breakdown.push({ label: 'Windfury Weapon DPS', value: round(windfury.dps * (1 - armorMitigation)) })
    // Split by hand, because a log reports it that way and a reader comparing the two wants the
    // same shape rather than one number they have to take on trust.
    if (windfury.offHandDps > 0) {
      breakdown.push({ label: 'Windfury main hand DPS', value: round(windfury.mainHandDps * (1 - armorMitigation)) })
      breakdown.push({ label: 'Windfury off hand DPS', value: round(windfury.offHandDps * (1 - armorMitigation)) })
    }
    breakdown.push({ label: 'Windfury procs per minute', value: round(windfury.procsPerSecond * 60) })
  }

  /*
   * The same treatment for the other direction. `StatBlock` has no mana field, so the shot rate is
   * **not** capped by mana — which means the drain it assumes has to be visible rather than buried,
   * or the estimate would quietly assume infinite mana and say nothing about it. A hunter sustains
   * this with Aspect of the Viper, Judgement of Wisdom and potions, none of which are modelled here.
   */
  if (rotation.manaPerSecond !== undefined && rotation.manaPerSecond > 0) {
    breakdown.push({ label: 'Mana per second spent', value: round(rotation.manaPerSecond) })
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

  /*
   * The family is named rather than left implicit. Upstream reads it from a picker this app does not
   * have, and the eight families span 0.91 to 1.1 on damage dealt — so a reader running a Bear needs
   * to be told this number is not about their pet, rather than discovering it by disagreeing with it.
   */
  const petSummary = hunterPet
    ? ` The pet is counted as a second attacker, modelled as a ${HUNTER_PET_DEFAULT_FAMILY} — the damage families span 0.91 to 1.1 upstream and this app has no pet picker — and ${HUNTER_PET_UNMODELLED}`
    : ''

  const holySummary = paladinHoly
    ? ` ${paladinHoly.sealName} rides every landed swing and ${paladinHoly.judgementName} lands on its 10s cooldown; both are Holy, so armor does not reduce them. Which seal you get is decided by faction — Seal of Blood is Horde-only in Phase 2.`
    : ''

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
    damageSources: toDamageSources(sources),
    summary: `White-damage attack-table estimate vs. a level ${target.level} target: weapon damage (where known) plus attack power, scaled by miss/dodge/glance/crit outcomes, then reduced by armor mitigation. Attacks are taken from behind the target, so parry and block cannot occur.${specialSummary}${holySummary}${petSummary}`,
    breakdown,
  }
}

/**
 * A caster spec that maintains several damage-over-time effects and fills the gaps with a nuke.
 *
 * **This is the multi-DoT shape `ROTATION-SCOPE.md` filed under stage 3, and it turned out not to
 * need a timeline.** DoTs do not compete for a resource the way energy abilities do — they compete
 * for *globals*. A DoT refreshed on its own duration costs `gcd / duration` of every second and
 * returns `damagePerApplication / duration` of damage, both of which are closed-form. Whatever
 * fraction of the second the DoTs do not spend goes to the filler.
 *
 * Two mechanics decide whether the answer is right, and both are TBC-specific:
 *
 * **DoTs cannot crit in TBC.** Periodic damage rolls no crit at all without talents this app does
 * not model, so the crit multiplier applies to the filler and to nothing else. Applying it to the
 * DoTs would have inflated the largest share of an Affliction warlock's damage.
 *
 * **A DoT is applied once per duration, not once per cast.** `totalBaseAmount` is the whole DoT, so
 * dividing it by anything shorter than its duration delivers it more often than the game does — the
 * bug that made Affliction the one spec reading above what players parse.
 */
function resolveCasterRotation(
  abilities: readonly SignatureAbility[],
  spellPower: number,
  spellCritMultiplier: number,
  hastePercent: number,
): { dots: { name: string; dps: number }[]; filler?: { name: string; dps: number; castsPerSecond: number }; gcdShare: number } {
  /*
   * **A channel is a filler, not a maintained DoT**, and `channeled` is what separates them. You
   * re-channel Mind Flay continuously in whatever globals are spare; you do not "keep it up" the way
   * Shadow Word: Pain is kept up. Counting it as a maintained DoT would credit its whole damage every
   * 3 seconds *and* charge 3 seconds of global for it, which is the same double-count in both
   * directions.
   */
  const dots = abilities.filter((ability) => ability.effectType === 'DoT' && ability.periodic && !ability.channeled)
  const channel = abilities.find((ability) => ability.channeled && ability.periodic)

  /*
   * A direct cast on a cooldown is pressed on cooldown, not used as filler — Mind Blast is the spike
   * a Shadow priest clips a channel to catch. It takes its own share of the globals, and what is left
   * after the DoTs and it goes to the filler.
   */
  const cooldowns = abilities.filter((ability) => ability.effectType === 'Direct Damage' && ability.cooldownSeconds)
  const filler = abilities.find((ability) => ability.effectType === 'Direct Damage' && !ability.cooldownSeconds) ?? channel

  let gcdShare = 0
  const resolved: { name: string; dps: number }[] = []

  for (const dot of dots) {
    const duration = dot.periodic!.durationSeconds
    if (duration <= 0) continue

    /*
     * A hybrid DoT lands part of its damage on impact — Immolate is 332 Fire immediately and 615 more
     * over 15 seconds — so `baseAmount` counts alongside the periodic total. Reading only the
     * periodic half would drop a third of that spell on the floor.
     */
    const direct = dot.baseAmount ? (dot.baseAmount.min + dot.baseAmount.max) / 2 : 0
    const perApplication =
      direct + (dot.periodic!.totalBaseAmount ?? 0) + spellPower * (dot.scaling.spellPowerCoefficient ?? 0)

    /*
     * The global a refresh costs, as a share of each second. An instant DoT costs its GCD; one with a
     * cast time costs the cast, since that is the longer of the two and is what the caster is
     * actually occupied for.
     */
    const occupies = Math.max(dot.gcdSeconds || 1.5, dot.castTimeSeconds) / (1 + hastePercent)
    gcdShare += occupies / duration

    resolved.push({ name: dot.name, dps: perApplication / duration })
  }

  /*
   * Cooldowns next, before the filler, because they take priority in the real rotation and the filler
   * is by definition what happens with the time nothing else wants.
   */
  const onCooldown: { name: string; dps: number }[] = []
  for (const ability of cooldowns) {
    const cooldown = ability.cooldownSeconds ?? 0
    if (cooldown <= 0) continue

    const occupies = Math.max(ability.gcdSeconds || 1.5, ability.castTimeSeconds) / (1 + hastePercent)
    gcdShare += occupies / cooldown

    const base = ability.baseAmount ? (ability.baseAmount.min + ability.baseAmount.max) / 2 : 0
    // Direct damage, so this one *does* crit — it is the only critable spell a Shadow priest has.
    const perCast = (base + spellPower * (ability.scaling.spellPowerCoefficient ?? 0)) * spellCritMultiplier
    onCooldown.push({ name: ability.name, dps: perCast / cooldown })
  }

  if (!filler) return { dots: [...resolved, ...onCooldown], gcdShare }

  /*
   * The filler gets whatever is left of the second. Clamped at zero because a spec whose DoTs alone
   * overrun the global budget has no room for one — that does not happen with these four, and a
   * negative cast rate would be worse than no filler at all.
   */
  const freeShare = Math.max(0, 1 - gcdShare)
  const castTime = Math.max(filler.castTimeSeconds, filler.gcdSeconds || 1.5) / (1 + hastePercent)
  const castsPerSecond = castTime > 0 ? freeShare / castTime : 0

  /*
   * A channel delivers its `periodic` total over the channel; a hard cast delivers its `baseAmount`
   * in one lump. Both are "damage per cast" once you know which field to read.
   */
  const base = filler.periodic
    ? (filler.periodic.totalBaseAmount ?? 0)
    : filler.baseAmount
      ? (filler.baseAmount.min + filler.baseAmount.max) / 2
      : 0

  /*
   * **Crit reaches direct damage and nothing else.** TBC gives no crit to periodic damage, and a
   * channel is periodic — Mind Flay's ticks could not crit until a later expansion. So a Shadow
   * priest's filler is uncritable where an Affliction warlock's Shadow Bolt is not, and applying one
   * spec's rule to the other would have been wrong in whichever direction it was copied.
   */
  const critMultiplier = filler.effectType === 'Direct Damage' ? spellCritMultiplier : 1
  const perCast = (base + spellPower * (filler.scaling.spellPowerCoefficient ?? 0)) * critMultiplier

  return {
    dots: [...resolved, ...onCooldown],
    filler: { name: filler.name, dps: perCast * castsPerSecond, castsPerSecond },
    gcdShare,
  }
}

function calculateCasterDps(
  character: CharacterProfile,
  stats: StatBlock,
  target: SimulationTarget,
  debuffs: ReturnType<typeof aggregateTargetDebuffs>,
  talents: TalentModifiers = noTalentModifiers,
  unmodelledTalentNote?: string,
  buffs: ReturnType<typeof aggregateBuffEffects> = { hastePercent: 0, damageMultiplier: 0 },
): SimulationResult {
  const cast = resolveCastProfile(character, GENERIC_NUKE_CAST_TIME)
  const levelDiff = target.level - PLAYER_LEVEL
  /*
   * Talent hit joins the *rating-derived* figure rather than the finished chance, because
   * `computeSpellHitChance` floors miss at 1% and talent hit has to sit on the same side of that
   * floor. Added to the result instead, a hit-capped caster would be pushed past 100%.
   */
  const spellHitChance = computeSpellHitChance(
    levelDiff,
    ratingToFraction(stats.spellHitRating, RATING_PER_PERCENT.spellHit) + talents.spellHitChance,
  )
  const spellCritChance =
    computeSpellCritChance(ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit) + talents.spellCritChance) +
    debuffs.spellCritTakenBonus
  // Percentage haste from buffs is not rating and does not pass through the conversion: Bloodlust is
  // 30% of cast speed whatever the gear says, exactly as it is 30% of swing speed for a melee spec.
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste) + buffs.hastePercent
  const effectiveCastTime = cast.castTimeSeconds / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const damagePerCast =
    (cast.baseAmount + stats.spellPower * cast.coefficient) *
    (1 + debuffs.spellDamageTakenMultiplier) *
    talents.spellDamageMultiplier
  const expectedDamagePerCast = damagePerCast * (1 + spellCritChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1))
  /*
   * A buff damage multiplier scales the finished figure. School-scoped ones are still refused —
   * Sanctity Aura is Holy only and nothing here records a spell school — so what lands is the
   * school-agnostic kind, which today is Ferocious Inspiration.
   */
  const singleAbilityDps = expectedDamagePerCast * spellHitChance * castsPerSecond * (1 + buffs.damageMultiplier)

  const breakdown: SimulationBreakdownEntry[] = [
    { label: 'Base damage per cast', value: round(cast.baseAmount) },
    { label: 'Spell power scaling', value: round(stats.spellPower * cast.coefficient * castsPerSecond) },
    { label: 'Spell hit chance', value: toPercent(spellHitChance) },
    { label: 'Spell crit chance', value: toPercent(spellCritChance) },
    { label: 'Casts per second', value: round(castsPerSecond) },
  ]

  /*
   * A spec that maintains several DoTs is a different calculation from one that repeats a nuke, and
   * the single-ability figure above is simply wrong for it — not imprecise. Where the ability data
   * describes a multi-spell rotation, that is what gets scored.
   */
  const rotationAbilities = getRotationAbilities(character.className, character.spec)
  /*
   * A rotation is "one or more maintained DoTs plus something else", not "two or more DoTs" — the
   * first version required two and quietly left Destruction on the single-ability path, where its one
   * maintained Immolate could not reach the estimate at all.
   */
  const maintainedDots = rotationAbilities.filter((ability) => ability.effectType === 'DoT' && !ability.channeled)
  const multiSpell = maintainedDots.length >= 1 && rotationAbilities.length > 1
  const rotation = multiSpell
    ? resolveCasterRotation(
        rotationAbilities,
        stats.spellPower,
        1 + spellCritChance * (SPELL_CRIT_DAMAGE_MULTIPLIER - 1),
        hastePercent,
      )
    : undefined

  let dps = singleAbilityDps
  let casterSources: { name: string; dps: number }[] = [{ name: cast.label, dps: singleAbilityDps }]

  if (rotation) {
    const shared = (1 + debuffs.spellDamageTakenMultiplier) * talents.spellDamageMultiplier * (1 + buffs.damageMultiplier)
    const dotDps = rotation.dots.reduce((sum, dot) => sum + dot.dps, 0) * spellHitChance * shared
    const fillerDps = (rotation.filler?.dps ?? 0) * spellHitChance * shared
    dps = dotDps + fillerDps

    /*
     * Every spell in the rotation, itemised. The caster path is the easy half of this: the resolver
     * already returns each DoT and the filler separately, so the decomposition is the same numbers
     * the total is built from rather than a second derivation.
     */
    casterSources = [
      ...rotation.dots.map((dot) => ({ name: dot.name, dps: dot.dps * spellHitChance * shared })),
      ...(rotation.filler ? [{ name: rotation.filler.name, dps: fillerDps }] : []),
    ]

    for (const dot of rotation.dots) {
      breakdown.push({ label: `${dot.name} DPS`, value: round(dot.dps * spellHitChance * shared) })
    }
    if (rotation.filler) {
      breakdown.push({ label: `${rotation.filler.name} DPS`, value: round(fillerDps) })
      breakdown.push({ label: `${rotation.filler.name} casts per second`, value: round(rotation.filler.castsPerSecond) })
    }
    breakdown.push({ label: 'Globals spent refreshing DoTs', value: toPercent(rotation.gcdShare) })
  }

  const rotationSummary = rotation
    ? ` ${rotation.dots.length} damage-over-time effects maintained on their own durations, costing ${toPercent(rotation.gcdShare)}% of the globals, with ${rotation.filler?.name ?? 'nothing'} filling the rest. **DoTs do not crit in TBC**, so the crit multiplier reaches the filler only.`
    : ''

  const summary = cast.ability
    ? `Spell hit/crit table vs. a level ${target.level} target using TBC rating conversions, modeling ${cast.label} at its real ${cast.castTimeSeconds}s cast, ${round(cast.baseAmount)} base damage, and ${cast.coefficient} spell-power coefficient.${rotationSummary || " Single-ability approximation — cooldowns, procs, and multi-spell rotation priority aren't modeled."}`
    : `Spell hit/crit table vs. a level ${target.level} target using TBC rating conversions, assuming a ${cast.label}. Scales from spell power only — this spec has no modeled signature cast.`

  return {
    role: 'Caster DPS',
    specNote: specNoteFor(character),
    unmodelledTalentNote,
    metricLabel: 'Estimated DPS',
    score: round(dps),
    scoreExact: dps,
    damageSources: toDamageSources(casterSources),
    summary,
    breakdown,
  }
}

function calculateHealing(
  character: CharacterProfile,
  stats: StatBlock,
  talents: TalentModifiers = noTalentModifiers,
  unmodelledTalentNote?: string,
): SimulationResult {
  const cast = resolveCastProfile(character, GENERIC_HEAL_CAST_TIME)
  const hastePercent = ratingToFraction(stats.spellHasteRating, RATING_PER_PERCENT.spellHaste)
  const effectiveCastTime = cast.castTimeSeconds / (1 + hastePercent)
  const castsPerSecond = 1 / effectiveCastTime
  const critChance = computeSpellCritChance(
    ratingToFraction(stats.spellCritRating, RATING_PER_PERCENT.spellCrit) + talents.spellCritChance,
  )
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
  const mana =
    manaCost > 0
      ? computeManaBudget({
          manaCostPerCast: manaCost,
          castsPerSecond,
          healPerCast: expectedHealPerCast,
          mp5: stats.mp5,
          spirit: stats.spirit,
          intellect: stats.intellect,
          spiritRegenWhileCasting: talents.spiritRegenWhileCasting,
        })
      : undefined

  if (mana) {
    breakdown.push(
      { label: 'Mana per second spent', value: round(mana.spentPerSecond) },
      { label: 'Mana per second regained', value: round(mana.regenPerSecond) },
      { label: 'Healing per point of mana', value: round(mana.healingPerMana) },
      { label: 'Share of this rate regen can fund', value: toPercent(mana.sustainableFraction) },
    )
  }

  /*
   * Spirit's worth is a fact about the *build*, not about the app, and that is the whole reason this
   * sentence is computed rather than written. It used to say Spirit "prices near zero here" because
   * Meditation and its equivalents "are not modelled" — true when written, false the moment they
   * were, and precisely the rot this repo keeps finding. Now it reports which case the player is in.
   */
  const spiritNote = mana
    ? mana.spiritRegenPerSecond > 0
      ? ` Meditation and its equivalents keep ${toPercent(talents.spiritRegenWhileCasting)}% of Spirit regen running while casting, worth ${round(mana.spiritRegenPerSecond)} mana/sec of the figure above.`
      : ' With no points in Meditation or its equivalents, none of your Spirit regen continues while casting, so MP5 is the whole of it and Spirit is worth nothing to this number — real TBC, not a gap in the model.'
    : ''

  const manaNote = mana
    ? mana.deficitPerSecond > 0
      ? ` **This rate is not sustainable.** ${cast.label} costs ${manaCost} mana and at ${round(castsPerSecond)} casts/sec that is ${round(mana.spentPerSecond)} mana/sec against ${round(mana.regenPerSecond)} regained — a shortfall of ${round(mana.deficitPerSecond)}/sec, so regen alone funds ${toPercent(mana.sustainableFraction)}% of it.${spiritNote} How long you last before running dry is deliberately not given — that needs a mana pool, and class base mana is not in the pinned source.`
      : ` At ${round(castsPerSecond)} casts/sec this costs ${round(mana.spentPerSecond)} mana/sec against ${round(mana.regenPerSecond)} regained, so it is sustainable indefinitely.${spiritNote}`
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
  talents: TalentModifiers = noTalentModifiers,
  unmodelledTalentNote?: string,
): SimulationResult {
  const baseline = buildDefenderAvoidanceBaseline(target.level)
  /*
   * Anticipation is added as **skill points**, alongside the figure derived from rating, for the same
   * reason `expertiseSkillPoints` is: upstream grants it in points and the table converts rating to
   * points anyway. It is much the most valuable of the three tank talents modelled, because a single
   * Defense skill point moves miss, dodge, parry, block *and* the boss's crit chance at once — which
   * is exactly why it is added here, before `fromDefense` is derived, rather than to one term.
   */
  const defenseSkillPoints = stats.defenseRating / DEFENSE_RATING_PER_SKILL_POINT + talents.defenseSkillPoints
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
    ? Math.max(0, baseline.parry + ratingToFraction(stats.parryRating, RATING_PER_PERCENT.parry) + fromDefense + talents.parryChance)
    : 0

  /*
   * Block is unavailable without a shield no matter how much block rating is stacked — and Shield
   * Specialization is inside that gate deliberately. A Protection Warrior who unequips the shield
   * loses the talent's benefit too, which is what the game does and what the surrounding rule
   * already encodes for rating.
   */
  const hasShield = gear['Off Hand']?.item.weaponType === 'Shield'
  const blockChance = hasShield
    ? Math.max(0, baseline.block + ratingToFraction(stats.blockRating, RATING_PER_PERCENT.block) + fromDefense + talents.blockChance)
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
 * `talentPoints` reaches the simulation, and since 2026-08-20 the stat pipeline as well.
 *
 * It was confined here first on purpose — routing talents into `calculateStats` moves the
 * always-visible stat rail, every gear ranking and the upgrade finder at once — and widening it was
 * held back until the stat pipeline itself had been sourced rather than hand-written. The two are
 * now consistent by construction: the `stats` this function receives already carry the build, so the
 * estimate and the rail cannot disagree the way they did by design until then.
 *
 * What still stops here is everything that is **not** a stat — crit chance, hit chance, damage and
 * attack-speed multipliers, and the whole rage model. Those have no `StatBlock` field to land in,
 * which is the same reason `TalentModifiers` was never shaped like one.
 */
export function calculateSimulation(
  character: CharacterProfile,
  gear: EquippedGear,
  stats: StatBlock,
  role: CharacterRole,
  activeTargetDebuffIds: readonly string[] = [],
  target: SimulationTarget = defaultSimulationTarget,
  talentPoints: TalentPoints = {},
  /**
   * The same list `calculateStats` was given. Stats already arrive folded into `stats`; this is here
   * for the buff effects that are **not** stats — percentage haste and a damage multiplier — which
   * have no `StatBlock` field and so could not travel that way.
   */
  activeBuffIds: readonly string[] = [],
): SimulationResult {
  const debuffs = aggregateTargetDebuffs(activeTargetDebuffIds)
  // `talentEffects.json` covers all nine classes. A talent with no ingested effect derives the
  // identity modifiers, so an unmodelled one contributes nothing rather than a wrong answer, and the
  // ingest reports every talent group it refused and why.
  //
  // Three of the four paths below now receive this. **The tank path still does not** — a Protection
  // Warrior is scored by `calculateTankSurvivability`, which never takes it, so Toughness, Vitality,
  // Anticipation and the shield talents reach nothing. That is the remaining honest gap, and a test
  // pins it so it reads as a decision rather than an oversight.
  const talents = deriveTalentModifiers(talentPoints)

  const talentNote = unmodelledTalentNoteFor(character, talentPoints, role)

  /*
   * Buff effects that are not stats. The healer and tank paths deliberately do not take them: this
   * project is for DPS, and wiring a damage multiplier into a survivability score would be a claim
   * nobody has checked.
   */
  const buffs = aggregateBuffEffects(activeBuffIds)

  if (role === 'Caster DPS') return calculateCasterDps(character, stats, target, debuffs, talents, talentNote, buffs)
  if (role === 'Healer') return calculateHealing(character, stats, talents, talentNote)
  if (role === 'Tank') return calculateTankSurvivability(character, gear, stats, target, talents, talentNote)
  return calculatePhysicalDps(character, gear, stats, target, debuffs, talents, talentNote, buffs)
}
