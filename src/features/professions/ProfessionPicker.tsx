import { PRIMARY_PROFESSION_LIMIT, primaryProfessions, toggleProfession } from '../../domain/professions/characterProfessions'
import type { CharacterProfile } from '../character/characterTypes'

type ProfessionPickerProps = {
  character: CharacterProfile
  onChange: (character: CharacterProfile) => void
}

/**
 * The two professions your character holds.
 *
 * **It used to live on the planner's rail**, ten toggles and a three-line explanation on a screen
 * about gear. The owner's heuristic evaluation named it in the finding about that screen's density,
 * and suggested taking it off there; this is where it went, next to the guides that say what each
 * profession is actually worth.
 *
 * Toggles rather than two selects, because the choice is "which two of ten" and a pair of dropdowns
 * would let you pick the same profession twice and have to police it afterwards. `toggleProfession`
 * caps the set, replacing the oldest rather than refusing the click.
 */
export function ProfessionPicker({ character, onChange }: ProfessionPickerProps) {
  const held = character.professions ?? []

  return (
    <section className="profession-picker" aria-label="Your professions" data-testid="profession-picker">
      <span className="profession-picker-head">
        Your professions
        <em>
          {held.length}/{PRIMARY_PROFESSION_LIMIT}
        </em>
      </span>

      <div className="profession-picker-list">
        {primaryProfessions.map((profession) => {
          const active = held.includes(profession)
          return (
            <button
              key={profession}
              type="button"
              className={`profession-toggle${active ? ' profession-toggle-on' : ''}`}
              aria-pressed={active}
              data-testid={`profession-${profession.toLowerCase().replaceAll(' ', '-')}`}
              onClick={() => onChange({ ...character, professions: toggleProfession(character.professions, profession) })}
            >
              {profession}
            </button>
          )
        })}
      </div>

      {/*
        Says what this control actually does, because the honest answer is "almost nothing" and a
        player who picks Blacksmithing expecting extra sockets is remembering Wrath. What each
        profession is worth at 70 is the guides below.
      */}
      <p className="profession-picker-note">
        Only <strong>Enchanting</strong> moves your stats: its two ring enchants, one per finger.
        Everything else is gear and recipe access. Your planner names whichever two you hold.
      </p>
    </section>
  )
}
