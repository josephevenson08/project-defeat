import { planRows, trainingOutsideRanges } from '../../domain/professions'
import type { Profession } from '../../domain/professions'

/**
 * The whole climb in one table, with the trainer stops written into the rows.
 *
 * **This exists because a five-row tier table at the top of a page does not answer the question it
 * holds the answer to.** "Expert is trainable at 125" is only ever needed at the moment a player's
 * skill bar stops moving at 125, and at that moment they are three screens down looking at a map.
 * Weaving the stop into the row for the range it falls in is what the reference guides do, and it is
 * the reason their readers do not lose an hour to a stalled bar.
 *
 * It also gives the page a spine you can read in five seconds before committing to anything — which
 * the per-material version could not, because eleven overlapping sections do not summarise.
 */
export function GatheringPlanTable({ profession }: { profession: Profession }) {
  const rows = planRows(profession)
  const orphans = trainingOutsideRanges(profession)
  if (rows.length === 0) return null

  return (
    <section className="profession-plan" data-testid="gathering-plan">
      <h3>The whole climb</h3>
      <table className="profession-plan-table">
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">What you gather</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.skillRange[0]} data-testid="plan-row">
              <th scope="row">
                {row.skillRange[0]} – {row.skillRange[1]}
              </th>
              <td>
                {row.materials.join(', ')}
                {/*
                  The trainer stop sits inside the row rather than in a column of its own, because it
                  is a thing that happens partway through the range and a column would imply it
                  gates the whole row.
                */}
                {row.training.map((milestone) => (
                  <span className="profession-plan-train" key={milestone.tier} data-testid="plan-train">
                    At {milestone.atSkill}, train {milestone.tier} (character level{' '}
                    {milestone.requiredCharacterLevel})
                  </span>
                ))}
              </td>
              {/*
                Three zones, not the whole recommendation. The row is a summary and the section below
                carries the full list with a tab each; repeating eight zone names here would make the
                table as long as the thing it summarises.
              */}
              <td>{row.zones.slice(0, 3).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/*
        A tier whose skill falls outside every range would otherwise vanish from a table that claims
        to cover the whole climb. Nothing hits this today — all four gating tiers land inside a range
        for both professions — and it is here so that a future range edit that strands one says so.
      */}
      {orphans.length > 0 && (
        <p className="profession-plan-orphans">
          Also train:{' '}
          {orphans.map((milestone) => `${milestone.tier} at skill ${milestone.atSkill}`).join(', ')}.
        </p>
      )}
    </section>
  )
}
