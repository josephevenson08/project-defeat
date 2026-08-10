import { SelectField } from '../../components/ui/SelectField'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
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
    </section>
  )
}
