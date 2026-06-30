import { Panel } from '../../components/layout/Panel'
import { SelectField } from '../../components/ui/SelectField'
import { characterClasses, getClassDefinition, races } from './characterData'
import type { CharacterClass, CharacterProfile, CharacterSpec, Race } from './characterTypes'

type CharacterPanelProps = {
  character: CharacterProfile
  onChange: (character: CharacterProfile) => void
}

export function CharacterPanel({ character, onChange }: CharacterPanelProps) {
  const classDefinition = getClassDefinition(character.className)
  const classNames = characterClasses.map((entry) => entry.className)

  function handleClassChange(className: CharacterClass) {
    const nextDefinition = getClassDefinition(className)
    onChange({ ...character, className, spec: nextDefinition.specs[0] })
  }

  return (
    <Panel title="Character" eyebrow="Build setup">
      <div className="form-grid">
        <SelectField label="Class" value={character.className} values={classNames} onChange={handleClassChange} />
        <SelectField
          label="Specialization"
          value={character.spec}
          values={classDefinition.specs}
          onChange={(spec: CharacterSpec) => onChange({ ...character, spec })}
        />
        <SelectField label="Race" value={character.race} values={races} onChange={(race: Race) => onChange({ ...character, race })} />
      </div>
      <div className="summary-card">
        <span>Current role</span>
        <strong>{classDefinition.role}</strong>
        <p>
          {character.race} {character.spec} {character.className}
        </p>
      </div>
    </Panel>
  )
}
