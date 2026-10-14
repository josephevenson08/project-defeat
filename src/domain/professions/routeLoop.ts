/**
 * A farming loop through one zone's spawns, for one skill window: Step C of `docs/design/MAPS-PLAN.md`.
 *
 * **What this replaced, and the three things wrong with it.** The old route bucketed the spawns into a
 * 16 × 16 grid, kept the cells holding at least 35% of the busiest, visited them nearest-first, snapped
 * each stop onto a spawn and uncrossed the result. It drew a reasonable line and could not say how good
 * it was, and three things in it were wrong:
 *
 * - **It measured a zone as if it were square.** Every zone map is 3:2, and a coordinate is a
 *   percentage of each axis on its own, so one point across a zone covers half as much ground again
 *   as one point down it. Distances here are in percent of the zone's width, with the vertical scaled
 *   by the map's aspect, which is how the zone is shaped on the ground.
 * - **It counted Wowhead's records as spawns.** Wowhead lists the same spawn several times, 0.1–0.2
 *   apart: Felweed's 245 Hellfire records are about 155 places, and CMaNGOS's spawn table, read for
 *   the maps plan's second-source check, has 152. Records within `SAME_SPAWN` of each other are one
 *   spawn point here.
 * - **Nothing weighed a detour against what it picked up.** The 35% cut was a share of the busiest
 *   cell, so a dense pocket at the far edge of a zone always made the loop and a moderate one beside
 *   the line never did.
 *
 * **What it does instead,** in four steps: merge the records into spawn points; group the points into
 * clusters a rider can take in from one place (`REACH`); build a loop through every cluster and
 * shorten it with 2-opt and Or-opt; then let each cluster earn its place — a run of stops whose
 * detour costs more than twice the loop's average distance per spawn is dropped, a cluster whose
 * detour costs less than the average is put back, and waypoints the line passes anyway are taken
 * out. That is a prize-collecting loop in the operations-research sense, solved by local search, and
 * it is a heuristic: a strong line, not a proven optimum, and the map says so.
 *
 * **It also says how good the loop is,** which the old one could not: how many spawn points it passes
 * within `REACH` (`pointsWithinReach`) and how long a lap is in zone widths (`loopLength`).
 *
 * **Our own work, from published coordinates.** `professionTypes.ts` records that published farming
 * routes are linked and never copied; nothing here reproduces one.
 */

import type { SpawnPoint } from './farmingRoutes'

/** WoW's zone maps are 3:2 (Wowhead's TBC art is 772 × 515). Used when a zone has no art to read it from. */
export const ZONE_MAP_ASPECT = 1.5

/**
 * Records closer than this, in Wowhead's own percent units, are one spawn recorded more than once.
 *
 * From the maps plan's second-source check: every one of CMaNGOS's 152 Felweed points in Hellfire has a
 * Wowhead record within 0.3 (the worst is 0.28), and Wowhead's extra records sit in pairs and quads
 * 0.1–0.2 apart around them. 0.3 is about 15 yards in an Outland zone, closer than two real spawns sit.
 */
export const SAME_SPAWN = 0.3

/**
 * How far from the line a spawn still counts as passed, in percent of the zone's width. It is also
 * the radius of a cluster.
 *
 * **The one tuning number, and it is a share of the zone because the repo has no zone sizes in yards
 * yet** (a sourced table of them would let this become a distance). Chosen on 2026-10-14 by running
 * every range's loops at 2.5, 3.5 and 4.5: at 2.5 the busiest zones needed up to 66 waypoints and
 * the line zig-zagged to touch every small cluster; at 4.5 a "passed" node could sit a long way off
 * the line in the larger zones; 3.5 gave a median of 17 waypoints and at most 41, with the line
 * still running through the clusters rather than beside them.
 */
export const REACH = 3.5

/** A stop is dropped when its detour costs this many times the loop's average distance per spawn. */
const DROP_AT = 2

/** A spawn point: where one node can appear, after duplicate records are merged. */
export type SpawnCluster = {
  /** The cluster's centre, which is a recorded spawn, so every stop is somewhere a node grows. */
  at: SpawnPoint
  /** How many spawn points it takes in. */
  weight: number
}

