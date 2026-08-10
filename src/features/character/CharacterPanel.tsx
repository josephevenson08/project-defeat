import { Panel } from '../../components/layout/Panel'
import { SelectField } from '../../components/ui/SelectField'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { factions, getClassDefinition, getClassesForRace, isClassLegalForRace, racesByFaction, getRoleForSpec } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Faction, Race } from './characterTypes'

type CharacterPanelProps = {
  character: CharacterProfile
  onChange: (character: CharacterProfile) => void
}

// Race is the free-standing choice (like real WoW character creation) and Class options follow
// it. If a race change makes the current class illegal, fall through to that race's first class.
function withRace(character: CharacterProfile, race: Race): CharacterProfile {
  if (isClassLegalForRace(character.className, race)) return { ...character, race }

  const nextClassName = getClassesForRace(race)[0]
  const nextDefinition = getClassDefinition(nextClassName)
  return { ...character, race, className: nextClassName, spec: nextDefinition.specs[0] }
}

export function CharacterPanel({ character, onChange }: CharacterPanelProps) {
  const classDefinition = getClassDefinition(character.className)
  const role = getRoleForSpec(character.className, character.spec)
  const raceOptions = racesByFaction[character.faction]
  const classOptions = getClassesForRace(character.race)

  function handleFactionChange(faction: Faction) {
    onChange(withRace({ ...character, faction }, racesByFaction[faction][0]))
  }

  function handleRaceChange(race: Race) {
    onChange(withRace(character, race))
  }

  function handleClassChange(className: CharacterClass) {
    const nextDefinition = getClassDefinition(className)
    onChange({ ...character, className, spec: nextDefinition.specs[0] })
  }

  return (
    <Panel title="Character" eyebrow="TBC build setup" accentColor={getRoleAccentColor(role)}>
      <div className="form-grid">
        <SelectField label="Faction" value={character.faction} values={factions} onChange={handleFactionChange} />
        <SelectField label="Race" value={character.race} values={raceOptions} onChange={handleRaceChange} />
        <SelectField label="Class" value={character.className} values={classOptions} onChange={handleClassChange} />
        <SelectField
          label="Specialization"
          value={character.spec}
          values={classDefinition.specs}
          onChange={(spec: CharacterSpec) => onChange({ ...character, spec })}
        />
      </div>
      {/*
        The "current role" card and the racial traits list were both removed here by request.
        Neither the role nor the racials are gone from the model: the role still drives the panel
        accent above and every role-aware list in the app, and `applyRacialTraits` still folds the
        racials into the stat totals on the rail. They simply are not restated on this panel.
      */}
    </Panel>
  )
}
