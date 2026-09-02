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
  /**
   * The gathering skill the node requires, read off Wowhead's "Requires Herbalism (205)".
   *
   * **This is the only sourced check on a written farm range.** A row offering Firebloom at 150-210
   * is wrong, and nothing could catch that while the requirement lived only on a web page. It also
   * places the herbs no row mentions, which is otherwise a guess sitting next to sourced data.
   */
  requiredSkill: number
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

/**
 * Improves a tour by uncrossing it.
 *
 * **Nearest-neighbour alone leaves crossings, and a crossing is the one route error a player sees
 * immediately** — it reads as "why am I riding back past where I just was". 2-opt repeatedly reverses
 * the segment between two edges whenever doing so shortens the loop, which removes exactly that class
 * of mistake for a few milliseconds of work.
 *
 * This is still a heuristic and the caption still says so. 2-opt converges to a local optimum, not
 * the shortest possible circuit; the difference from optimal on a 25-stop cloud is small and the
 * difference from *crossed* is the one a player would have complained about.
 */
export function twoOptimize(stops: readonly SpawnPoint[]): SpawnPoint[] {
  const tour = stops.map((point) => [...point] as unknown as SpawnPoint)
  if (tour.length < 4) return tour

  const gap = (a: SpawnPoint, b: SpawnPoint) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const n = tour.length

  // Bounded rather than "until no improvement": a pathological cloud should cost a frame, not a tab.
  for (let pass = 0, improved = true; improved && pass < 40; pass += 1) {
    improved = false
    for (let i = 0; i < n - 1; i += 1) {
      for (let k = i + 2; k < n; k += 1) {
        // The edge after k wraps, so skip the pair that would "reverse" the whole closed tour.
        if (i === 0 && k === n - 1) continue
        const delta =
          gap(tour[i], tour[k]) + gap(tour[i + 1], tour[(k + 1) % n]) -
          gap(tour[i], tour[i + 1]) - gap(tour[k], tour[(k + 1) % n])
        if (delta < -1e-9) {
          for (let lo = i + 1, hi = k; lo < hi; lo += 1, hi -= 1) {
            const swap = tour[lo]
            tour[lo] = tour[hi]
            tour[hi] = swap
          }
          improved = true
        }
      }
    }
  }

  return tour
}

/** One zone's circuit for a whole skill range, over every material that range gathers. */
export type RangeRoute = {
  zone: string
  /** The range's materials that actually spawn here, busiest first. Drives the map's caption. */
  materials: { material: string; count: number }[]
  spawnCount: number
  sampled: boolean
  grid: number
  cells: DensityCell[]
  stops: SpawnPoint[]
  routeLength: number
}

/**
 * A route per zone for a set of materials farmed together.
 *
 * **The unit is the skill range, not the material, because that is the unit a player farms in.**
 * At 1-100 you are picking Peacebloom, Silverleaf *and* Earthroot on the same lap of Durotar — so
 * one loop over the three clouds merged is the route that exists, and three separate single-herb
 * loops of the same zone is three pictures of the same ride.
 *
 * It also fixes what the per-material version could not express: a herb whose row names two others
 * had no way to draw them together, and the exact-match join meant most rows drew nothing at all.
 */
export function routesForMaterials(materials: readonly string[]): RangeRoute[] {
  type ZoneBucket = { coords: SpawnPoint[]; sampled: boolean; parts: Map<string, number> }
  const byZone = new Map<string, ZoneBucket>()

  for (const material of materials) {
    const node = gatheringNodes.find((entry) => entry.material === material)
    if (!node) continue
    for (const zone of node.zones) {
      const bucket: ZoneBucket =
        byZone.get(zone.zone) ?? { coords: [], sampled: false, parts: new Map<string, number>() }
      bucket.coords.push(...zone.coords)
      bucket.sampled = bucket.sampled || zone.sampled === true
      bucket.parts.set(material, (bucket.parts.get(material) ?? 0) + zone.count)
      byZone.set(zone.zone, bucket)
    }
  }

  return [...byZone.entries()]
    .map(([zone, bucket]) => {
      const cells = densityCells(bucket.coords)
      const stops = twoOptimize(computeRoute(cells))
      return {
        zone,
        materials: [...bucket.parts.entries()]
          .map(([material, count]) => ({ material, count }))
          .sort((a, b) => b.count - a.count),
        spawnCount: [...bucket.parts.values()].reduce((sum, count) => sum + count, 0),
        sampled: bucket.sampled,
        grid: DENSITY_GRID,
        cells,
        stops,
        routeLength: routeLength(stops),
      }
    })
    .filter((route) => route.stops.length > 0)
    .sort((a, b) => b.spawnCount - a.spawnCount)
}

/** Every material name the node data can draw, for asserting that a farm row's names still resolve. */
export const mappableMaterials: ReadonlySet<string> = new Set(gatheringNodes.map((node) => node.material))

/**
 * Nodes a profession can gather in a skill window that no farm row names.
 *
 * **Computed rather than authored, because the alternative was inventing a levelling window.** Five
 * ingested herbs — Arthas' Tears, Firebloom, Flame Cap, Grave Moss, Purple Lotus — had full spawn
 * coordinates and no row pointing at them, so their maps were unreachable. Writing five new rows
 * would have meant deciding a skill range and a character level for each, and only the skill
 * requirement and the zones are sourced; the rest would have been a guess printed beside real data.
 *
 * So they attach to the row whose range already contains their requirement. `requiredSkill` and the
 * zone list both come from the ingest, the row supplies the window, and nothing here is authored.
 *
 * **Each one lands on exactly one row**, the earliest whose range contains it — Purple Lotus at 210
 * qualifies for two overlapping rows and belongs on the first, not on both.
 */
export function supplementaryNodes(
  profession: Profession,
  skillRange: readonly [number, number],
  claimedByAnyRow: ReadonlySet<string>,
  earlierRanges: readonly (readonly [number, number])[] = [],
): GatheringNode[] {
  return gatheringNodes
    .filter((node) => node.profession === profession)
    .filter((node) => !claimedByAnyRow.has(node.material))
    .filter((node) => node.requiredSkill >= skillRange[0] && node.requiredSkill <= skillRange[1])
    .filter((node) => !earlierRanges.some(([lo, hi]) => node.requiredSkill >= lo && node.requiredSkill <= hi))
    .sort((a, b) => a.requiredSkill - b.requiredSkill)
}