/** A distance in percent of the zone's width, with the vertical scaled by the zone's aspect. */
export function zoneDistance(a: SpawnPoint, b: SpawnPoint, aspect = ZONE_MAP_ASPECT): number {
  // Not Math.hypot: it guards against overflow nobody needs at 0-100 and is several times slower.
  const dx = a[0] - b[0]
  const dy = (a[1] - b[1]) / aspect
  return Math.sqrt(dx * dx + dy * dy)
}

/** The length of the closed loop through the stops, in percent of the zone's width. */
export function loopLength(stops: readonly SpawnPoint[], aspect = ZONE_MAP_ASPECT): number {
  if (stops.length < 2) return 0
  let total = 0
  for (let i = 0; i < stops.length; i += 1) total += zoneDistance(stops[i], stops[(i + 1) % stops.length], aspect)
  return total
}

/** How far a point is from the segment a–b, in percent of the zone's width. */
function distanceToSegment(point: SpawnPoint, a: SpawnPoint, b: SpawnPoint, aspect: number): number {
  const px = point[0]
  const py = point[1] / aspect
  const ax = a[0]
  const ay = a[1] / aspect
  const dx = b[0] - ax
  const dy = b[1] / aspect - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  const ex = px - (ax + t * dx)
  const ey = py - (ay + t * dy)
  return Math.sqrt(ex * ex + ey * ey)
}

/** True when the point is within `REACH` of the loop (or of the one stop, for a loop of one). */
function withinReach(point: SpawnPoint, stops: readonly SpawnPoint[], aspect: number): boolean {
  if (stops.length === 1) return zoneDistance(point, stops[0], aspect) <= REACH
  for (let i = 0; i < stops.length; i += 1) {
    if (distanceToSegment(point, stops[i], stops[(i + 1) % stops.length], aspect) <= REACH) return true
  }
  return false
}

/** How many of the spawn points a loop passes within reach of. */
export function pointsWithinReach(
  points: readonly SpawnPoint[],
  stops: readonly SpawnPoint[],
  aspect = ZONE_MAP_ASPECT,
): number {
  if (stops.length === 0) return 0
  return points.filter((point) => withinReach(point, stops, aspect)).length
}

/** Buckets indices by a coarse grid, so a neighbour search looks at nine cells rather than everything. */
function gridIndex(points: readonly SpawnPoint[], cellX: number, cellY: number) {
  const cells = new Map<string, number[]>()
  const keyOf = (x: number, y: number) => `${Math.floor(x / cellX)},${Math.floor(y / cellY)}`
  points.forEach(([x, y], index) => {
    const key = keyOf(x, y)
    const bucket = cells.get(key)
    if (bucket) bucket.push(index)
    else cells.set(key, [index])
  })
  return (x: number, y: number) => {
    const cx = Math.floor(x / cellX)
    const cy = Math.floor(y / cellY)
    const near: number[] = []
    for (let i = cx - 1; i <= cx + 1; i += 1) {
      for (let j = cy - 1; j <= cy + 1; j += 1) near.push(...(cells.get(`${i},${j}`) ?? []))
    }
    return near
  }
}

/**
 * Wowhead's records, merged into the places a node can actually appear.
 *
 * **Across materials as well as within one.** In TBC herbs and ores share spawn points — a Felweed
 * spot is a Dreaming Glory spot on another day — and one point holds one node at a time, so a point
 * recorded under two herbs is still one stop's worth. Sorted first, so the same records always give
 * the same points.
 */
export function spawnPoints(records: readonly SpawnPoint[]): SpawnPoint[] {
  const sorted = [...records].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const kept: SpawnPoint[] = []
  const cells = new Map<string, number[]>()
  for (const point of sorted) {
    const cx = Math.floor(point[0] / SAME_SPAWN)
    const cy = Math.floor(point[1] / SAME_SPAWN)
    let duplicate = false
    for (let i = cx - 1; i <= cx + 1 && !duplicate; i += 1) {
      for (let j = cy - 1; j <= cy + 1 && !duplicate; j += 1) {
        for (const index of cells.get(`${i},${j}`) ?? []) {
          const other = kept[index]
          if (Math.hypot(other[0] - point[0], other[1] - point[1]) <= SAME_SPAWN + 1e-9) {
            duplicate = true
            break
          }
        }
      }
    }
    if (duplicate) continue
    const key = `${cx},${cy}`
    cells.set(key, [...(cells.get(key) ?? []), kept.length])
    kept.push(point)
  }
  return kept
}

