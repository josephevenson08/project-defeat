import type { SpellSchool } from '../abilities/abilityTypes'
import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { BuildRole } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

/**
 * Who brings a buff or debuff, as data rather than as prose.
 *
 * This was a single `providedBy: string` reading "Warrior" or "Feral Druid", which was fine while
 * the only consumer printed it. The raid composition planner has to *match* a roster against it, and
 * matching on a display string is the trap this repo already has a section about — a renamed spec or
 * a stray space silently stops a buff being credited, and the tool would under-report coverage with
 * nothing looking wrong.
 *
 * `providedBySpec` is set only where the source genuinely is spec-specific: Leader of the Pack needs
 * a Feral Druid, Totem of Wrath an Elemental Shaman. Left undefined, any spec of the class brings it.
 *
 * The display string is **derived** from these by `describeProvider`, so the two cannot drift.
 */
export type BuffProvider = {
  providedByClass: TbcClass
  providedBySpec?: TbcSpec
}

export type Buff = BuffProvider & {
  id: string
  name: string
  /**
   * Wowhead spell id of the *exact rank* every number on this entry was read from. TBC ships each
   * buff at many ranks under different ids, and a raid uses the highest — recording which one was
   * read is the difference between a sourced value and a plausible one.
   */
  spellId?: number
  /** Which roles this buff is relevant for; omit for a universal buff (e.g. Fortitude). */
  roles?: BuildRole[]
  /** Flat additive stat bonus, applied the same way gear/gem stats are. */
  stats?: Partial<StatBlock>
  /** Percentage multiplier applied to the named stat after all flat contributions are totaled (e.g. Blessing of Kings' +10% to every primary stat). */
  statMultipliers?: Partial<Record<keyof StatBlock, number>>
  /**
   * The same, but applied **after** attributes have been converted into attack power, armor and
   * ratings — not before, like `statMultipliers`.
   *
   * The distinction is the whole reason Unleashed Rage went unmodelled. Its own note said a
   * percentage on attack power "would be applied before attack power is derived from Strength and
   * Agility, so it would multiply only the flat portion from gear", which was true and is exactly
   * what this field fixes. A buff that multiplies a *primary* stat belongs in `statMultipliers`, so
   * the conversions downstream see the raised value; a buff that multiplies a *derived* stat belongs
   * here, or it multiplies a number that is not finished yet.
   *
   * Getting these two the wrong way round is silent — the total still looks plausible — so the rule
   * is: primary stat above, derived stat here.
   */
  statMultipliersAfterConversion?: Partial<Record<keyof StatBlock, number>>
  /**
   * A flat percentage of haste, as a fraction — **not** haste rating.
   *
   * TBC's percentage haste effects do not go through the rating conversion at all: Bloodlust is 30%
   * regardless of gear, and expressing it as rating would both scale wrongly and put a number on the
   * always-visible stat rail that no item grants. It reaches attack speed and cast speed directly.
   *
   * Where the effect is a cooldown rather than an aura, this holds the **uptime-weighted** value and
   * the entry says so, the same averaging item procs get.
   */
  hastePercent?: number
  /**
   * A flat multiplier on damage dealt, as a fraction — Ferocious Inspiration's 3%.
   *
   * Distinct from `statMultipliers` because it multiplies the *output*, not an input: there is no
   * stat that "damage dealt" is, so there was nowhere to put this and buffs of this shape were all
   * `notModelled`. School-scoped versions still are — Sanctity Aura's 10% is Holy only, and a buff has
   * no school field (target debuffs do: `TargetDebuff.schoolDamageTakenMultipliers`).
   */
  damageMultiplier?: number
  /**
   * Set on buffs whose whole value is something this app cannot express as a stat change — threat,
   * maximum health, resistances, damage multipliers, weapon procs and timed raid cooldowns. Holds
   * the real effect, so the buff can be listed and read without pretending it is being applied.
   *
   * `unmodelledBuffs` counts them, and leaving them out entirely was worse: a raid
   * planner with no Bloodlust in it reads as an oversight rather than a stated limit. Same treatment
   * `Enchant.notModelled` and `ItemEffect.notModelled` already get.
   */
  notModelled?: string
  /** Health and resistances, which `StatBlock` has no fields for. Keys follow the wowsims stat names the gem and enchant catalogues already use. */
  extraStats?: Record<string, number>
  needsVerification?: boolean
  notes?: string
}

