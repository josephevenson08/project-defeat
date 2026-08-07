import type { ItemQuality, SocketColor } from '../gear/itemTypes'
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

export type Gem = {
  id: string
  wowItemId?: number
  name: string
  color: GemColor
  quality: ItemQuality
  stats: Partial<StatBlock>
  phase?: number
  uniqueEquipped?: boolean
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
