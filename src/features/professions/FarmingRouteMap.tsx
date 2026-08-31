import type { FarmingRoute } from '../../domain/professions'

/**
 * A farming route, drawn from where the nodes actually spawn.
 *
 * **There is no map underneath, and that is the design rather than a shortfall.** Blizzard's zone art
 * cannot be vendored, so the node cloud *is* the picture: coordinates are percentages of the zone's
 * own extent, which means plotting them on a bare square reproduces the shape of the farmable region
 * without reproducing the map. A player who knows the zone recognises it immediately; one who does
 * not still learns where to ride.
 *
 * **The route is computed here and copied from nobody.** `professionTypes.ts` records that
 * wow-professions.com's routes are linked and never copied because they are that site's craft. The
 * line below comes out of `computeRoute` — density first, nearest-neighbour ordering — over Wowhead's
 * published spawn coordinates. It is a heuristic and the caption says so.
 */
export function FarmingRouteMap({ route }: { route: FarmingRoute }) {
  const cell = 100 / route.grid
  const path = route.stops.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <figure className="farming-route">
      <svg
        className="farming-route-map"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${route.node.name} spawn density and suggested circuit in ${route.zone}: ${route.spawnCount} recorded spawns, ${route.stops.length} stops.`}
      >
        {/*
          Density first, route on top. Opacity carries the count rather than a colour ramp: this app's
          palette rule is that saturated colour means item quality and nothing else, so a heat map in
          reds and greens would be the one thing the whole design forbids.
        */}
        {route.cells.map((density) => (
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

        {route.stops.length > 1 && (
          <polygon className="farming-route-path" points={path} />
        )}
        {route.stops.map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={index === 0 ? 2.4 : 1.4}
            className={index === 0 ? 'farming-route-start' : 'farming-route-stop'}
          />
        ))}
      </svg>

      <figcaption>
        <strong>{route.zone}</strong>
        <span>
          {route.spawnCount} recorded spawns · {route.stops.length} stops
          {route.sampled ? ' · thinned for size, shape kept' : ''}
        </span>
        {/*
          Said plainly on the surface a player reads, not only in the source: the circuit is a
          heuristic over real coordinates, not an optimal path and not somebody's published route.
        */}
        <small>
          Spawn density from Wowhead. The circuit visits the busiest clusters nearest-first — a
          starting line rather than an optimal one.
        </small>
      </figcaption>
    </figure>
  )
}
