import type { TbcClass, TbcSpec } from '../character/characterTypes'

/**
 * Which of Wowhead's three tier lists a placement came from.
 *
 * This is **not** the app's `CharacterRole`, and the difference is load-bearing. `CharacterRole`
 * classifies a spec once — Feral Druid is `Physical DPS` and nothing else. Wowhead publishes three
 * separate lists and a spec may appear on more than one of them at different tiers: Feral Druid is
 * C-tier on the DPS list and S-tier on the tank list, which is a real statement about the spec, not a
 * contradiction. Collapsing the two axes would force a choice between those two placements.
 */
export type TierListRole = 'DPS' | 'Healer' | 'Tank'

/** One spec's presence on one list. Ordering within a tier carries no meaning — see `TierRow`. */
export type SpecPlacement = {
  className: TbcClass
  spec: TbcSpec
  /** Wowhead's own badge slug, kept so a placement can be traced back to the markup it was read from. */
  slug: string
}

export type TierRow = {
  /** The tier letter as published — 'S', 'A', 'B', and on the DPS list 'C' and 'D'. */
  label: string
  /**
   * In source order, which is *not* a ranking. Wowhead orders specs within a tier for layout; the
   * claim being made is "these specs are in this tier", nothing finer.
   */
  placements: readonly SpecPlacement[]
}

export type SpecTierList = {
  role: TierListRole
  /** The page title as published, which is where the phase claim is verified at ingest time. */
  title: string
  sourceUrl: string
  phase: number
  /** Best tier first, in published order. */
  tiers: readonly TierRow[]
}

/** Where a given spec landed, across every list it appears on. */
export type SpecTierPlacement = {
  role: TierListRole
  label: string
  sourceUrl: string
}
