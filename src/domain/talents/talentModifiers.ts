import rawTalentEffects from './talentEffects.json' with { type: 'json' }
import { getTalentData } from './sampleTalents'
import type { TalentPoints } from './talentTypes'
import type { StatBlock } from '../stats/statTypes'
import type { SpellSchool } from '../abilities/abilityTypes'

/** An attribute-to-stat conversion a talent grants outright, in the shape the base rates already use. */
export type TalentStatConversion = {
  from: keyof StatBlock
  to: keyof StatBlock
  /** How much of `to` one point of `from` grants, at the ranks actually allocated. */
  perPoint: number
}

/**
 * What a talent build changes about the character, collapsed into one record.
 *
 * Shaped after `aggregateTargetDebuffs` rather than after `StatBlock`, and that is the load-bearing
 * choice. `StatBlock` holds flat amounts and *ratings*; almost nothing a talent does fits there. A
 * talent grants crit **chance**, not crit rating — the conversion only runs one way — and multiplies
 * damage, attack speed and rage income, none of which is a stat at all. The debuff record already
 * solved the same problem: a small typed set of fields, each applied at one named point in the
 * calculation, where a field with nothing to apply to contributes nothing by construction.
 *
 * **Three fields are the exception, and they are why this record now reaches `calculateStats`.**
 * `statFactors`, `statConversions` and `itemArmorMultiplier` genuinely do act on `StatBlock`, which
 * is exactly why the ingest had to refuse ten talent groups by name for as long as talents reached
 * the simulation alone — Vitality and Toughness multiply stamina, strength and armour, and Lunar
 * Guidance, Mind Mastery and Spiritual Guidance are the *only* way Intellect or Spirit becomes spell
 * power in TBC. They are kept structured rather than exploded into a field per stat because the two
 * shapes already exist: they are the same multiplier and per-point-conversion the sourced base rates
 * in `attributeConversions.ts` use.
 *
 * Every field is an identity value when no points are spent, so an empty tree — which is the default
 * — has to reproduce the previous numbers exactly. A test pins that.
 */