/**
 * Spawn points grouped into places a rider takes in from one spot.
 *
 * Greedy: the point with the most others within `REACH` becomes a cluster with everything still
 * unclaimed around it, and that repeats until nothing is left. The centre is always a spawn point,
 * so a stop is a node that exists rather than the average of a cloud, which on the zone art can sit in
 * a lake (the lesson the old snapping step was added for).
 */
export function spawnClusters(points: readonly SpawnPoint[], aspect = ZONE_MAP_ASPECT): SpawnCluster[] {
  const near = gridIndex(points, REACH, REACH * aspect)
  const neighbours = points.map(([x, y], index) =>
    near(x, y).filter((other) => other !== index && zoneDistance(points[index], points[other], aspect) <= REACH),
  )
  const count = neighbours.map((list) => list.length + 1)
  const taken = points.map(() => false)
  const clusters: SpawnCluster[] = []

  for (;;) {
    let best = -1
    for (let i = 0; i < points.length; i += 1) {
      if (!taken[i] && (best < 0 || count[i] > count[best])) best = i
    }
    if (best < 0) break
    const members = [best, ...neighbours[best].filter((other) => !taken[other])]
    for (const member of members) {
      taken[member] = true
      for (const other of neighbours[member]) count[other] -= 1
    }
    clusters.push({ at: points[best], weight: members.length })
  }
  return clusters
}

/** How many of each stop's nearest others the shortening tries joining it to. */
const NEIGHBOURS = 10

