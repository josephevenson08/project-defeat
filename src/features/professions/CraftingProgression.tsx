import type { RecipeLeveling, TrainingMilestone } from '../../domain/professions'
import { TrainingMarker } from './TrainingMarker'

/**
 * The crafting climb: what to make, how many, and what it costs.
 *
 * **The unit is the sub-range, because that is the decision.** "Tailoring 1-375" is not actionable;
 * "40-67: 35x Linen Belt, 35 Bolt of Linen Cloth and 35 Coarse Thread" is a shopping list and a
 * number of clicks. The data already carries exactly this for 300-375 on every crafting profession —
 * what it does not yet carry is the same detail below 300, where nine professions still hold a single
 * summary row. Those render as what they are rather than as a step.
 *
 * **Materials stay text for now, and that is deliberate.** They are still prose in places — "15
 * Golden Sansam, Dreamfoil or Mountain Silversage, whichever matches the craft you picked" — and
 * splitting a quantity off the front of a sentence to hang an icon on it is the same "a label is not
 * a key" mistake that cost the gathering maps most of their coverage. They get icons when
 * `keyMaterials` gets structure.
 */
function CraftingStep({ step }: { step: RecipeLeveling }) {
  const isPlaceholder = step.needsVerification === true && step.skillRange[1] - step.skillRange[0] >= 200

  return (
    <section
      className={`profession-range profession-craft-step ${isPlaceholder ? 'profession-craft-summary' : ''}`.trim()}
      data-testid="crafting-step"
    >
      <header className="profession-range-header">
        <h4>
          {step.skillRange[0]} - {step.skillRange[1]}
        </h4>
      </header>

      <p className="profession-craft-recipe">{step.recipeOrItem}</p>

      {step.keyMaterials && step.keyMaterials.length > 0 && (
        <ul className="profession-craft-materials">
          {step.keyMaterials.map((material) => (
            <li key={material}>{material}</li>
          ))}
        </ul>
      )}

      <p className="profession-range-zones">{step.recipeSource}</p>

      {step.needsVerification && (
        <small className="needs-verification">{step.notes ?? 'Needs source verification.'}</small>
      )}
      {!step.needsVerification && step.notes && <p className="profession-range-note">{step.notes}</p>}
    </section>
  )
}

/**
 * The whole crafting path, with the training stops interleaved.
 *
 * Same placement rule as the gathering side: a milestone goes before the first step that begins at or
 * after the skill it unlocks, so "train Expert at 125" arrives between the range that took you there
 * and the range that will not start without it.
 */
export function CraftingProgression({
  steps,
  milestones,
}: {
  steps: readonly RecipeLeveling[]
  milestones: readonly TrainingMilestone[]
}) {
  const ordered = [...steps].sort((a, b) => a.skillRange[0] - b.skillRange[0])
  const pending = [...milestones]

  return (
    <div className="profession-progression">
      <h3>What to craft</h3>
      {ordered.map((step) => {
        const due = []
        while (pending.length > 0 && pending[0].atSkill <= step.skillRange[0]) due.push(pending.shift()!)
        return (
          <div key={`${step.skillRange[0]}-${step.recipeOrItem}`}>
            <TrainingMarker milestones={due} />
            <CraftingStep step={step} />
          </div>
        )
      })}
      <TrainingMarker milestones={pending} />
    </div>
  )
}
