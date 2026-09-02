import type { TrainingMilestone } from '../../domain/professions'

/**
 * "Stop here and go train."
 *
 * **A skill bar that has stopped moving is the most common way to lose an hour to a profession**, and
 * it looks exactly like running out of nodes. The old tier table held the answer — Expert is
 * trainable at 125 — in a five-row grid at the top of the page that nobody reads at the moment they
 * need it. Here it sits in the progression, between the range that ends and the range that cannot
 * start until you have been to a trainer.
 *
 * **Consecutive milestones collapse into one marker, and that is a symptom made legible rather than
 * hidden.** Nine crafting professions still carry their whole 1-300 climb as a single summary row, so
 * every trainer visit below 300 lands in the same gap and four full-size markers stack up under it —
 * more vertical space than the step they annotate. One line says the same thing. When those summary
 * rows are itemised into real sub-ranges, the milestones distribute on their own and this collapses
 * back to the single form with no change here.
 */
export function TrainingMarker({ milestones }: { milestones: readonly TrainingMilestone[] }) {
  if (milestones.length === 0) return null

  if (milestones.length === 1) {
    const only = milestones[0]
    return (
      <aside className="profession-training" data-testid="training-marker">
        <strong>
          Train {only.tier} at skill {only.atSkill}
        </strong>
        <span>Requires character level {only.requiredCharacterLevel}</span>
        <p>{only.trainedFrom}</p>
        {only.needsVerification && (
          <small className="needs-verification">{only.notes ?? 'Needs source verification.'}</small>
        )}
      </aside>
    )
  }

  return (
    <aside className="profession-training" data-testid="training-marker">
      <strong>{milestones.length} trainer visits before the next itemised step</strong>
      <ul className="profession-training-list">
        {milestones.map((milestone) => (
          <li key={milestone.tier}>
            <b>{milestone.tier}</b> at skill {milestone.atSkill}, character level{' '}
            {milestone.requiredCharacterLevel}
          </li>
        ))}
      </ul>
      {/*
        The last one is the one that differs: every pre-Outland tier is "any Azeroth trainer", while
        Master is a named trainer in a named zone. Quoting only that keeps the block short without
        dropping the part a player cannot guess.
      */}
      <p>{milestones[milestones.length - 1].trainedFrom}</p>
    </aside>
  )
}
