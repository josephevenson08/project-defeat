/**
 * Farming routes, computed from where the nodes actually are.
 *
 * **This is deliberately our own work rather than someone else's route.** `professionTypes.ts`
 * records that wow-professions.com's routes are linked and never copied, because they are that
 * site's craft. So nothing here reproduces a published circuit: the input is Wowhead's raw spawn
 * coordinates, and the output is a loop derived from them (`routeLoop.ts`). Two people looking at the same
 * node cloud will draw similar lines, which is the point — the shape is a property of the zone, not
 * of anyone's guide.
 *
 * **There is a map underneath now, and there was not until 2026-09-04.** For most of this file's life
 * Blizzard's zone art was treated as un-vendorable, so the density of the nodes *was* the picture — a
 * zone's farmable region drew its own shape, because coordinates are percentages of the zone's own
 * extent. The owner has since decided to vendor the art under Blizzard's fan-content rules, and that
 * same percentage space is what makes the overlay register with no transform at all.
 *
 * The design the constraint forced is still the fallback: `zoneMaps.json` records any zone with no art,
 * and its map falls back to the bare square rather than to a hole. Since 2026-10-13 the art is the TBC
 * zones (docs/design/MAPS-PLAN.md, Step A) and every zone has some.
 */

import nodeSpawns from './nodeSpawns.json' with { type: 'json' }
import zoneMaps from './zoneMaps.json' with { type: 'json' }
import type { Profession } from './professionTypes'
import {
  ZONE_MAP_ASPECT,
  farmingLoop,
  loopLength,
  pointsWithinReach,
  spawnClusters,
  spawnPoints,
} from './routeLoop'

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
   * **This is what decides which section a node appears in, so it is load-bearing rather than
   * descriptive.** `nodesForRange` derives a range's whole material list from it, which is why no
   * range can offer a herb you cannot pick yet: the window decides, nothing is written down, and a
   * re-ingest that moves a requirement moves the node to the right section on its own.
   *
   * It is also the reason `GatheringNodeRef` carries it. Two nodes share a material name and differ
   * only here — Small against Rich Thorium, Adamantite against Rich Adamantite — so it is half the
   * key, not a property of the row.
   */
  requiredSkill: number
  totalSpawns: number
  zones: NodeZoneSpawns[]
}

export const gatheringNodes = nodeSpawns.nodes as unknown as readonly GatheringNode[]

/** Nodes Wowhead publishes no zone spawns for, so their absence reads as known rather than missed. */
export const nodesWithoutSpawnData = nodeSpawns.noSpawnData as readonly { id: number; name: string }[]


/** A cell of the density grid drawn where a zone has no map art. */
export type DensityCell = {
  /** Grid column and row, 0-indexed. */
  x: number
  y: number
  /** How many spawns fell in this cell. */
  count: number
  /** `count` as a fraction of the busiest cell, which is what the fill opacity reads. */
  intensity: number
}

/**
 * The density grid's size.
 *
 * **It no longer picks the route, only draws the fallback.** Until Step C of the maps plan
 * (2026-10-14) the busiest cells of this grid were the route's stops; now the loop comes from
 * `routeLoop.ts`, and the grid is the picture a zone gets if it ever loses its map art.
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

/** Every node a profession gathers, in the order its materials are farmed. */
export function nodesForProfession(profession: Profession): GatheringNode[] {
  return gatheringNodes.filter((node) => node.profession === profession)
}

const ZONE_ART = zoneMaps.zones as Record<string, { width: number; height: number }>

/** A zone's shape, width over height, read off its map art; 3:2 where there is none. */
export function zoneAspect(zone: string): number {
  const art = ZONE_ART[zone]
  return art ? art.width / art.height : ZONE_MAP_ASPECT
}

/**
 * Outland's zones, where a level 70 character with a flying mount rides the straight line.
 *
 * **Everywhere else the line is drawn straight and ridden on the ground** (the owner's decision 3 in
 * the maps plan: straight lines with a note, no walkability masks). Azeroth has no flying in TBC, and
 * Outland has none before 70, so a route at Herbalism 300-325 is a ground route even in Hellfire.
 */
const OUTLAND = new Set([
  'Hellfire Peninsula',
  'Zangarmarsh',
  'Terokkar Forest',
  'Nagrand',
  "Blade's Edge Mountains",
  'Netherstorm',
  'Shadowmoon Valley',
])

/** One zone's loop for a whole skill range, over every material that range gathers. */
export type RangeRoute = {
  zone: string
  /** The range's materials that actually spawn here, busiest first. Drives the map's caption. */
  materials: { material: string; count: number }[]
  /**
   * Every recorded spawn, grouped by material, for plotting over the zone art.
   *
   * These are Wowhead's records as published, duplicates and all: they draw the shape of the cloud,
   * and the counting below works on the merged spawn points instead.
   */
  spawns: { material: string; coords: SpawnPoint[] }[]
  /** Wowhead's record count, summed over the range's materials. Decides which zones get a tab. */
  spawnCount: number
  /** The places a node can appear, after records of the same spawn are merged (`routeLoop.ts`). */
  spawnPoints: number
  /** How many of those the loop passes within reach of. */
  onLap: number
  sampled: boolean
  grid: number
  cells: DensityCell[]
  /** The loop, in visiting order, as zone percentages; closed, and every stop a recorded spawn. */
  stops: SpawnPoint[]
  /** The lap's length in percent of the zone's width, measured with the zone's real 3:2 shape. */
  routeLength: number
  /** `flying-at-70` in Outland; `ground` everywhere else, where the straight line is not the ride. */
  travel: 'ground' | 'flying-at-70'
}

