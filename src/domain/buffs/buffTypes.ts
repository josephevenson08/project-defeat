import type { BuildRole } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

export type Buff = {
  id: string
  name: string
  providedBy: string
  /** Which roles this buff is relevant for; omit for a universal buff (e.g. Fortitude). */
  roles?: BuildRole[]
  /** Flat additive stat bonus, applied the same way gear/gem stats are. */
  stats?: Partial<StatBlock>
  /** Percentage multiplier applied to the named stat after all flat contributions are totaled (e.g. Blessing of Kings' +10% to every primary stat). */
  statMultipliers?: Partial<Record<keyof StatBlock, number>>
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
  /** Increases spell damage the target takes, as a fraction (e.g. 0.1 for +10%). */
  spellDamageTakenMultiplier?: number
  needsVerification?: boolean
  notes?: string
}
