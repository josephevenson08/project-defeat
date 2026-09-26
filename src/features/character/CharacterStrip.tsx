import { useState } from 'react'
import { SelectField } from '../../components/ui/SelectField'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { factions, getClassDefinition, getClassesForRace, isClassLegalForRace, racesByFaction, getRoleForSpec } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Faction, Race } from './characterTypes'

type CharacterStripProps = {
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
 * Who the character is, as one line at the top of the planner.
 *
 * **This replaced the left rail, and the trade is deliberate.** The rail stated the character as four
 * labelled dropdowns and ten profession toggles — fifteen controls, permanently on screen, for
 * decisions you make once. The owner's own heuristic evaluation rated the resulting density a major
 * problem, and counted: forty-six things to click on a planner that had nothing equipped yet.
 *
 * So the *fact* stays visible and the *controls* fold away. "Human Fury Warrior · Alliance" is what
 * you need while gearing; the selects behind "Change character" are what you need occasionally, and
 * swapping spec to compare two rankings still must not mean walking the four creation steps again.
 *
 * Professions are named here when held but set on the Professions tab, because Enchanting's ring
 * enchants move your stats: the cause has to be visible on the screen where the effect lands.
 */
export function CharacterStrip({ character, onChange, onRestart }: CharacterStripProps) {
  const [editing, setEditing] = useState(false)
  const classDefinition = getClassDefinition(character.className)
  const role = getRoleForSpec(character.className, character.spec)
  const held = character.professions ?? []

  return (
    <section
      className="character-strip"
      aria-label="Character"
      style={{ '--strip-accent': getRoleAccentColor(role) } as React.CSSProperties}
    >
      <div className="character-strip-line">
        {/* The page's own heading: this planner is about this character, and naming it is more use
            than repeating the site's name above every section. */}
        <h2 className="character-strip-name" data-testid="character-name">
          {character.race} {character.spec} {character.className}
        </h2>
        <p className="character-strip-meta">
          {character.faction} · Phase 2{held.length > 0 ? ` · ${held.join(', ')}` : ''}
        </p>
        <button
          type="button"
          className="character-strip-edit"
          aria-expanded={editing}
          onClick={() => setEditing((open) => !open)}
          data-testid="character-edit"
        >
          {editing ? 'Done' : 'Change character'}
        </button>
      </div>

      {editing && (
        <div className="character-strip-fields" data-testid="character-fields">
          <SelectField
            label="Faction"
            value={character.faction}
            values={factions}
            onChange={(faction: Faction) => onChange(withRace({ ...character, faction }, racesByFaction[faction][0]))}
          />
          <SelectField
            label="Race"
            value={character.race}
            values={racesByFaction[character.faction]}
            onChange={(race: Race) => onChange(withRace(character, race))}
          />
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
          <button type="button" className="character-strip-restart" onClick={onRestart} data-testid="restart-creator">
            Start over
          </button>
        </div>
      )}
    </section>
  )
}
