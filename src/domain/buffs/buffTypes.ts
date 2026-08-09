import type { BuildRole } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Buff = {
  id: string
  name: string
  providedBy: string
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
   * Set on buffs whose whole value is something this app cannot express as a stat change — threat,
   * maximum health, resistances, damage multipliers, weapon procs and timed raid cooldowns. Holds
   * the real effect, so the buff can be listed and read without pretending it is being applied.
   *
   * Fifteen of the thirty-three are like this, and leaving them out entirely was worse: a raid
   * planner with no Bloodlust in it reads as an oversight rather than a stated limit. Same treatment
   * `Enchant.notModelled` and `ItemEffect.notModelled` already get.
   */
  notModelled?: string
  /** Health and resistances, which `StatBlock` has no fields for. Keys follow the wowsims stat names the gem and enchant catalogues already use. */
  extraStats?: Record<string, number>
  needsVerification?: boolean
  notes?: string
}

export type TargetDebuff = {
  id: string
  name: string
  providedBy: string
  /** Reduces the simulation target's armor by this fraction (e.g. 0.2 for a 20% reduction). Approximates real per-stack flat armor reduction. */
  armorReductionPercent?: number
  /** Increases the target's chance to be critically struck by physical attacks, as a fraction (e.g. 0.03 for +3%). */
  physicalCritTakenBonus?: number
  /** Increases the target's chance to be critically struck by spells, as a fraction (e.g. 0.1 for Winter's Chill at 5 stacks). */
  spellCritTakenBonus?: number
  /** Increases spell damage the target takes, as a fraction (e.g. 0.1 for +10%). */
  spellDamageTakenMultiplier?: number
  needsVerification?: boolean
  notes?: string
}
