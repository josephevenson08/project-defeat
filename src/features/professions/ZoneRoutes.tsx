import { useState } from 'react'
import { routesForMaterials } from '../../domain/professions'
import { FarmingRouteMap } from './FarmingRouteMap'

/**
 * Zone tabs over one map, for any set of materials farmed together.
 *
 * **Zones are tabs rather than stacked maps.** A 1-100 range spans six starting zones and a mid-range
 * one spans four; drawing them all would put six near-identical squares in a column and make the page
 * scroll past the thing it is for. One at a time, busiest first, is the same information at a
 * fraction of the height — and it matches how the choice is actually made, which is "I am Horde, show
 * me Durotar".
 *
 * Extracted so a supplementary herb gets the same treatment as a range. The alternative was folding
 * those herbs into the range's own material list, which was measured and rejected: it took the
 * 150-210 range from six zone tabs to eleven, and it would have put Firebloom's Searing Gorge on a
 * map captioned as the route for Liferoot, Fadeleaf and Goldthorn — zones that share a skill window
 * are not zones that share a lap.
 */
export function ZoneRoutes({ materials, label }: { materials: readonly string[]; label: string }) {
  const routes = routesForMaterials(materials)
  const [zone, setZone] = useState(0)

  if (routes.length === 0) {
    /*
      Said rather than left blank. No map means either a profession the game gives no world nodes
      (Skinning comes off mobs, Fishing off pools) or a node Wowhead publishes no coordinates for —
      both are facts about the source, and an empty space would read as a bug.
    */
    return (
      <p className="profession-range-nomap">
        No spawn coordinates published for these — the zones above are the sourced recommendation.
      </p>
    )
  }

  const active = routes[Math.min(zone, routes.length - 1)]

  return (
    <>
      {routes.length > 1 && (
        <nav className="profession-zone-tabs" aria-label={`Zones for ${label}`}>
          {routes.map((route, index) => (
            <button
              key={route.zone}
              type="button"
              className={`profession-zone-tab ${index === zone ? 'profession-zone-tab-active' : ''}`.trim()}
              aria-current={index === zone ? 'true' : undefined}
              onClick={() => setZone(index)}
            >
              {route.zone}
            </button>
          ))}
        </nav>
      )}
      <FarmingRouteMap route={active} />
    </>
  )
}
