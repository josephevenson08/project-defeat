import type { CraftingStep, RecipeLeveling, TrainingMilestone } from '../../domain/professions'
import { MaterialChip } from './MaterialChip'
import { TrainingMarker } from './TrainingMarker'

/**
 * One computed step: what to make, how many, and the shopping list for the whole step.
 *
 * **The craft count is derived and the page says so**, because a number that looks sourced and is
 * not is worse than one that admits what it is. `crafts` is an expectation over the skill-up
 * probabilities, so it is the count that gets you there on average — not a guarantee, and the
 * caption at the top of the list carries that.
 */
function Step({ step, note }: { step: CraftingStep; note?: string }) {
  return (
    <section className="profession-range profession-craft-step" data-testid="crafting-step">
      <header className="profession-range-header">
        <h4>
          {step.skillRange[0]} - {step.skillRange[1]}
        </h4>
        <span>{step.trainerTaught ? 'Trainer-taught' : 'Recipe found elsewhere'}</span>
      </header>

      <p className="profession-craft-recipe">
        {step.createsIcon && (
          <img
            className="material-chip-icon"
            src={`${import.meta.env.BASE_URL}icons/${step.createsIcon}.jpg`}
            alt=""
            loading="lazy"
          />
        )}
        <strong>{step.crafts}×</strong> {step.name}
      </p>

      <ul className="profession-craft-materials">
        {step.materials.map((material) => (
          <li key={material.name}>
            <MaterialChip material={material.name} icon={material.icon} />
            <span>{material.quantity}</span>
          </li>
        ))}
      </ul>

      {/*
        The curated 300-375 rows carry editorial detail no computation produces — which trainer, which
        vendor sells the recipe, "buy the other pattern on the same trip". Those notes are kept and
        attached to the computed step whose range they overlap, rather than thrown away with the rows
        that held them.
      */}
      {note && <p className="profession-range-note">{note}</p>}
    </section>
  )
}

/**
 * The crafting climb, computed end to end.
 *
 * **This replaces nine placeholder rows that covered 1-300 with a single sentence each.** The old
 * data had real detail from 300 up and "see a dedicated vanilla guide" below it, because filling in
 * the rest by hand meant transcribing somebody's guide. Deriving it from recipe facts does not.
 *
 * Milestones interleave the same way the gathering side does: a trainer visit goes before the first
 * step that begins at or after the skill it unlocks.
 */
export function CraftingProgression({
  steps,
  curated,
  milestones,
  model,
}: {
  steps: readonly CraftingStep[]
  curated: readonly RecipeLeveling[]
  milestones: readonly TrainingMilestone[]
  model: string
}) {
  const pending = [...milestones]

  /** A curated note belongs to the computed step whose range it overlaps. */
  const noteFor = (step: CraftingStep) =>
    curated.find(
      (row) =>
        row.notes &&
        row.skillRange[0] < step.skillRange[1] &&
        row.skillRange[1] > step.skillRange[0] &&
        row.skillRange[1] - row.skillRange[0] < 200,
    )?.notes

  return (
    <div className="profession-progression">
      <h3>What to craft</h3>
      <p className="profession-progression-model" data-testid="crafting-model">
        {model}
      </p>
      {steps.map((step) => {
        const due = []
        while (pending.length > 0 && pending[0].atSkill <= step.skillRange[0]) due.push(pending.shift()!)
        return (
          <div key={step.spellId + '-' + step.skillRange[0]}>
            <TrainingMarker milestones={due} />
            <Step step={step} note={noteFor(step)} />
          </div>
        )
      })}
      <TrainingMarker milestones={pending} />
    </div>
  )
}
