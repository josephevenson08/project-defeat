import { useState } from 'react'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { factions, getClassDefinition, getClassesForRace, racesByFaction, getRoleForSpec } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Faction, Race } from './characterTypes'

type Step = 'faction' | 'race' | 'class' | 'spec'

const STEPS: readonly { id: Step; title: string; prompt: string }[] = [
  { id: 'faction', title: 'Faction', prompt: 'Which side of the war are you fighting on?' },
  { id: 'race', title: 'Race', prompt: 'Your race decides which classes you can take, and what you are born good at.' },
  { id: 'class', title: 'Class', prompt: 'Only the classes your race can actually be are offered.' },
  { id: 'spec', title: 'Specialization', prompt: 'The tree you commit to. This drives every ranking and recommendation from here on.' },
]

type CharacterCreatorProps = {
  /** The character to start from — the current one when reopened, the default on a first run. */
  initial: CharacterProfile
  onComplete: (character: CharacterProfile) => void
  /** Present only when there is already a character to go back to. */
  onCancel?: () => void
}

/**
 * Character creation as a sequence rather than a form.
 *
 * Four selects in a grid state the choices but not their consequences: that race narrows class, and
 * that spec is the decision everything downstream reads. Stepping through them makes the dependency
 * visible — you cannot pick a class before a race, because the list does not exist yet.
 *
 * Each step commits immediately, so going back and changing an earlier answer re-narrows everything
 * after it. Picking Draenei when you had a Horde class selected has to change the class, and doing
 * that silently in a grid is how you end up with a character you did not choose.
 */
export function CharacterCreator({ initial, onComplete, onCancel }: CharacterCreatorProps) {
  const [draft, setDraft] = useState<CharacterProfile>(initial)
  const [stepIndex, setStepIndex] = useState(0)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const accent = getRoleAccentColor(getRoleForSpec(draft.className, draft.spec))

  /** Re-narrows every dependent choice, so the draft is always a legal character. */
  function chooseFaction(faction: Faction) {
    const race = racesByFaction[faction][0]
    const className = getClassesForRace(race)[0]
    setDraft({ faction, race, className, spec: getClassDefinition(className).specs[0] })
  }

  function chooseRace(race: Race) {
    const className = getClassesForRace(race).includes(draft.className) ? draft.className : getClassesForRace(race)[0]
    const specs = getClassDefinition(className).specs
    setDraft({ ...draft, race, className, spec: specs.includes(draft.spec) ? draft.spec : specs[0] })
  }

  function chooseClass(className: CharacterClass) {
    setDraft({ ...draft, className, spec: getClassDefinition(className).specs[0] })
  }

  const options: { value: string; label: string; onSelect: () => void; selected: boolean }[] =
    step.id === 'faction'
      ? factions.map((faction) => ({ value: faction, label: faction, onSelect: () => chooseFaction(faction), selected: draft.faction === faction }))
      : step.id === 'race'
        ? racesByFaction[draft.faction].map((race) => ({ value: race, label: race, onSelect: () => chooseRace(race), selected: draft.race === race }))
        : step.id === 'class'
          ? getClassesForRace(draft.race).map((className) => ({
              value: className,
              label: className,
              onSelect: () => chooseClass(className),
              selected: draft.className === className,
            }))
          : getClassDefinition(draft.className).specs.map((spec: CharacterSpec) => ({
              value: spec,
              label: spec,
              onSelect: () => setDraft({ ...draft, spec }),
              selected: draft.spec === spec,
            }))

  return (
    <div className="creator" style={{ '--creator-accent': accent } as React.CSSProperties} data-testid="character-creator">
      <div className="creator-inner">
        <ol className="creator-progress" aria-label="Character creation steps">
          {STEPS.map((entry, index) => (
            <li
              key={entry.id}
              className={index === stepIndex ? 'creator-step-current' : index < stepIndex ? 'creator-step-done' : 'creator-step-todo'}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              <span className="creator-step-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="creator-step-title">{entry.title}</span>
              {/* Answered steps show their answer, so the choices already made stay readable. */}
              <span className="creator-step-answer">
                {index < stepIndex
                  ? entry.id === 'faction'
                    ? draft.faction
                    : entry.id === 'race'
                      ? draft.race
                      : entry.id === 'class'
                        ? draft.className
                        : draft.spec
                  : ''}
              </span>
            </li>
          ))}
        </ol>

        <div className="creator-stage">
          <p className="creator-eyebrow">Step {stepIndex + 1} of {STEPS.length}</p>
          <h2>{step.title}</h2>
          <p className="creator-prompt">{step.prompt}</p>

          <div className="creator-options" role="group" aria-label={step.title}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`creator-option${option.selected ? ' creator-option-selected' : ''}`}
                onClick={option.onSelect}
                data-testid={`creator-option-${option.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                aria-pressed={option.selected}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="creator-actions">
            {stepIndex > 0 && (
              <button type="button" className="creator-back" onClick={() => setStepIndex(stepIndex - 1)} data-testid="creator-back">
                Back
              </button>
            )}
            {stepIndex === 0 && onCancel && (
              <button type="button" className="creator-back" onClick={onCancel} data-testid="creator-cancel">
                Cancel
              </button>
            )}
            <button
              type="button"
              className="creator-next"
              onClick={() => (isLast ? onComplete(draft) : setStepIndex(stepIndex + 1))}
              data-testid={isLast ? 'creator-confirm' : 'creator-next'}
            >
              {isLast ? `Play as ${draft.race} ${draft.spec} ${draft.className}` : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