export type TalentModifiers = {
  /** Added to the raw melee crit chance, as a fraction. Cruelty. */
  meleeCritChance: number
  /** Added to the melee hit chance, as a fraction. Precision. */
  meleeHitChance: number
  /** Subtracted from the target's dodge chance, as a fraction. Weapon Mastery. */
  targetDodgeReduction: number
  /** Multiplies total attack power. Improved Berserker Stance. 1 when untalented. */
  attackPowerMultiplier: number
  /** Multiplies off-hand white damage. Dual Wield Specialization. 1 when untalented. */
  offHandDamageMultiplier: number
  /** Multiplies all physical damage, but only behind a two-handed main hand. 1 when untalented. */
  twoHandedDamageMultiplier: number
  /** Multiplies rage generated from damage. Endless Rage. 1 when untalented. */
  rageGeneratedMultiplier: number
  /** Rage per second that does not depend on swinging. Anger Management. */
  flatRagePerSecond: number
  /** Procs per minute, each granting 1 rage. Unbridled Wrath. */
  rageProcsPerMinute: number
  /** Melee speed multiplier while the Flurry aura holds a stack. 1 when untalented. */
  flurryBonus: number
  /**
   * Multiplies all physical damage, ungated. Shaman's Weapon Mastery.
   *
   * Separate from `twoHandedDamageMultiplier` on purpose: Warrior's Two-Handed Weapon Specialization
   * applies only while a two-hander is held, and upstream gates it on `HandType`. One shared field
   * would either hand a dual-wielding Shaman a gate it does not have, or strip Warrior's.
   */
  physicalDamageMultiplier: number
  /** Flat attack power added before any multiplier. Druid's Predatory Strikes. */
  flatAttackPower: number
  /** Added to ranged crit chance only. Hunter's Lethal Shots. */
  rangedCritChance: number
  /**
   * Multiplies **all** ranged damage, Steady Shot included — not white damage only, which is what
   * this comment used to say. Upstream applies Hunter's Ranged Weapon Specialization as a blanket
   * `RangedDamageDealtMultiplier` with no proc mask, and the talent's own wording is ambiguous
   * enough that the narrower reading looked right until it was checked. 1 when untalented.
   *
   * **Focused Fire lands here too**, and that is a judgement rather than a reading: upstream writes
   * it as a blanket `DamageDealtMultiplier` gated on owning a pet. Every hunter in this model has a
   * pet and every point of *hunter* damage this model computes is ranged, so the two coincide today.
   * It would need splitting if hunter melee were ever modelled.
   */
  rangedDamageMultiplier: number
  /** Multiplies ranged attack speed. Hunter's Serpent's Swiftness. 1 when untalented. */
  rangedAttackSpeedMultiplier: number
  /*
   * The `pet*` fields, which reach the hunter's **pet** rather than the hunter.
   *
   * They are separate fields rather than reuses of the melee ones for the reason the pet exists as
   * its own model at all: a pet is a second actor with its own attack table. It inherits attack
   * power, spell power, stamina and armour from its owner and **nothing else** — no crit, no hit, no
   * haste — so folding Ferocity into `meleeCritChance` would hand the *hunter* crit they do not
   * have, and reading the hunter's crit onto the pet would overstate it badly.
   *
   * Serpent's Swiftness is the one talent that lands in both halves: upstream writes
   * `RangedSpeedMultiplier` for the hunter and `pet.PseudoStats.MeleeSpeedMultiplier` for the pet, on
   * the same line count and the same coefficient. Two extractors, two fields, one talent id.
   */
  /** Added to the pet's own crit chance, as a fraction. Ferocity, +2% a rank. */
  petCritChance: number
  /** Added to the pet's own hit chance, as a fraction. Animal Handler, +2% a rank. */
  petHitChance: number
  /** Multiplies the pet's damage dealt. Unleashed Fury, +4% a rank. 1 when untalented. */
  petDamageMultiplier: number
  /** Multiplies the pet's melee speed. Serpent's Swiftness, +4% a rank. 1 when untalented. */
  petMeleeSpeedMultiplier: number
  /**
   * Multiplies the pet's focus regeneration. Bestial Discipline, +50% a rank. 1 when untalented.
   *
   * The one modifier here that buys **rate rather than size**. Upstream passes it straight into
   * `EnableFocusBar(1.0 + 0.5*rank)`, which multiplies `BaseFocusPerTick` — so it is a multiplier on
   * an income, and the pet's ability rate is focus-bound, which makes it close to linear in this
   * number until the 1.5s global cooldown starts binding instead.
   */
  petFocusRegenMultiplier: number
  /**
   * Chance a **pet** crit procs Frenzy, as a fraction. 0.2 a rank, so rank 5 is certain.
   *
   * Additive rather than multiplicative because it is a probability, not a factor — and 0 rather
   * than 1 is the identity, which is why it cannot share a field with the multipliers above.
   *
   * Note the gate is the *pet's* crit, where Kill Command's is the *owner's*. The two sit five lines
   * apart in `sim/hunter/talents.go` and point at different actors, which is the kind of thing a
   * shared field would quietly erase.
   */
  petFrenzyProcChance: number
  /*
   * The three that make a rogue's energy economy, and none of them is a damage number.
   *
   * They are grouped because they only make sense together: Combat Potency buys energy, Relentless
   * Strikes hands energy back on a finisher, and Improved Slice and Dice decides how often that
   * finisher has to be pressed. See `sliceAndDice.ts` for how they combine.
   */
  /** Energy returned per Combat Potency proc — 3 a rank, at a 20% chance on landed off-hand hits. */
  offHandEnergyPerProc: number
  /** Energy handed back per finisher. Relentless Strikes, guaranteed at five combo points. */
  finisherEnergyRefund: number
  /** Multiplies Slice and Dice's duration. Improved Slice and Dice, +15% a rank. 1 when untalented. */
  sliceAndDiceDurationMultiplier: number
  /** Added to both poisons' proc chance, as a fraction. Improved Poisons, +2% a rank. */
  poisonProcChance: number
  /** Multiplies poison damage. Vile Poisons, +4% a rank. 1 when untalented. */
  poisonDamageMultiplier: number
  /**
   * Added to spell hit **for poisons only**. Master Poisoner, +5% a rank.
   *
   * Separate from `spellHitChance` because it is scoped to two spells rather than to the actor: a
   * rogue has no other spell to land, but sharing the field would mean a future rogue nuke silently
   * inheriting a poison talent.
   */
  poisonSpellHitChance: number
  /**
   * Energy taken off Rake's cost. The **Druid's** Ferocity, one energy a rank.
   *
   * A fourth shared talent name, and the sharpest one yet: Hunter's Ferocity grants the pet crit
   * where Druid's discounts an ability. They land on completely different fields and cannot be
   * confused, because effects are keyed by talent id and every extractor is cross-checked against
   * its own class's tree — which is the only reason Precision, Weapon Mastery, Dual Wield
   * Specialization and now Ferocity do not contaminate each other.
   */
  rakeEnergyCostReduction: number
  /*
   * The warlock's demon, which is a **third** actor this record has to reach — after the hunter's pet
   * and the character themselves. Same principle as the `pet*` fields: name the actor, not the effect.
   */
  /** Multiplies the demon's damage. Soul Link, Unholy Power, Master Demonologist. 1 when untalented. */
  demonDamageMultiplier: number
  /** Added to the demon's crit chance, as a fraction. Demonic Tactics, +1% a rank. */
  demonCritChance: number
  /**
   * Damage multipliers scoped to a **school**, as the factor itself. `{}` is the identity.
   *
   * The field four features were waiting on `spellSchool` for. Structured like `statFactors` rather
   * than exploded into a field per school, for the same reason: the key is data, not a name, and a
   * school with no multiplier is simply unmultiplied.
   *
   * **Demonic Sacrifice is the first user and the reason this exists now.** A warlock who sacrifices
   * their demon gets +15% to one school — Succubus for Shadow, Imp for Fire — which is worth nothing
   * at all without knowing which spells it reaches.
   */
  schoolDamageMultipliers: Partial<Record<SpellSchool, number>>
  /**
   * Expertise **skill points**, added directly to the attack table's own figure.
   *
   * Skill points rather than rating: the table divides rating by a constant to get points anyway, and
   * upstream grants these talents in points. Converting to rating and back would make the value
   * depend on `EXPERTISE_RATING_PER_SKILL_POINT`, which is not what the talent says.
   */
  expertiseSkillPoints: number
  /** Added to the raw spell crit chance, as a fraction. Arcane Instability, Force of Will, Backlash. */
  spellCritChance: number
  /**
   * Added to the hit chance derived from **rating**, as a fraction, not to the final chance.
   *
   * That placement is the whole point: `computeSpellHitChance` floors the miss chance at 1%, so
   * talent hit has to enter on the same side of that floor as rating does. Added to the result
   * instead, a fully hit-capped caster would be pushed past 100%.
   */
  spellHitChance: number
  /** Multiplies spell damage. Arcane Instability, Playing with Fire. 1 when untalented. */
  spellDamageMultiplier: number
  /**
   * Share of out-of-combat Spirit regen that keeps running **while casting**, as a fraction.
   *
   * The one field here that changes a stat's whole worth rather than a number's size. wowsims applies
   * Spirit regen mid-cast only when `SpiritRegenRateCasting` is non-zero, and that comes solely from
   * talents — Meditation, Arcane Meditation, Intensity. Untalented it is 0, which is why this project
   * correctly priced Spirit at nothing for healers. With points in it, Spirit starts mattering.
   */
  spiritRegenWhileCasting: number
  /**
   * Defense **skill points**, added to the figure derived from Defense rating. Anticipation.
   *
   * Skill points for the same reason `expertiseSkillPoints` uses them: the tank table converts rating
   * to points anyway, and upstream grants this talent in points. One point moves miss, dodge, parry,
   * block and the boss's crit all at once, which is why it is the most valuable of the three.
   */
  defenseSkillPoints: number
  /** Added to the parry chance, as a fraction. Deflection. Warrior and Paladin alike. */
  parryChance: number
  /** Added to the block chance, as a fraction. Warrior's Shield Specialization only — see the ingest. */
  blockChance: number
  /**
   * Multiplies a stat outright, as the **factor itself** (1.06), not the `+0.06` fraction that
   * `applyStatMultipliers` takes for buffs and racials. Vitality, Divine Strength, Arcane Mind.
   * A stat absent from this record is simply unmultiplied, so `{}` is the identity.
   */
  statFactors: Partial<Record<keyof StatBlock, number>>
  /** Conversions a talent grants that no character has untalented. Lunar Guidance, Mind Mastery. */
  statConversions: readonly TalentStatConversion[]
  /**
   * Multiplies armour from **equipped items only**. Toughness, Thick Hide. 1 when untalented.
   *
   * Deliberately not a `statFactors.armor` entry: upstream reads `Equip.Stats()[stats.Armor]`, so
   * armour from Agility, buffs or consumables is not multiplied. Folding it into the total would
   * quietly overpay every tank.
   */
  itemArmorMultiplier: number
}

