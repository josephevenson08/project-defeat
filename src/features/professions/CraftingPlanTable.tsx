import { craftingPlanRows, craftingTrainingOutsideSteps } from '../../domain/professions'
import type { Profession } from '../../domain/professions'

/**
 * The whole crafting climb in one table, with the trainer stops written into the rows.
 *
 * **The crafting pages needed the same spine the gathering pages got.** A page that opens on
 * thirty-three step cards answers "what exactly do I make at 212" to somebody who has not yet asked
 * "how long is this going to take and what am I going to need". The table answers the second
 * question, and it is the only place a trainer stop appears before you are already scrolling past
 * the point it gates.
 *
 * It is longer than the gathering one — Blacksmithing is thirty-three rows against Mining's nine —
 * because a crafting step is a recipe rather than a skill window, and there are simply more of them.
 * That is still the right shape: the reference guides put their whole crafting path in a table for
 * the same reason, and a row you scan past costs nothing while a card you scroll past costs a screen.
 */
export function CraftingPlanTable({ profession }: { profession: Profession }) {
  const rows = craftingPlanRows(profession)
  const orphans = craftingTrainingOutsideSteps(profession)
  if (rows.length === 0) return null

  return (
    <section className="profession-plan" data-testid="crafting-plan">
      <h3>The whole climb</h3>
      <table className="profession-plan-table">
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">What to make</th>
            <th scope="col">Mostly needs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.skillRange[0]}-${row.name}`} data-testid="crafting-plan-row">
              <th scope="row">
                {row.skillRange[0]} – {row.skillRange[1]}
              </th>
              <td>
                {/*
                  The count leads, because it is the part that decides whether this step is an
                  evening or a minute — and it is derived, which the model line under the steps says.
                */}
                <strong>{row.crafts}×</strong> {row.name}
                {row.training.map((milestone) => (
                  <span className="profession-plan-train" key={milestone.tier} data-testid="plan-train">
                    At {milestone.atSkill}, train {milestone.tier} (character level{' '}
                    {milestone.requiredCharacterLevel})
                  </span>
                ))}
              </td>
              <td>{row.materials.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {orphans.length > 0 && (
        <p className="profession-plan-orphans">
          Also train:{' '}
          {orphans.map((milestone) => `${milestone.tier} at skill ${milestone.atSkill}`).join(', ')}.
        </p>
      )}
    </section>
  )
}
