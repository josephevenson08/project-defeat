import type { ItemEffect, ItemQuality, SocketColor } from '../gear/itemTypes'
import type { StatBlock } from '../stats/statTypes'

/**
 * A gem's colour, which is **not** the same vocabulary as a socket's.
 *
 * Sockets are only ever Red, Yellow, Blue or Meta. Gems add the three hybrid colours, and they are
 * the majority: of 212 TBC gems, 46 are Orange, 37 Purple and 35 Green — 118 hybrids against 74
 * single-colour gems. Modelling gem colour with `SocketColor`, as this originally did, left more than
 * half the gems with no representable colour at all.
 */
export type GemColor = SocketColor | 'Orange' | 'Purple' | 'Green' | 'Prismatic'

/**
 * The colour condition a meta gem needs before it does anything at all.
 *
 * Every TBC meta gem has one, and it is the single gem rule a player can actually get wrong — socket
 * a Relentless Earthstorm Diamond without enough red gems elsewhere and it contributes nothing.
 * Ingested from each gem's own Wowhead tooltip by `tools/ingest/ingest-meta-gems.mjs`.
 */
export type MetaGemRequirement =
  | { kind: 'minimums'; minimums: readonly { color: SocketColor; count: number }[]; text: string }
  | { kind: 'moreThan'; moreColor: SocketColor; thanColor: SocketColor; text: string }

export type Gem = {
  id: string
  wowItemId?: number
  name: string
  color: GemColor
  quality: ItemQuality
  stats: Partial<StatBlock>
  phase?: number
  uniqueEquipped?: boolean
  /** Present on meta gems only. Absent means no condition was found, not that there is none. */
  metaRequirement?: MetaGemRequirement
  /**
   * A proc, for the two meta gems whose entire value is one.
   *
   * Mystical Skyfire Diamond and Thundering Skyfire Diamond both carry `stats: {}` in the catalogue,
   * because wowsims models them as procs rather than as stat gems — so before this field existed,
   * socketing either contributed *nothing* and the panel said "No stats this app models". Averaged by
   * uptime exactly as an item's effect is, and gated on the meta's colour condition: an inactive meta
   * grants nothing, and its proc is part of that nothing.
   */
  effect?: ItemEffect
  /** Resistances and spell penetration, which `StatBlock` has no fields for. Carried, not surfaced. */
  extraStats?: Record<string, number>
}

/**
 * Which socket colours each gem colour satisfies for the socket bonus.
 *
 * A hybrid counts as both of its component colours, which is the whole point of them — an Orange gem
 * in a red socket still activates a bonus that wanted red. Meta is exclusive in both directions: only
 * a meta gem fits a meta socket, and a meta gem fits nothing else.
 */
const SOCKETS_BY_GEM_COLOR: Record<GemColor, readonly SocketColor[]> = {
  Red: ['Red'],
  Yellow: ['Yellow'],
  Blue: ['Blue'],
  Orange: ['Red', 'Yellow'],
  Purple: ['Red', 'Blue'],
  Green: ['Yellow', 'Blue'],
  Prismatic: ['Red', 'Yellow', 'Blue'],
  Meta: ['Meta'],
}

/** True when the gem may be socketed there *and* satisfies that socket's colour for the bonus. */
export function gemFitsSocket(gem: Gem, socket: SocketColor) {
  return SOCKETS_BY_GEM_COLOR[gem.color].includes(socket)
}

/** The socket colours a gem colour counts as. Exposed for display, not just filtering. */
export function socketColorsForGem(color: GemColor): readonly SocketColor[] {
  return SOCKETS_BY_GEM_COLOR[color]
}

/**
 * How many gems of each colour a set of socketed gems counts as, for a meta gem's condition.
 *
 * A hybrid counts toward **both** of its colours — an Orange gem satisfies a red requirement and a
 * yellow one simultaneously, which is exactly why hybrids are worth socketing. Meta gems themselves
 * never count toward a colour requirement.
 */
export function countGemColors(gems: readonly Gem[]): Record<SocketColor, number> {
  const counts: Record<SocketColor, number> = { Red: 0, Yellow: 0, Blue: 0, Meta: 0 }
  for (const gem of gems) {
    if (gem.color === 'Meta') continue
    for (const color of socketColorsForGem(gem.color)) counts[color] += 1
  }
  return counts
}

/**
 * Whether a meta gem's condition is met by the rest of the gems equipped.
 *
 * A meta with no recorded requirement is treated as active. That is the honest default: absence here
 * means the ingest found no condition on the tooltip, not that the gem has none, and denying stats
 * on missing data would invent a penalty.
 */
export function metaGemIsActive(gem: Gem, socketedGems: readonly Gem[]): boolean {
  const requirement = gem.metaRequirement
  if (!requirement) return true

  const counts = countGemColors(socketedGems)
  if (requirement.kind === 'moreThan') return counts[requirement.moreColor] > counts[requirement.thanColor]
  return requirement.minimums.every((minimum) => counts[minimum.color] >= minimum.count)
}