export const noTalentModifiers: TalentModifiers = {
  meleeCritChance: 0,
  meleeHitChance: 0,
  targetDodgeReduction: 0,
  attackPowerMultiplier: 1,
  offHandDamageMultiplier: 1,
  twoHandedDamageMultiplier: 1,
  rageGeneratedMultiplier: 1,
  flatRagePerSecond: 0,
  rageProcsPerMinute: 0,
  flurryBonus: 1,
  expertiseSkillPoints: 0,
  physicalDamageMultiplier: 1,
  rangedCritChance: 0,
  flatAttackPower: 0,
  rangedDamageMultiplier: 1,
  rangedAttackSpeedMultiplier: 1,
  petCritChance: 0,
  petHitChance: 0,
  petDamageMultiplier: 1,
  petMeleeSpeedMultiplier: 1,
  petFocusRegenMultiplier: 1,
  petFrenzyProcChance: 0,
  offHandEnergyPerProc: 0,
  finisherEnergyRefund: 0,
  sliceAndDiceDurationMultiplier: 1,
  poisonProcChance: 0,
  poisonDamageMultiplier: 1,
  poisonSpellHitChance: 0,
  rakeEnergyCostReduction: 0,
  demonDamageMultiplier: 1,
  demonCritChance: 0,
  schoolDamageMultipliers: {},
  spellCritChance: 0,
  spellHitChance: 0,
  spellDamageMultiplier: 1,
  spiritRegenWhileCasting: 0,
  defenseSkillPoints: 0,
  parryChance: 0,
  blockChance: 0,
  statFactors: {},
  statConversions: [],
  itemArmorMultiplier: 1,
}

