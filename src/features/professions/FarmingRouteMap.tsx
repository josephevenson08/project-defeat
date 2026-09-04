import type { RangeRoute } from '../../domain/professions'
import zoneMapData from '../../domain/professions/zoneMaps.json'

const ZONE_MAPS: Record<string, { areaId: number; file: string; width: number; height: number }> =
  zoneMapData.zones
const ATTRIBUTION: string = zoneMapData.attribution

/**
 * A farming route, drawn over the zone it happens in.
 *
 * **The map went under this in September 2026, and the design above it barely changed.** For months
 * the art was treated as un-vendorable, so the node cloud *was* the picture — which turned out to be
 * the right groundwork rather than a compromise: spawn coordinates are percentages of a zone's own
 * extent, and that is exactly the space Blizzard's zone maps cover, so the overlay registers with no
 * transform, no calibration and no per-zone fudge factor.
 *
 * **The route is computed here and copied from nobody.** `professionTypes.ts` records that
 * wow-professions.com's routes are linked and never copied because they are that site's craft. The
 * line below comes out of `computeRoute` — density, then snapped onto real spawns, then 2-opt to
 * uncross it — over Wowhead's published coordinates. It is a heuristic and the caption says so.
 *
 * **One map covers a whole skill range rather than one material**, because that is how a range is
 * farmed: at 1-100 you are picking Peacebloom, Silverleaf and Earthroot on the same lap of Durotar.
 */
export function FarmingRouteMap({ route }: { route: RangeRoute }) {
  const art = ZONE_MAPS[route.zone]
  const cell = 100 / route.grid
  const path = route.stops.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const materials = route.materials.map((entry) => entry.material).join(', ')

  return (
    <figure className={`farming-route ${art ? 'farming-route-mapped' : ''}`.trim()}>
      {/*
        **The frame takes its shape from the image, and that is a correctness matter rather than a
        cosmetic one.** These maps are 772x515 or 772x579 — never square. Spawn coordinates are
        percentages of the zone's extent on each axis independently, so they address the *whole*
        image; a square frame would either crop the art, putting every dot somewhere the node is not,
        or stretch it. Matching the real aspect keeps the overlay honest.
      */}
      <div
        className="farming-route-frame"
        style={art ? { aspectRatio: `${art.width} / ${art.height}` } : undefined}
      >
        {art && (
          <img
            className="farming-route-art"
            src={`${import.meta.env.BASE_URL}maps/${art.file}`}
            alt={`Map of ${route.zone}`}
            loading="lazy"
          />
        )}
        <svg
          className="farming-route-map"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Spawn locations and suggested circuit for ${materials} in ${route.zone}: ${route.spawnCount} recorded spawns, ${route.stops.length} stops.`}
        >
          {/*
            The density grid only draws where there is no art to draw on. It was the whole picture
            before and it is the fallback now — Alterac Mountains has no map at Wowhead's CDN, so
            Wintersbite still gets the square it always had rather than an empty frame.
          */}
          {!art &&
            route.cells.map((density) => (
              <rect
                key={`${density.x}-${density.y}`}
                x={density.x * cell}
                y={density.y * cell}
                width={cell}
                height={cell}
                className="farming-route-cell"
                style={{ opacity: 0.12 + density.intensity * 0.65 }}
              />
            ))}

          {/*
            Every recorded spawn, which is what makes this read like the in-game map rather than a
            heat square. Drawn under the route so the line stays legible over a dense cluster, and
            small enough that a few hundred of them describe a shape instead of a smear.
          */}
          {route.spawns.map((group) => (
            <g key={group.material} className="farming-route-spawns">
              {group.coords.map(([x, y], index) => (
                <circle key={`${group.material}-${index}`} cx={x} cy={y} r={0.55} />
              ))}
            </g>
          ))}

          {route.stops.length > 1 && <polygon className="farming-route-path" points={path} />}
          {route.stops.map(([x, y], index) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={index === 0 ? 2.2 : 1.5}
              className={index === 0 ? 'farming-route-start' : 'farming-route-stop'}
            />
          ))}
        </svg>
      </div>

      <figcaption>
        <span className="farming-route-stats">
          {route.spawnCount} recorded spawns · {route.stops.length} stops
          {route.sampled ? ' · thinned for size, shape kept' : ''}
        </span>
        {/*
          Which of the range's materials this particular zone actually carries, busiest first. A zone
          often has two of the three, and saying so stops the map implying the third is here too.
        */}
        <span className="farming-route-materials">
          {route.materials.map((entry) => `${entry.material} (${entry.count})`).join(' · ')}
        </span>
        {/*
          Said plainly on the surface a player reads, not only in the source: the circuit is a
          heuristic over real coordinates, not an optimal path and not somebody's published route.
        */}
        <small>
          Spawn density from Wowhead. The circuit visits the busiest clusters nearest-first, snaps each
          stop onto a node that actually exists, then uncrosses itself — a strong starting line rather
          than a proven optimum.
        </small>
        {art && <small className="farming-route-credit">{ATTRIBUTION}</small>}
      </figcaption>
    </figure>
  )
}