/**
 * A route per zone for a set of nodes farmed together.
 *
 * **The unit is the skill range, not the material, because that is the unit a player farms in.**
 * At 1-70 you are picking Peacebloom, Silverleaf *and* Earthroot on the same lap of Tirisfal Glades
 * — so one loop over the three clouds merged is the route that exists, and three separate
 * single-herb loops of the same zone is three pictures of the same ride.
 *
 * **Addressed by node rather than by name, and that is not a detail.** Two ingested nodes share a
 * material name and differ only by requirement: Small Thorium Vein at 245 against Rich Thorium Vein
 * at 275, Adamantite Deposit at 325 against Rich Adamantite at 350. A skill range wants one of each
 * pair and not the other — the 245-275 section is about the small veins, the 275-300 section about
 * the rich ones, and they are in different zones.
 *
 * The by-name version this replaced could not express that. It resolved each name with `find`, which
 * returns the first match, so the rich variants' coordinates were unreachable from any surface in
 * the app. Four of the nine mining ranges draw from those two nodes. Same lesson as
 * `GatheringNodeRef`: a display label is not a join key.
 *
 * **Remembered per set of nodes,** because the data never changes while the page is open and a
 * Professions page asks for the same ranges on every render.
 */
export function routesForNodes(refs: readonly { material: string; atSkill: number }[]): RangeRoute[] {
  const key = refs.map((ref) => `${ref.material}@${ref.atSkill}`).join('|')
  const remembered = routeCache.get(key)
  if (remembered) return remembered
  const routes = routesFromNodes(
    refs.flatMap((ref) =>
      gatheringNodes.filter((node) => node.material === ref.material && node.requiredSkill === ref.atSkill),
    ),
  )
  routeCache.set(key, routes)
  return routes
}

const routeCache = new Map<string, RangeRoute[]>()

function routesFromNodes(nodes: readonly GatheringNode[]): RangeRoute[] {
  type ZoneBucket = {
    coords: SpawnPoint[]
    sampled: boolean
    parts: Map<string, number>
    byMaterial: Map<string, SpawnPoint[]>
  }
  const byZone = new Map<string, ZoneBucket>()

  for (const node of nodes) {
    const material = node.material
    for (const zone of node.zones) {
      const bucket: ZoneBucket = byZone.get(zone.zone) ?? {
        coords: [],
        sampled: false,
        parts: new Map<string, number>(),
        byMaterial: new Map<string, SpawnPoint[]>(),
      }
      bucket.coords.push(...zone.coords)
      bucket.sampled = bucket.sampled || zone.sampled === true
      bucket.parts.set(material, (bucket.parts.get(material) ?? 0) + zone.count)
      bucket.byMaterial.set(material, [...(bucket.byMaterial.get(material) ?? []), ...zone.coords])
      byZone.set(zone.zone, bucket)
    }
  }

  return [...byZone.entries()]
    .map(([zone, bucket]): RangeRoute => {
      const aspect = zoneAspect(zone)
      const points = spawnPoints(bucket.coords)
      /*
       * **The loop is worked out the first time something reads it, not here.** A range offers up to
       * eight zones and the page draws one at a time; computing all eight up front made opening
       * Herbalism cost a third of a second for maps nobody had clicked. Everything that decides the
       * tabs (the counts) is plain data and is ready at once.
       */
      let loop: { stops: SpawnPoint[]; onLap: number; routeLength: number } | undefined
      const solve = () => {
        if (!loop) {
          const stops = farmingLoop(spawnClusters(points, aspect), aspect, points).map((stop) => stop.at)
          loop = {
            stops,
            onLap: pointsWithinReach(points, stops, aspect),
            routeLength: Math.round(loopLength(stops, aspect)),
          }
        }
        return loop
      }
      return {
        zone,
        materials: [...bucket.parts.entries()]
          .map(([material, count]) => ({ material, count }))
          .sort((a, b) => b.count - a.count),
        spawns: [...bucket.byMaterial.entries()].map(([material, coords]) => ({ material, coords })),
        spawnCount: [...bucket.parts.values()].reduce((sum, count) => sum + count, 0),
        spawnPoints: points.length,
        get onLap() {
          return solve().onLap
        },
        sampled: bucket.sampled,
        grid: DENSITY_GRID,
        cells: densityCells(bucket.coords),
        get stops() {
          return solve().stops
        },
        get routeLength() {
          return solve().routeLength
        },
        travel: OUTLAND.has(zone) ? 'flying-at-70' : 'ground',
      }
    })
    .filter((route) => route.spawnPoints > 0)
    .sort((a, b) => b.spawnCount - a.spawnCount)
}