/**
 * The fields that are plain numbers, which is what the two dispatch maps below can target with
 * `+=` and `*=`. `statFactors` and `statConversions` are deliberately excluded: they carry a target
 * stat, so they are dispatched by name further down rather than through a map.
 */
type NumericModifierKey = {
  [Key in keyof TalentModifiers]: TalentModifiers[Key] extends number ? Key : never
}[keyof TalentModifiers]

/** Which `TalentModifiers` field each extracted effect kind feeds, and how it combines. */
const ADDITIVE_BY_KIND: Partial<Record<string, NumericModifierKey>> = {
  meleeCritChance: 'meleeCritChance',
  meleeHitChance: 'meleeHitChance',
  targetDodgeReduction: 'targetDodgeReduction',
  rageProcsPerMinute: 'rageProcsPerMinute',
  ragePerSecondFlat: 'flatRagePerSecond',
  expertiseSkill: 'expertiseSkillPoints',
  rangedCritChance: 'rangedCritChance',
  flatAttackPower: 'flatAttackPower',
  spellCritChance: 'spellCritChance',
  spellHitChance: 'spellHitChance',
  spiritRegenWhileCasting: 'spiritRegenWhileCasting',
  defenseSkill: 'defenseSkillPoints',
  parryChance: 'parryChance',
  blockChance: 'blockChance',
  petCritChance: 'petCritChance',
  petHitChance: 'petHitChance',
  petFrenzyProcChance: 'petFrenzyProcChance',
  offHandEnergyPerProc: 'offHandEnergyPerProc',
  finisherEnergyRefund: 'finisherEnergyRefund',
  poisonProcChance: 'poisonProcChance',
  poisonSpellHitChance: 'poisonSpellHitChance',
  rakeEnergyCostReduction: 'rakeEnergyCostReduction',
  demonCritChance: 'demonCritChance',
}

const MULTIPLICATIVE_BY_KIND: Partial<Record<string, NumericModifierKey>> = {
  attackPowerMultiplier: 'attackPowerMultiplier',
  offHandDamageMultiplier: 'offHandDamageMultiplier',
  twoHandedDamageMultiplier: 'twoHandedDamageMultiplier',
  physicalDamageMultiplier: 'physicalDamageMultiplier',
  rangedDamageMultiplier: 'rangedDamageMultiplier',
  rangedAttackSpeedMultiplier: 'rangedAttackSpeedMultiplier',
  flurryHaste: 'flurryBonus',
  rageGeneratedMultiplier: 'rageGeneratedMultiplier',
  spellDamageMultiplier: 'spellDamageMultiplier',
  petDamageMultiplier: 'petDamageMultiplier',
  petMeleeSpeedMultiplier: 'petMeleeSpeedMultiplier',
  petFocusRegenMultiplier: 'petFocusRegenMultiplier',
  sliceAndDiceDurationMultiplier: 'sliceAndDiceDurationMultiplier',
  poisonDamageMultiplier: 'poisonDamageMultiplier',
  demonDamageMultiplier: 'demonDamageMultiplier',
}

