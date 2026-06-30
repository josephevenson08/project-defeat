import { Panel } from '../../components/layout/Panel'
import { SelectField } from '../../components/ui/SelectField'
import { characterClasses, factions, getClassDefinition, getRoleForSpec, racesByFaction, tbcClassNames } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Faction, Race } from './characterTypes'

type CharacterPanelProps = {
  character: CharacterProfile
  onChange: (character: CharacterProfile) => void
}

export function CharacterPanel({ character, onChange }: CharacterPanelProps) {
  const classDefinition = getClassDefinition(character.className)
  const role = getRoleForSpec(character.className, character.spec)
  const raceOptions = racesByFaction[character.faction]

  function handleFactionChange(faction: Faction) {
    onChange({ ...character, faction, race: racesByFaction[faction][0] })
  }

  function handleClassChange(className: CharacterClass) {
    const nextDefinition = getClassDefinition(className)
    onChange({ ...character, className, spec: nextDefinition.specs[0] })
  }

  return (
    <Panel title="Character" eyebrow="TBC build setup">
      <div className="form-grid">
        <SelectField label="Faction" value={character.faction} values={factions} onChange={handleFactionChange} />
        <SelectField label="Race" value={character.race} values={raceOptions} onChange={(race: Race) => onChange({ ...character, race })} />
        <SelectField label="Class" value={character.className} values={tbcClassNames} onChange={handleClassChange} />
        <SelectField
          label="Specialization"
          value={character.spec}
          values={classDefinition.specs}
          onChange={(spec: CharacterSpec) => onChange({ ...character, spec })}
        />
      </div>
      <div className="summary-card">
        <span>Current role</span>
        <strong>{role}</strong>
        <p>
          {character.race} {character.spec} {character.className}
        </p>
        <small>{characterClasses.length} TBC classes represented. Feral is treated as physical DPS until bear/cat mode is split.</small>
      </div>
    </Panel>
  )
}