export type TargetDebuff = BuffProvider & {
  id: string
  name: string
  /**
   * Wowhead spell id of the *exact rank* every number on this entry was read from — the same
   * contract as `Buff.spellId`, and for the same reason. For a debuff delivered by a talent the id
   * is the talent rank that states the number, not the spell that applies it.
   */
  spellId?: number
  /**
   * **Flat armor points** removed from the target, not a fraction.
   *
   * This field used to be `armorReductionPercent` and every entry was a guess in the wrong unit.
   * All three of TBC's raid armor debuffs are flat: Sunder Armor is 520 *per stack*, Faerie Fire is
   * 610, Curse of Recklessness is 800. A percentage was not merely imprecise — it scaled with the
   * target's armor, so the same debuff was worth a different amount against every boss, which is
   * not how any of them work.
   *
   * Sunder's value here is the full 5-stack total, because the app has no notion of a stack count
   * ramping up over a fight.
   *
   * These sum. wowsims applies each as its own `AddStatDynamic(stats.Armor, -x)`, and only Sunder
   * Armor and Expose Armor are exclusive with each other (they share its `SunderExpose` tag).
   */
  armorReduction?: number
  /** Increases the target's chance to be critically struck by physical attacks, as a fraction (e.g. 0.03 for +3%). */
  physicalCritTakenBonus?: number
  /** Increases the target's chance to be critically struck by spells, as a fraction (e.g. 0.03 for +3%). */
  spellCritTakenBonus?: number
  /**
   * Increases the chance **melee and ranged attacks** land on the target, as a fraction (e.g. 0.03
   * for +3%). Improved Faerie Fire is the only source in TBC.
   *
   * This is attacker hit, not target avoidance, so it joins `missReduction` alongside hit rating and
   * talent hit rather than being subtracted from dodge or parry. The attack tables floor miss at
   * zero, so a raid already at the hit cap gains nothing from it — which is correct, and the same
   * thing that happens to hit rating past the cap.
   *
   * Deliberately **not** applied to spells: the tooltip says "melee and ranged attacks", and spell
   * hit is a separate table with its own 1% miss floor.
   */
  physicalHitTakenBonus?: number
  /**
   * Damage taken by school, as fractions (Curse of the Elements: 0.1 on Arcane, Fire, Frost and
   * Shadow). Each spell takes only its own school's entry, read from `SignatureAbility.spellSchool`.
   *
   * **They multiply**, across debuffs and with the talents' school multipliers, as wowsims applies
   * each one with `*=` (`applyTargetModifiers`, `sim/core/spell_effect.go`). A Shadow spell under
   * Curse of the Elements, Misery and Shadow Weaving takes 1.1 × 1.05 × 1.1, not 1.25.
   *
   * This replaced a single `spellDamageTakenMultiplier` (2026-11-01), which handed Curse of the
   * Elements to an Elemental Shaman's Nature spells for want of a school.
   */
  schoolDamageTakenMultipliers?: Partial<Record<SpellSchool, number>>
  /** The chance a spell of the named school crits the target, as a fraction: Winter's Chill's Frost 0.10. Added to `spellCritTakenBonus`. */
  schoolCritTakenBonus?: Partial<Record<SpellSchool, number>>
  /**
   * Bleed damage taken, as a fraction: Mangle's 0.3. wowsims puts it on periodic physical damage, so it
   * reaches bleed ticks and not the direct hit that opens them, and its `shred.go` gives Shred the
   * same 30% while Mangle is up. Multiplies with `schoolDamageTakenMultipliers.Physical`.
   */
  bleedDamageTakenMultiplier?: number
  /**
   * Attack power every attacker gains against the target, added after the attacker's own multipliers
   * since it is the target's, not theirs. Melee (Improved Hunter's Mark's 110) and ranged (Hunter's
   * Mark's 440 at its full stack) are separate, as in game.
   */
  attackerAttackPower?: number
  attackerRangedAttackPower?: number
  /**
   * Debuffs sharing a group overwrite each other, and only the highest armour among them counts:
   * Sunder Armor and Expose Armor, which wowsims tags `SunderExposeAuraTag`. Every other armour
   * debuff adds.
   */
  armorGroup?: string
  /**
   * Set on a debuff this app lists but does not apply, holding the actual effect so it can be read
   * and credited to whoever brings it. Same contract as `Buff.notModelled`. The reasons differ and
   * each entry gives its own: another player's stat (Expose Weakness), charges or an uptime nothing
   * here plays out (Improved Shadow Bolt, Stormstrike), or mana this app does not track (Judgement of
   * Wisdom).
   */
  notModelled?: string
  needsVerification?: boolean
  notes?: string
}

/**
 * The display string the panels used to store on every entry.
 *
 * Derived rather than stored so there is exactly one source of truth. "Feral Druid" reads better than
 * "Druid (Feral)" and is what the buff panel has always shown, so the format is preserved verbatim —
 * a test round-trips every entry through it against the strings that were there before.
 */
export function describeProvider(provider: BuffProvider): string {
  return provider.providedBySpec ? `${provider.providedBySpec} ${provider.providedByClass}` : provider.providedByClass
}
