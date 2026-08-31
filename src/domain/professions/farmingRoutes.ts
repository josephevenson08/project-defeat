/**
 * Farming routes, computed from where the nodes actually are.
 *
 * **This is deliberately our own work rather than someone else's route.** `professionTypes.ts`
 * records that wow-professions.com's routes are linked and never copied, because they are that
 * site's craft. So nothing here reproduces a published circuit: the input is Wowhead's raw spawn
 * coordinates, and the output is a loop this file derives from them. Two people looking at the same
 * node cloud will draw similar lines, which is the point — the shape is a property of the zone, not
 * of anyone's guide.
 *
 * **And there is no map underneath.** Blizzard's zone art cannot be vendored, so the density of the
 * nodes *is* the picture. A zone's farmable region draws itself: coordinates are percentages of the
 * zone's own extent, so plotting them on a bare square reproduces the shape of where you can gather
 * without reproducing the map.
 */

import nodeSpawns from './nodeSpawns.json' with { type: 'json' }
import type { Profession } from './professionTypes'

export type SpawnPoint = readonly [number, number]

export type NodeZoneSpawns = {
  zone: string
  count: number
  /** True when the coordinates were thinned for the bundle; the shape is preserved, the count is not. */
  sampled?: boolean
  coords: SpawnPoint[]
}

export type GatheringNode = {
  objectId: number
  name: string
  profession: Profession
  material: string
  totalSpawns: number
  zones: NodeZoneSpawns[]
}

export const gatheringNodes = nodeSpawns.nodes as unknown as readonly GatheringNode[]

/** Nodes Wowhead publishes no zone spawns for, so their absence reads as known rather than missed. */
export const nodesWithoutSpawnData = nodeSpawns.noSpawnData as readonly { id: number; name: string }[]

/** A cell of the density grid the map is drawn from. */
export type DensityCell = {
  /** Grid column and row, 0-indexed. */
  x: number
  y: number
  /** How many spawns fell in this cell. */
  count: number
  /** `count` as a fraction of the busiest cell, which is what the fill opacity reads. */
  intensity: number
}

export type FarmingRoute = {
  node: GatheringNode
  zone: string
  spawnCount: number
  sampled: boolean
  grid: number
  cells: DensityCell[]
  /** The suggested circuit, in visiting order, as zone percentages. Closed: the last point returns. */
  stops: SpawnPoint[]
  /** Rough path length as a percentage of the zone's diagonal, for "is this a big loop or a tight one". */
  routeLength: number
}

/**
 * Buckets spawns into a coarse grid.
 *
 * A grid rather than a scatter of every point, because 300 overlapping dots say much less than 100
 * cells with an opacity each — and because the route wants *clusters* to visit, which a grid gives
 * for free. 16 is fine enough to show a zone's real shape and coarse enough that a cell is a place
 * you would actually ride to rather than a single bush.
 */
export const DENSITY_GRID = 16

export function densityCells(coords: readonly SpawnPoint[], grid = DENSITY_GRID): DensityCell[] {
  const counts = new Map<string, number>()
  for (const [x, y] of coords) {
    // Coordinates are 0-100 percentages; clamp so a boundary point lands in the last cell, not past it.
    const cx = Math.min(grid - 1, Math.max(0, Math.floor((x / 100) * grid)))
    const cy = Math.min(grid - 1, Math.max(0, Math.floor((y / 100) * grid)))
    const key = `${cx},${cy}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const busiest = Math.max(1, ...counts.values())
  return [...counts.entries()].map(([key, count]) => {
    const [x, y] = key.split(',').map(Number)
    return { x, y, count, intensity: count / busiest }
  })
}

/**
 * Picks the cells worth riding to, then orders them into a loop.
 *
 * **Nearest-neighbour from the densest cell, which is a heuristic and is named as one.** The optimal
 * circuit is a travelling-salesman problem and nobody needs the optimum here — a route that visits
 * the busy places without doubling back is what a player wants, and nearest-neighbour produces that
 * from a node cloud reliably. It is not the shortest possible loop and this file does not claim it is.
 *
 * Cells below `minIntensity` of the busiest are left out: a route that detours for one lonely herb
 * is worse than one that skips it, and including every cell would draw a scribble over the whole
 * zone rather than a route.
 */
export function computeRoute(cells: readonly DensityCell[], minIntensity = 0.35, grid = DENSITY_GRID): SpawnPoint[] {
  const worth = cells.filter((cell) => cell.intensity >= minIntensity)
  if (worth.length === 0) return []

  // Cell centres, back in the 0-100 space the coordinates came from.
  const toPoint = (cell: DensityCell): SpawnPoint => [
    ((cell.x + 0.5) / grid) * 100,
    ((cell.y + 0.5) / grid) * 100,
  ]

  const remaining = [...worth].sort((a, b) => b.count - a.count)
  const start = remaining.shift()!
  const stops: SpawnPoint[] = [toPoint(start)]

  while (remaining.length > 0) {
    const [lastX, lastY] = stops[stops.length - 1]
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY
    remaining.forEach((cell, index) => {
      const [x, y] = toPoint(cell)
      const distance = (x - lastX) ** 2 + (y - lastY) ** 2
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    stops.push(toPoint(remaining.splice(bestIndex, 1)[0]))
  }

  return stops
}

/** Total length of a closed loop through the stops, as a percentage of the zone's own extent. */
export function routeLength(stops: readonly SpawnPoint[]): number {
  if (stops.length < 2) return 0
  let total = 0
  for (let i = 0; i < stops.length; i += 1) {
    const [x1, y1] = stops[i]
    const [x2, y2] = stops[(i + 1) % stops.length]
    total += Math.hypot(x2 - x1, y2 - y1)
  }
  return Math.round(total)
}

/** Every route for one node, busiest zone first. */
export function routesForNode(node: GatheringNode): FarmingRoute[] {
  return node.zones.map((zone) => {
    const cells = densityCells(zone.coords)
    const stops = computeRoute(cells)
    return {
      node,
      zone: zone.zone,
      spawnCount: zone.count,
      sampled: zone.sampled === true,
      grid: DENSITY_GRID,
      cells,
      stops,
      routeLength: routeLength(stops),
    }
  })
}

/** Every node a profession gathers, in the order its materials are farmed. */
export function nodesForProfession(profession: Profession): GatheringNode[] {
  return gatheringNodes.filter((node) => node.profession === profession)
}