/*
 * Every `kind` the ingest can emit has to appear in exactly one of the two maps above. A kind in
 * neither is silently dropped — Endless Rage was, and the only reason it surfaced is that a test
 * asserted its value rather than just asserting DPS went up. This check turns that class of mistake
 * from a wrong number into a failed import.
 */
/**
 * Kinds that carry a target stat and so cannot be dispatched by a name-to-field map. Listed here so
 * the "every kind has a destination" check below still covers them.
 */
const STRUCTURED_KINDS = new Set(['statFactor', 'statConversion', 'itemArmorMultiplier', 'schoolDamageMultiplier'])

const DISPATCHED_KINDS = new Set([
  ...Object.keys(ADDITIVE_BY_KIND),
  ...Object.keys(MULTIPLICATIVE_BY_KIND),
  ...STRUCTURED_KINDS,
])
const undispatched = rawTalentEffects.effects.map((effect) => effect.kind).filter((kind) => !DISPATCHED_KINDS.has(kind))
if (undispatched.length > 0) {
  throw new Error(
    `talentModifiers: ingested effect kinds with no destination: ${[...new Set(undispatched)].join(', ')}. ` +
      'Add each to ADDITIVE_BY_KIND or MULTIPLICATIVE_BY_KIND, or it will contribute nothing.',
  )
}

/**
 * Collapses a point allocation into the modifiers it produces.
 *
 * Reads the ingested effects rather than a hand-written table, so the numbers stay traceable to
 * `sim/warrior/talents.go` at the pinned commit. A talent with no ingested effect contributes
 * nothing — which is correct rather than lossy, because the ingest reports what it skipped and why.
 */
export function deriveTalentModifiers(points: TalentPoints): TalentModifiers {
  // Fresh copies of the two reference fields: a shallow spread would alias them to the shared
  // identity constant, and one in-place mutation would then corrupt it for the whole process.
  const modifiers: TalentModifiers = {
    ...noTalentModifiers,
    statFactors: {},
    statConversions: [],
    schoolDamageMultipliers: {},
  }

  for (const effect of rawTalentEffects.effects) {
    const rank = points[effect.talentId] ?? 0
    if (rank <= 0) continue

    const targeted = effect as { stat?: string; from?: string; to?: string }

    if (effect.kind === 'statFactor') {
      const stat = targeted.stat as keyof StatBlock
      const factor = effect.flatValue ?? 1 + (effect.perRank ?? 0) * rank
      modifiers.statFactors = { ...modifiers.statFactors, [stat]: (modifiers.statFactors[stat] ?? 1) * factor }
      continue
    }

    if (effect.kind === 'statConversion') {
      modifiers.statConversions = [
        ...modifiers.statConversions,
        {
          from: targeted.from as keyof StatBlock,
          to: targeted.to as keyof StatBlock,
          perPoint: effect.flatValue ?? (effect.perRank ?? 0) * rank,
        },
      ]
      continue
    }

    if (effect.kind === 'schoolDamageMultiplier') {
      const school = (effect as { school?: string }).school as SpellSchool
      const factor = effect.flatValue ?? 1 + (effect.perRank ?? 0) * rank
      modifiers.schoolDamageMultipliers = {
        ...modifiers.schoolDamageMultipliers,
        [school]: (modifiers.schoolDamageMultipliers[school] ?? 1) * factor,
      }
      continue
    }

    if (effect.kind === 'itemArmorMultiplier') {
      modifiers.itemArmorMultiplier *= effect.flatValue ?? 1 + (effect.perRank ?? 0) * rank
      continue
    }

    const additive = ADDITIVE_BY_KIND[effect.kind]
    if (additive) {
      // A flat effect is granted whole for having any rank at all; a per-rank one scales.
      modifiers[additive] += effect.flatValue ?? (effect.perRank ?? 0) * rank
      continue
    }

    const multiplicative = MULTIPLICATIVE_BY_KIND[effect.kind]
    if (multiplicative) {
      /*
       * `baseBonus` is added once for owning the talent, on top of the per-rank slope. Shaman's
       * Flurry is the only thing that needs it and it is exactly why that talent sat refused:
       * upstream computes `1.05 + 0.05*rank` against Warrior's `1 + 0.05*rank`, so a shared
       * `1 + perRank*rank` would have understated every Shaman rank by a flat 5%.
       */
      modifiers[multiplicative] *= effect.flatValue ?? 1 + (effect.baseBonus ?? 0) + (effect.perRank ?? 0) * rank
    }
  }

  return modifiers
}

