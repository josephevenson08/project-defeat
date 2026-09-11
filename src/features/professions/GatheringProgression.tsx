import { guideFor, materialsForRange, planRows, trainingOutsideRanges } from '../../domain/professions'
import type { GatheringRange, Profession, TrainingMilestone } from '../../domain/professions'
import { GatheringPlanTable } from './GatheringPlanTable'
import { MaterialChip } from './MaterialChip'
import { TrainingMarker } from './TrainingMarker'
import { ZoneRoutes } from './ZoneRoutes'

/**
 * One skill range: what it opens, what to expect, and where to ride it.
 */
function Range({
  profession,
  range,
  training,
}: {
  profession: Profession
  range: GatheringRange
  training: readonly TrainingMilestone[]
}) {
  const materials = materialsForRange(profession, range)

  return (
    <section className="profession-range" data-testid="gathering-range">
      <header className="profession-range-header">
        <h4>
          {range.skillRange[0]} - {range.skillRange[1]}
        </h4>
        <span>Level {range.recommendedCharacterLevel}</span>
      </header>

      {/*
        Prose first, then the chips, then the map — the order the reference guides use and the order
        the questions arrive in. "What is this range" comes before "what am I picking" comes before
        "where exactly". Leading with the chips, which is what the old layout did, answers the second
        question to somebody who has not asked the first.
      */}
      <p className="profession-range-guidance">{range.guidance}</p>

      {/*
        **The trainer stop goes inside the range that contains it, not before the next one.**
        Placing it between blocks worked while ranges were one material wide and breaks now they are
        seventy skill points: Artisan is trainable at 200, which falls mid-way through 175-245, and
        the between-blocks rule pushed its marker below that entire section — past the map a player
        would be looking at when their bar stopped. Containment is the same rule the summary table
        uses, so the two placements cannot disagree.
      */}
      <TrainingMarker milestones={training} />

      <p className="profession-range-materials">
        {materials.map((material) => (
          <MaterialChip key={material} material={material} />
        ))}
      </p>

      <ZoneRoutes profession={profession} range={range} />

      {range.needsVerification && (
        <small className="needs-verification">{range.notes ?? 'Needs source verification.'}</small>
      )}
      {!range.needsVerification && range.notes && <p className="profession-range-note">{range.notes}</p>}

      {/*
        The citation is the check, not a footnote. Every claim in the guidance above was verified
        against these before it was written, and printing them is what makes that verifiable by
        somebody who did not do it.
      */}
      <p className="profession-range-sources">Checked against {range.sources.join(', ')}</p>
    </section>
  )
}

/**
 * The whole gathering climb: prose, then the table, then the ranges with their maps.
 *
 * **The shape is borrowed and the content is not.** wow-professions.com puts the written guidance
 * first, a skill table under it, and the zone tabs below that, because it answers "should I be here
 * at all" before "where exactly" — and this app's previous layout, which opened with eleven
 * overlapping material sections, answered neither. `professionTypes.ts` records the standing rule
 * that their routes and orderings are linked and never copied; a page layout is not a route.
 *
 * Training appears twice on purpose. Once in the table, where it is part of the summary a player
 * reads before starting, and once as a marker in the progression, at the point where the bar
 * actually stops. Neither placement works alone: the table is read once and the marker is only found
 * by somebody already scrolling.
 */
export function GatheringProgression({ profession }: { profession: Profession }) {
  const guide = guideFor(profession)
  if (!guide) return null

  // Same containment rule as the table, computed once, so the two can never place a stop differently.
  const training = new Map(planRows(profession).map((row) => [row.skillRange[0], row.training]))
  const stranded = trainingOutsideRanges(profession)

  return (
    <div className="profession-progression profession-guide">
      {guide.intro.map((paragraph) => (
        <p className="profession-intro" key={paragraph.slice(0, 40)}>
          {paragraph}
        </p>
      ))}

      <GatheringPlanTable profession={profession} />

      <h3>Where to farm</h3>
      {guide.ranges.map((range) => (
        <Range
          key={range.skillRange[0]}
          profession={profession}
          range={range}
          training={training.get(range.skillRange[0]) ?? []}
        />
      ))}
      {/* A tier whose skill falls outside every range would otherwise have nowhere to appear. */}
      <TrainingMarker milestones={stranded} />
    </div>
  )
}
