import { useState } from 'react'
import { routesForMaterials } from '../../domain/professions'
import type { MaterialFarmSpot, TrainingMilestone } from '../../domain/professions'
import { FarmingRouteMap } from './FarmingRouteMap'
import { MaterialChip } from './MaterialChip'
import { TrainingMarker } from './TrainingMarker'

/**
 * One skill range: what you gather, where, and the loop to ride.
 *
 * **Zones are tabs rather than stacked maps.** A 1-100 range spans six starting zones and a mid-range
 * one spans four; drawing them all would put six near-identical squares in a column and make the page
 * scroll past the thing it is for. One at a time, busiest first, is the same information at a
 * fraction of the height — and it matches how the choice is actually made, which is "I am Horde, show
 * me Durotar".
 */
function GatheringRange({ spot }: { spot: MaterialFarmSpot }) {
  const routes = routesForMaterials(spot.materials)
  const [zone, setZone] = useState(0)
  const active = routes[Math.min(zone, routes.length - 1)]

  return (
    <section className="profession-range" data-testid="gathering-range">
      <header className="profession-range-header">
        <h4>
          {spot.skillRange[0]} - {spot.skillRange[1]}
        </h4>
        <span>Level {spot.recommendedCharacterLevel}</span>
      </header>

      <p className="profession-range-materials">
        Gather these:{' '}
        {spot.materials.map((material) => (
          <MaterialChip key={material} material={material} />
        ))}
      </p>

      {/*
        The written zone list stays even where maps exist, because the two are not the same claim.
        The maps show the zones Wowhead publishes coordinates for; this line carries the sourced
        recommendation, including the ones no node cloud can express — "any level 1-10 starting zone".
      */}
      <p className="profession-range-zones">{spot.zones.join(' · ')}</p>

      {spot.needsVerification && (
        <small className="needs-verification">{spot.notes ?? 'Needs source verification.'}</small>
      )}
      {!spot.needsVerification && spot.notes && <p className="profession-range-note">{spot.notes}</p>}

      {routes.length > 0 ? (
        <>
          {routes.length > 1 && (
            <nav className="profession-zone-tabs" aria-label={`Zones for skill ${spot.skillRange[0]} to ${spot.skillRange[1]}`}>
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
          {active && <FarmingRouteMap route={active} />}
        </>
      ) : (
        /*
          Said rather than left blank. A range with no map is either a profession the game gives no
          world nodes (Skinning comes off mobs, Fishing off pools) or a node Wowhead publishes no
          coordinates for — both are facts about the source, and an empty space would read as a bug.
        */
        <p className="profession-range-nomap">
          No spawn coordinates published for these — the zones above are the sourced recommendation.
        </p>
      )}
    </section>
  )
}

/**
 * The whole gathering climb, with the training stops interleaved.
 *
 * A milestone belongs *before* the first range that starts at or after the skill it unlocks: you hit
 * 50, you go and train Journeyman, and only then does the 50-125 range mean anything. Placing them
 * between blocks rather than in a table is the whole point of dropping the tier table.
 */
export function GatheringProgression({
  spots,
  milestones,
}: {
  spots: readonly MaterialFarmSpot[]
  milestones: readonly TrainingMilestone[]
}) {
  const ordered = [...spots].sort((a, b) => a.skillRange[0] - b.skillRange[0])
  const pending = [...milestones]

  return (
    <div className="profession-progression">
      <h3>Where to farm</h3>
      {ordered.map((spot) => {
        const due = []
        while (pending.length > 0 && pending[0].atSkill <= spot.skillRange[0]) due.push(pending.shift()!)
        return (
          <div key={`${spot.skillRange[0]}-${spot.material}`}>
            <TrainingMarker milestones={due} />
            <GatheringRange spot={spot} />
          </div>
        )
      })}
      <TrainingMarker milestones={pending} />
    </div>
  )
}
