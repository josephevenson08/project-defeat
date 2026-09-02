import { supplementaryNodes } from '../../domain/professions'
import type { GatheringNode, MaterialFarmSpot, Profession, TrainingMilestone } from '../../domain/professions'
import { MaterialChip } from './MaterialChip'
import { TrainingMarker } from './TrainingMarker'
import { ZoneRoutes } from './ZoneRoutes'

/**
 * One skill range: what you gather, where, and the loop to ride.
 */
function GatheringRange({ spot, alsoHere }: { spot: MaterialFarmSpot; alsoHere: readonly GatheringNode[] }) {
  const window = `skill ${spot.skillRange[0]} to ${spot.skillRange[1]}`

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

      <ZoneRoutes materials={spot.materials} label={window} />

      {/*
        Herbs this skill window unlocks that the row itself does not name. Every value is from the
        ingest — the required skill and the zones both — so nothing is authored to fill a gap. Five
        ingested herbs had full spawn maps that no surface could reach before this.

        Each gets its own map rather than joining the range's, because a zone that shares a skill
        window is not a zone that shares a lap: Firebloom's Searing Gorge is nowhere near the Liferoot
        circuit, and one map captioned for both would claim a route that does not exist. Measured too
        — merging took the 150-210 range from six zone tabs to eleven.
      */}
      {alsoHere.map((node) => (
        <div className="profession-range-also" key={node.objectId} data-testid="supplementary-node">
          <span>
            Also unlocked here · <strong>{node.material}</strong> at skill {node.requiredSkill}
          </span>
          <ZoneRoutes materials={[node.material]} label={node.material} />
        </div>
      ))}
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
  profession,
  spots,
  milestones,
}: {
  profession: Profession
  spots: readonly MaterialFarmSpot[]
  milestones: readonly TrainingMilestone[]
}) {
  const ordered = [...spots].sort((a, b) => a.skillRange[0] - b.skillRange[0])
  const pending = [...milestones]

  // Every material any row names, so a supplementary node is one no row claims at all.
  const claimed = new Set(spots.flatMap((spot) => spot.materials))
  const seenRanges: [number, number][] = []

  return (
    <div className="profession-progression">
      <h3>Where to farm</h3>
      {ordered.map((spot) => {
        const due = []
        while (pending.length > 0 && pending[0].atSkill <= spot.skillRange[0]) due.push(pending.shift()!)
        const alsoHere = supplementaryNodes(profession, spot.skillRange, claimed, seenRanges)
        seenRanges.push(spot.skillRange)
        return (
          <div key={`${spot.skillRange[0]}-${spot.material}`}>
            <TrainingMarker milestones={due} />
            <GatheringRange spot={spot} alsoHere={alsoHere} />
          </div>
        )
      })}
      <TrainingMarker milestones={pending} />
    </div>
  )
}