/**
 * Flurry's expected attack-speed multiplier, in closed form.
 *
 * **This is the one piece the ingest cannot hand over.** wowsims models Flurry as a 3-stack aura on
 * an event timeline: any melee crit sets the stacks to 3, and only a white hit removes one. This
 * simulator has no timeline, so the aura has to become an expected value — the same judgement
 * `effectUptime` already makes for item procs, and it needs stating rather than hiding.
 *
 * Treat the stack count as a Markov chain stepped by each white swing. With crit chance `c` and
 * `q = 1 - c`, a swing either crits (→ 3 stacks) or does not (→ one fewer). The stationary
 * distribution is
 *
 *     π₃ = c,  π₂ = qc,  π₁ = q²c,  π₀ = q³
 *
 * which sums to `c(1 + q + q²) + q³ = (1 - q³) + q³ = 1`, so it is a genuine distribution rather
 * than an approximation that happens to look like one. The aura is active whenever stacks > 0, so a
 * swing is hasted with probability `1 - q³`.
 *
 * The multiplier is then time-weighted rather than swing-weighted, because a hasted swing occupies
 * less of the fight: the mean interval is `π₀·T + (1 - π₀)·T/bonus`, so speed scales by
 * `1 / (π₀ + (1 - π₀)/bonus)`.
 *
 * **It is deliberately a lower bound.** Special attacks also refresh the stacks to 3 and never
 * consume one, and a miss or dodge does not appear to consume one either — both push real uptime
 * above this. Understating is the honest direction for a number that exists to correct an
 * already-understated DPS figure.
 */
export function flurrySpeedMultiplier(flurryBonus: number, meleeCritChance: number): number {
  if (flurryBonus <= 1) return 1

  const crit = Math.min(1, Math.max(0, meleeCritChance))
  const noCrit = 1 - crit
  const idleShare = noCrit ** 3

  return 1 / (idleShare + (1 - idleShare) / flurryBonus)
}

/**
 * The classes whose talent effects have been ingested.
 *
 * Everything else derives identity modifiers, which is correct but **silent**: a Mage spending all 41
 * points sees the estimate move by exactly nothing. That is the failure this file keeps guarding
 * against in other forms — a real limitation with no way for the reader to learn it — so the class
 * list is exported for the interface to say so out loud.
 */
export const classesWithTalentEffects: readonly string[] = rawTalentEffects.classes

/** Whether a spec's talents can reach the simulation at all yet. */
export function classHasTalentEffects(className: string): boolean {
  return classesWithTalentEffects.includes(className)
}

/** The talents this pass deliberately does not model, and why. Surfaced so the gap stays visible. */
export const unmodelledTalents: readonly { talent: string; reason: string }[] = rawTalentEffects.skipped

/**
 * The unmodelled talents this particular build has actually spent points in.
 *
 * Returns the **specific talent names**, not the grouped labels the ingest files them under: a player
 * who took Impale wants to read "Impale", not "Mace/Sword/Poleaxe Specialization". Several skipped
 * entries cover more than one talent, which is why the labels are split before matching.
 *
 * Empty when nothing applies, and that emptiness is the point — warning someone about talents they do
 * not have is noise, and noise is how a caveat stops being read.
 */
export function unmodelledTalentsInBuild(className: string, points: TalentPoints): readonly string[] {
  const data = getTalentData(className)
  if (!data) return []

  const spent = new Set<string>()
  for (const tree of data.trees) {
    for (const talent of tree.talents) {
      if ((points[talent.id] ?? 0) > 0) spent.add(talent.name)
    }
  }
  if (spent.size === 0) return []

  const taken: string[] = []
  for (const entry of rawTalentEffects.skipped) {
    // Only this class's skips. Warrior and Rogue share talent names, so an unfiltered match would
    // warn a Warrior about a Rogue talent they cannot have taken.
    if (entry.className !== className) continue
    for (const name of entry.talent.split('/').map((part) => part.trim())) {
      if (spent.has(name)) taken.push(name)
    }
  }
  return taken
}