/** Each stop's nearest other stops, closest first. */
function nearestOthers(tour: readonly SpawnCluster[], aspect: number): Map<SpawnCluster, SpawnCluster[]> {
  const near = new Map<SpawnCluster, SpawnCluster[]>()
  for (const stop of tour) {
    near.set(
      stop,
      tour
        .filter((other) => other !== stop)
        .map((other) => ({ other, distance: zoneDistance(stop.at, other.at, aspect) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEIGHBOURS)
        .map(({ other }) => other),
    )
  }
  return near
}

/** The nearest others of a run's two ends, without building a new array for every run tried. */
function* candidatesBeside(near: Map<SpawnCluster, SpawnCluster[]>, first: SpawnCluster, last: SpawnCluster) {
  yield* near.get(first) ?? []
  if (last !== first) yield* near.get(last) ?? []
}

function positions(tour: readonly SpawnCluster[]): Map<SpawnCluster, number> {
  return new Map(tour.map((stop, index) => [stop, index]))
}

/**
 * Uncrosses the loop: whenever joining a stop to a nearer neighbour and reversing the stretch between
 * them makes the loop shorter, it does. One pass; true if anything changed.
 *
 * Only a stop's `NEIGHBOURS` nearest are tried, which is the standard way to make 2-opt cheap: a join
 * that shortens the loop is almost always to somewhere close.
 */
function twoOptPass(tour: SpawnCluster[], near: Map<SpawnCluster, SpawnCluster[]>, aspect: number): boolean {
  const n = tour.length
  if (n < 4) return false
  const d = (a: SpawnCluster, b: SpawnCluster) => zoneDistance(a.at, b.at, aspect)
  let at = positions(tour)
  let improved = false
  for (let i = 0; i < n; i += 1) {
    const a = tour[i]
    const b = tour[(i + 1) % n]
    const ab = d(a, b)
    for (const c of near.get(a) ?? []) {
      const ac = d(a, c)
      if (ac >= ab) break
      const j = at.get(c)
      if (j === undefined) continue
      const e = tour[(j + 1) % n]
      if (c === b || e === a) continue
      if (ac + d(b, e) - ab - d(c, e) < -1e-9) {
        // Reverse b..c, the stretch between the two edges, going forwards from i + 1.
        let lo = (i + 1) % n
        let hi = j
        for (let steps = ((hi - lo + n) % n + 1) >> 1; steps > 0; steps -= 1) {
          ;[tour[lo], tour[hi]] = [tour[hi], tour[lo]]
          lo = (lo + 1) % n
          hi = (hi - 1 + n) % n
        }
        at = positions(tour)
        improved = true
        break
      }
    }
  }
  return improved
}

/**
 * Moves runs of one to three stops to wherever beside their nearest neighbours they cost least,
 * either way round. One pass over the loop; true if it moved anything.
 *
 * **2-opt cannot do this and it is the commonest leftover.** A stop visited "on the way back" when it
 * sits beside the outward leg is not a crossing, so 2-opt leaves it; moving it is what fixes it.
 */
function orOptPass(tour: SpawnCluster[], near: Map<SpawnCluster, SpawnCluster[]>, aspect: number): boolean {
  const n = tour.length
  if (n < 5) return false
  const d = (a: SpawnCluster, b: SpawnCluster) => zoneDistance(a.at, b.at, aspect)
  let at = positions(tour)
  let moved = false
  for (let size = 1; size <= 3; size += 1) {
    for (let start = 0; start + size <= n; start += 1) {
      const first = tour[start]
      const last = tour[start + size - 1]
      const before = tour[(start - 1 + n) % n]
      const after = tour[(start + size) % n]
      const gain = d(before, first) + d(last, after) - d(before, after)
      let bestCost = gain - 1e-9
      let bestAfter: SpawnCluster | undefined
      let bestReversed = false
      for (const c of candidatesBeside(near, first, last)) {
        const j = at.get(c)
        if (j === undefined) continue
        // The two edges beside c: edge k joins tour[k] and tour[k + 1].
        for (const k of [j, (j - 1 + n) % n]) {
          if ((k - start + 1 + n) % n <= size) continue
          const a = tour[k]
          const b = tour[(k + 1) % n]
          const forward = d(a, first) + d(last, b) - d(a, b)
          const backward = d(a, last) + d(first, b) - d(a, b)
          if (forward < bestCost) {
            bestCost = forward
            bestAfter = a
            bestReversed = false
          }
          if (backward < bestCost) {
            bestCost = backward
            bestAfter = a
            bestReversed = true
          }
        }
      }
      if (bestAfter) {
        const run = tour.splice(start, size)
        if (bestReversed) run.reverse()
        tour.splice(tour.indexOf(bestAfter) + 1, 0, ...run)
        at = positions(tour)
        moved = true
      }
    }
  }
  return moved
}

/**
 * 2-opt and Or-opt until neither finds anything, bounded so a pathological cloud costs a frame, not a tab.
 *
 * `near` may be worked out once for a larger set and reused while stops come and go; a neighbour no
 * longer on the loop is skipped.
 */
export function shortenLoop<T extends SpawnCluster>(
  tour: readonly T[],
  aspect = ZONE_MAP_ASPECT,
  near: Map<SpawnCluster, SpawnCluster[]> = nearestOthers(tour, aspect),
): T[] {
  const working = [...tour] as SpawnCluster[]
  if (working.length < 4) return working as T[]
  for (let pass = 0; pass < 60; pass += 1) {
    const uncrossed = twoOptPass(working, near, aspect)
    const moved = orOptPass(working, near, aspect)
    if (!uncrossed && !moved) break
  }
  return working as T[]
}

/**
 * Every pair of legs tried, not only near neighbours, until no reversal shortens the loop.
 *
 * **This is what guarantees no crossings,** which the neighbour-list 2-opt above does not quite: it
 * only tries joining a stop to its nearest few, and a crossing whose fix joins two stops further
 * apart than that survives it. A crossing is the one route error a player sees at a glance ("why am
 * I riding back past where I just was"), and on the finished loop of at most a few dozen stops the
 * exhaustive version costs nothing. In a plane, any crossing can be undone by a reversal that
 * shortens the loop, so a loop no reversal shortens has none; the 3:2 scaling does not change that.
 */
function uncross<T extends SpawnCluster>(tour: readonly T[], aspect: number): T[] {
  const working = [...tour]
  const n = working.length
  if (n < 4) return working
  const d = (a: SpawnCluster, b: SpawnCluster) => zoneDistance(a.at, b.at, aspect)
  for (let pass = 0, improved = true; improved && pass < 100; pass += 1) {
    improved = false
    for (let i = 0; i < n - 1; i += 1) {
      for (let k = i + 2; k < n; k += 1) {
        if (i === 0 && k === n - 1) continue
        const a = working[i]
        const b = working[i + 1]
        const c = working[k]
        const e = working[(k + 1) % n]
        if (d(a, c) + d(b, e) - d(a, b) - d(c, e) < -1e-9) {
          for (let lo = i + 1, hi = k; lo < hi; lo += 1, hi -= 1) [working[lo], working[hi]] = [working[hi], working[lo]]
          improved = true
        }
      }
    }
  }
  return working
}

/** Nearest-first from the heaviest cluster: the starting order the shortening works on. */
function nearestFirst(clusters: readonly SpawnCluster[], aspect: number): SpawnCluster[] {
  const remaining = [...clusters].sort((a, b) => b.weight - a.weight)
  const tour = [remaining.shift()!]
  while (remaining.length > 0) {
    const last = tour[tour.length - 1].at
    let best = 0
    for (let i = 1; i < remaining.length; i += 1) {
      if (zoneDistance(last, remaining[i].at, aspect) < zoneDistance(last, remaining[best].at, aspect)) best = i
    }
    tour.push(remaining.splice(best, 1)[0])
  }
  return tour
}

/**
 * The stops not worth their ride: runs of one to three consecutive stops whose detour costs more
 * than `limit` per spawn point, worst first and not overlapping.
 *
 * **Runs, not single stops,** because a far pocket is often two or three clusters side by side, and
 * then each one's own detour is small — leaving out either still means riding to the other. Only
 * leaving out the run together shows what the excursion costs.
 */
function costlyRuns(tour: readonly SpawnCluster[], limit: number, aspect: number): Set<SpawnCluster> {
  const n = tour.length
  const d = (a: SpawnCluster, b: SpawnCluster) => zoneDistance(a.at, b.at, aspect)
  const runs: { start: number; size: number; ratio: number }[] = []
  for (let size = 1; size <= 3 && size <= n - 3; size += 1) {
    for (let start = 0; start < n; start += 1) {
      const before = tour[(start - 1 + n) % n]
      const after = tour[(start + size) % n]
      let inside = 0
      let weight = 0
      for (let i = 0; i < size; i += 1) {
        weight += tour[(start + i) % n].weight
        if (i > 0) inside += d(tour[(start + i - 1) % n], tour[(start + i) % n])
      }
      const saving = d(before, tour[start]) + inside + d(tour[(start + size - 1) % n], after) - d(before, after)
      const ratio = saving / weight
      if (ratio > limit) runs.push({ start, size, ratio })
    }
  }
  runs.sort((a, b) => b.ratio - a.ratio)
  const dropped = new Set<SpawnCluster>()
  const touched = new Set<number>()
  for (const run of runs) {
    // Not next to a run already dropped either: its detour was measured with that run still there.
    const span = Array.from({ length: run.size + 2 }, (_, i) => (run.start - 1 + i + n) % n)
    if (span.some((index) => touched.has(index))) continue
    for (let i = 0; i < run.size; i += 1) dropped.add(tour[(run.start + i) % n])
    for (const index of span) touched.add(index)
  }
  return dropped
}

function cheapestInsertion(tour: readonly SpawnCluster[], cluster: SpawnCluster, aspect: number) {
  let cost = Number.POSITIVE_INFINITY
  let at = 0
  for (let k = 0; k < tour.length; k += 1) {
    const a = tour[k].at
    const b = tour[(k + 1) % tour.length].at
    const extra = zoneDistance(a, cluster.at, aspect) + zoneDistance(cluster.at, b, aspect) - zoneDistance(a, b, aspect)
    if (extra < cost) {
      cost = extra
      at = k + 1
    }
  }
  return { cost, at }
}

/**
 * Drops the stops the line would pass anyway: a waypoint goes when the loop without it still has
 * every spawn point within reach that it had before. What is left is the places the ride turns.
 */
function dropPassedStops(tour: SpawnCluster[], points: readonly SpawnPoint[], aspect: number): SpawnCluster[] {
  const current = [...tour]
  const near = (point: SpawnPoint, a: SpawnCluster, b: SpawnCluster) =>
    distanceToSegment(point, a.at, b.at, aspect) <= REACH
  // How many of the loop's legs pass each point; a stop can go if no point drops to none.
  const legs = points.map(
    (point) => current.filter((stop, i) => near(point, stop, current[(i + 1) % current.length])).length,
  )
  for (let index = current.length - 1; index >= 0 && current.length > 3; index -= 1) {
    const n = current.length
    const before = current[(index - 1 + n) % n]
    const here = current[index]
    const after = current[(index + 1) % n]
    const next = points.map(
      (point, p) =>
        legs[p] -
        Number(near(point, before, here)) -
        Number(near(point, here, after)) +
        Number(near(point, before, after)),
    )
    if (next.every((count, p) => count > 0 || legs[p] === 0)) {
      current.splice(index, 1)
      next.forEach((count, p) => (legs[p] = count))
    }
  }
  return current
}

/**
 * The loop: which clusters it visits, in what order. Starts at the heaviest.
 *
 * **It starts from every cluster, because a lap is meant to take in the zone.** Nodes take minutes
 * to come back, so a farmer rides a circuit long enough to find them grown again, not the tightest
 * ring round the best three pockets. A first version started from the busy clusters and only added
 * cheap ones; on a sparse ore it closed round three pockets and passed 13 of Un'Goro's 40 Small
 * Thorium points.
 *
 * **Then each cluster earns its place against the loop's own average,** which is the loop's length
 * per spawn point it stops for. A stop, or a run of up to three side by side (`costlyRuns`), whose
 * detour costs more than `DROP_AT` times that is dropped (the far pocket nobody should ride to), and
 * a cluster not already passed whose detour costs less than the average is put back. The gap between
 * the two rules is deliberate: with one threshold a loop through evenly spread nodes would shed its
 * above-average stops one by one.
 *
 * Last, waypoints the line passes anyway are taken out (`dropPassedStops`), so the stops drawn are
 * the places the ride turns rather than every cluster on the way.
 */
export function farmingLoop(
  clusters: readonly SpawnCluster[],
  aspect = ZONE_MAP_ASPECT,
  points: readonly SpawnPoint[] = clusters.map((cluster) => cluster.at),
): SpawnCluster[] {
  if (clusters.length === 0) return []
  if (clusters.length <= 3) return shortenLoop(nearestFirst(clusters, aspect), aspect)

  const near = nearestOthers(clusters, aspect)
  let tour = shortenLoop(nearestFirst(clusters, aspect), aspect, near)

  for (let change = 0; change < clusters.length * 2; change += 1) {
    const average = loopLength(tour.map((stop) => stop.at), aspect) / tour.reduce((sum, stop) => sum + stop.weight, 0)

    const outliers = costlyRuns(tour, DROP_AT * average, aspect)
    if (outliers.size > 0 && tour.length - outliers.size >= 3) {
      tour = shortenLoop(tour.filter((stop) => !outliers.has(stop)), aspect, near)
      continue
    }

    const stops = tour.map((stop) => stop.at)
    let pick: { cluster: SpawnCluster; at: number; ratio: number } | undefined
    for (const cluster of clusters) {
      if (tour.includes(cluster) || withinReach(cluster.at, stops, aspect)) continue
      const { cost, at } = cheapestInsertion(tour, cluster, aspect)
      const ratio = cost / cluster.weight
      if (ratio < average && (!pick || ratio < pick.ratio)) pick = { cluster, at, ratio }
    }
    if (!pick) break
    tour = shortenLoop([...tour.slice(0, pick.at), pick.cluster, ...tour.slice(pick.at)], aspect, near)
  }

  tour = uncross(shortenLoop(dropPassedStops(tour, points, aspect), aspect, near), aspect)

  // Start at the heaviest stop, which is where the map draws the larger marker.
  const start = tour.reduce((best, stop, index) => (stop.weight > tour[best].weight ? index : best), 0)
  return [...tour.slice(start), ...tour.slice(0, start)]
}
