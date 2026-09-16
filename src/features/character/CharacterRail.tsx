import { useState } from 'react'
import { SelectField } from '../../components/ui/SelectField'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { PRIMARY_PROFESSION_LIMIT, primaryProfessions, toggleProfession } from '../../domain/professions/characterProfessions'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { factions, getClassDefinition, getClassesForRace, isClassLegalForRace, racesByFaction, getRoleForSpec } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Faction, Race } from './characterTypes'

type CharacterRailProps = {
  character: CharacterProfile
  onChange: (character: CharacterProfile) => void
  /** Reopens the full step-by-step creator. */
  onRestart: () => void
}

// Race is the free-standing choice (like real WoW character creation) and Class options follow it.
// If a race change makes the current class illegal, fall through to that race's first class.
function withRace(character: CharacterProfile, race: Race): CharacterProfile {
  if (isClassLegalForRace(character.className, race)) return { ...character, race }

  const nextClassName = getClassesForRace(race)[0]
  return { ...character, race, className: nextClassName, spec: getClassDefinition(nextClassName).specs[0] }
}

/**
 * Who the character is, in the rail rather than on the planner tab.
 *
 * The tab is for what you are *doing* — gear, rankings, builds. Identity is context for all of it,
 * which is the same argument that put the stat totals here: it belongs on the surface that never
 * navigates away, next to the numbers it produces.
 *
 * `CharacterCreator` is still the way in and the way to start over. This is the quick edit — swapping
 * spec to compare two rankings should not mean walking four steps again.
 */
export function CharacterRail({ character, onChange, onRestart }: CharacterRailProps) {
  const classDefinition = getClassDefinition(character.className)
  const role = getRoleForSpec(character.className, character.spec)
  const held = character.professions ?? []

  // The shell's own breakpoint — the same one `StatsRail` collapses at, for the same reason.
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const [professionsOpen, setProfessionsOpen] = useState(false)
  const pickerVisible = !isNarrow || professionsOpen

  return (
    <section className="rail-character" aria-label="Character" style={{ '--rail-accent': getRoleAccentColor(role) } as React.CSSProperties}>
      <div className="rail-character-head">
        <h2 className="rail-heading">Character</h2>
        <button type="button" className="rail-character-restart" onClick={onRestart} data-testid="restart-creator">
          Start over
        </button>
      </div>

      <SelectField
        label="Faction"
        value={character.faction}
        values={factions}
        onChange={(faction: Faction) => onChange(withRace({ ...character, faction }, racesByFaction[faction][0]))}
      />
      <SelectField label="Race" value={character.race} values={racesByFaction[character.faction]} onChange={(race: Race) => onChange(withRace(character, race))} />
      <SelectField
        label="Class"
        value={character.className}
        values={getClassesForRace(character.race)}
        onChange={(className: CharacterClass) => onChange({ ...character, className, spec: getClassDefinition(className).specs[0] })}
      />
      <SelectField
        label="Specialization"
        value={character.spec}
        values={classDefinition.specs}
        onChange={(spec: CharacterSpec) => onChange({ ...character, spec })}
      />

      {/*
        Toggles rather than two selects, because the choice is "which two of ten" and a pair of
        dropdowns would let you pick the same profession twice and have to police it afterwards.
        `toggleProfession` caps the set, replacing the oldest rather than refusing the click.
      */}
      <div className="rail-professions" data-testid="rail-professions">
        {/*
          On a phone the picker sits behind a disclosure, like the stat readout below it. It is a
          choice you make once, and open it was 160px — measured, it was a large part of why the
          gear panel started below the first screen. The summary names what is held, so a collapsed
          picker still answers the only question you have about it after the first visit.
        */}
        {isNarrow ? (
          <button
            type="button"
            className="rail-professions-head rail-professions-disclosure"
            aria-expanded={professionsOpen}
            onClick={() => setProfessionsOpen((current) => !current)}
            data-testid="rail-professions-disclosure"
          >
            Professions
            <em>{professionsOpen ? 'Hide' : held.length > 0 ? held.join(', ') : 'None'}</em>
          </button>
        ) : (
          <span className="rail-professions-head">
            Professions
            <em>
              {held.length}/{PRIMARY_PROFESSION_LIMIT}
            </em>
          </span>
        )}

        {pickerVisible && (
          <div className="rail-profession-list">
            {primaryProfessions.map((profession) => {
              const active = held.includes(profession)
              return (
                <button
                  key={profession}
                  type="button"
                  className={`rail-profession${active ? ' rail-profession-on' : ''}`}
                  aria-pressed={active}
                  data-testid={`profession-${profession.toLowerCase().replaceAll(' ', '-')}`}
                  onClick={() => onChange({ ...character, professions: toggleProfession(character.professions, profession) })}
                >
                  {profession}
                </button>
              )
            })}
          </div>
        )}

        {/*
          Says what this control actually does, because the honest answer is "almost nothing" and a
          player who picks Blacksmithing expecting extra sockets is remembering Wrath. The full
          picture — gear access, recipes, what each is worth at 70 — is the Professions tab's job.
        */}
        {pickerVisible && (
          <p className="rail-professions-note">
            Only <strong>Enchanting</strong> moves your stats: its two ring enchants, one per finger.
            Everything else is gear and recipe access — see the Professions tab.
          </p>
        )}
      </div>
    </section>
  )
}
