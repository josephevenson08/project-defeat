import type { WeaponType } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'
import type { TbcRace } from './characterTypes'

/**
 * Why a racial is or isn't part of the stat/simulation model.
 *
 * `passive` traits are always-on stat effects and are the only kind folded into stats.
 * `conditional` traits are passive but only apply with a specific weapon type equipped (Human Sword
 * Specialization, Orc Axe Specialization, Dwarf Gun Specialization...).
 * `on-use` traits are cooldown abilities (Blood Fury, Berserking, Arcane Torrent). Their throughput
 * depends on when they're pressed and what they're lined up with, which this simulator doesn't model.
 * `utility` traits have no throughput effect at all (Shadowmeld, Escape Artist, profession bonuses).
 *
 * On-use and utility traits are still listed rather than omitted: a race's page showing nothing is
 * indistinguishable from a race having nothing, and Orcs and Trolls in particular give up real
 * throughput that this model can't price.
 */
export type RacialKind = 'passive' | 'conditional' | 'on-use' | 'utility'

export type RacialTrait = {
  id: string
  name: string
  race: TbcRace
  kind: RacialKind
  /** One line, mechanical rather than flavour. */
  description: string
  /** Flat stats folded in before the primary-stat derivations. Only for passive/conditional traits. */
  stats?: Partial<StatBlock>
  /** Percentage bonuses (0.05 = +5%) applied before derivations, so e.g. +5% Intellect cascades into spell power. */
  statMultipliers?: Partial<Record<keyof StatBlock, number>>
  /** For `conditional` traits: the trait applies only while one of these is equipped in the relevant slot. */
  requiresWeaponTypes?: readonly WeaponType[]
  needsVerification?: boolean
  notes?: string
}
