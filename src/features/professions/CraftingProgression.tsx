import { craftingPlanRows, craftingTrainingOutsideSteps, formatCopper } from '../../domain/professions'
import type { CraftingStep, Profession, RecipeLeveling, TrainingMilestone } from '../../domain/professions'
import { CraftingPlanTable } from './CraftingPlanTable'
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
function Step({
  step,
  note,
  training,
}: {
  step: CraftingStep
  note?: string
  training: readonly TrainingMilestone[]
}) {
  return (
    <section className="profession-range profession-craft-step" data-testid="crafting-step">
      <header className="profession-range-header">
        <h4>
          {step.skillRange[0]} - {step.skillRange[1]}
        </h4>
        <span>{step.trainerTaught ? 'Trainer-taught' : 'Recipe found elsewhere'}</span>
        {/* The step's whole vendor bill, so the shopping half of the list has a total. */}
        {step.vendorCopper ? (
          <span className="profession-craft-vendor-total">{formatCopper(step.vendorCopper)} at a vendor</span>
        ) : null}
      </header>

      {/* The stop sits inside the step it interrupts, at the skill where the bar stops moving. */}
      <TrainingMarker milestones={training} />

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
            <div className="profession-craft-material-row">
              <MaterialChip material={material.name} icon={material.icon} />
              <span>{material.quantity}</span>
              {/*
                Bought, not farmed — and worth saying, because it changes what the number means. 45
                Coarse Thread is one vendor click; 45 Netherweave Cloth is an evening. The recipe that
                chose this step counted only the second kind.
              */}
              {material.vendorOnly && (
                <span className="profession-craft-vendor">
                  vendor{material.unitCopper ? ` · ${formatCopper(material.unitCopper)} ea` : ''}
                </span>
              )}
            </div>
            {/*
              What the reagent costs if you make it rather than buy it, flattened to what this
              profession cannot craft. Shown beside the material rather than replacing it: nobody
              farms Bolt of Linen Cloth, so 39 bolts really is 78 Linen Cloth — but a step asking for
              Primal Air is asking for a world drop that merely happens to be transmutable, and
              swapping in the transmute would be worse advice than saying nothing.
            */}
            {material.craftedFrom && (
              <p className="profession-craft-from">
                <span>if you craft it</span>
                {material.craftedFrom.map((leaf) => (
                  <span key={leaf.name} className="profession-craft-from-item">
                    {leaf.quantity} {leaf.name}
                  </span>
                ))}
              </p>
            )}
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
  profession,
  steps,
  curated,
  model,
}: {
  profession: Profession
  steps: readonly CraftingStep[]
  curated: readonly RecipeLeveling[]
  model: string
}) {
  /*
    **Same containment rule as the table, computed by the same function.** A milestone belongs to the
    step whose skill window contains it, not before the step that follows — Artisan is trainable at
    200 and a step running 175-245 is where a player's bar actually stops. Both surfaces read
    `craftingPlanRows`, so they cannot disagree about where that is.
  */
  const training = new Map(craftingPlanRows(profession).map((row) => [`${row.skillRange[0]}-${row.name}`, row.training]))
  const stranded = craftingTrainingOutsideSteps(profession)

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
      {/*
        The model line goes above the table rather than above the steps, because it qualifies every
        count in both — and the table is where a reader meets the first one.
      */}
      <p className="profession-progression-model" data-testid="crafting-model">
        {model}
      </p>

      {/*
        Same split as the gathering side, and it earns it harder: Blacksmithing is thirty-three steps
        where Mining is nine ranges. A summary that scrolls away after the first screen of a
        thirty-three step page is a summary nobody uses twice.
      */}
      <div className="profession-split">
        <div className="profession-split-side">
          <CraftingPlanTable profession={profession} />
        </div>

        <div className="profession-split-main">
          <h3>What to craft</h3>
          {steps.map((step) => (
            <div key={step.spellId + '-' + step.skillRange[0]}>
              <Step
                step={step}
                note={noteFor(step)}
                training={training.get(`${step.skillRange[0]}-${step.name}`) ?? []}
              />
            </div>
          ))}
          <TrainingMarker milestones={stranded} />
        </div>
      </div>
    </div>
  )
}
