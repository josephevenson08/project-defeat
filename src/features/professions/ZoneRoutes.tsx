import { useState } from 'react'
import { routesForRange, recommendedWithoutMaps } from '../../domain/professions'
import type { GatheringRange, Profession } from '../../domain/professions'
import { FarmingRouteMap } from './FarmingRouteMap'

/**
 * Zone tabs over one map, for a whole skill range.
 *
 * **Zones are tabs rather than stacked maps.** A range spans three to eight zones; drawing them all
 * would put eight near-identical rectangles in a column and make the page scroll past the thing it
 * is for. One at a time is the same information at a fraction of the height, and it matches how the
 * choice is actually made, which is "I am Horde, show me Durotar".
 *
 * **The tab order is the range's recommendation, not the spawn counts.** `routesForRange` carries
 * that; the reason is worth repeating here because the nav is where it would be tempting to "fix" it
 * back to sorting by size. Silver's busiest zones are level 30-40 and a player mining Silver is
 * around level 20.
 */
export function ZoneRoutes({ profession, range }: { profession: Profession; range: GatheringRange }) {
  const routes = routesForRange(profession, range)
  const unmapped = recommendedWithoutMaps(profession, range)
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
  const note = range.zoneNotes?.find((entry) => entry.zone === active.zone)

  return (
    <>
      {routes.length > 1 && (
        <nav
          className="profession-zone-tabs"
          aria-label={`Zones for skill ${range.skillRange[0]} to ${range.skillRange[1]}`}
        >
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

      {/*
        The zone's own aside, under the map it belongs to rather than in the range's prose. "Arathi
        Highlands carries Iron, Gold and Silver together" is a claim about this node cloud and has a
        different lifetime from the range's guidance, so it moves with the tab.
      */}
      {note && (
        <p className="profession-zone-note" data-testid="zone-note">
          {note.note}
        </p>
      )}

      {/*
        **Recommended zones with no map, named rather than quietly dropped.** The ingest keeps each
        node's three busiest zones, which is the right trade for a 1 MB bundle and the wrong thing to
        stay silent about: Thousand Needles is standard advice for 125-175 mining and is not in
        Iron's top three, so tabs alone would look like this guide had never heard of it.
      */}
      {unmapped.length > 0 && (
        <p className="profession-range-unmapped" data-testid="unmapped-zones">
          Also recommended, no spawn coordinates in our ingest: {unmapped.join(', ')}.
        </p>
      )}
    </>
  )
}
