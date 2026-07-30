import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { computeArmorMitigation } from '../../domain/simulation/damageFormulas'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'

const PLAYER_LEVEL = 70

/** Level 73 is the standard "raid boss" (skull) level; the lower entries cover trash and 5-man targets. */
const TARGET_LEVELS = [70, 71, 72, 73] as const

/**
 * Rough armor reference points so the number field isn't a blind guess. These are widely-cited
 * community approximations for TBC-era targets rather than tooltip-exact per-boss values, which is
 * why the panel says so out loud.
 */
const ARMOR_PRESETS = [
  { label: 'Cloth / caster target', armor: 3500 },
  { label: 'Typical raid boss', armor: 7700 },
  { label: 'Heavily armored boss', armor: 10643 },
] as const

type EncounterPanelProps = {
  target: SimulationTarget
  role: CharacterRole
  onChange: (target: SimulationTarget) => void
}

export function EncounterPanel({ target, role, onChange }: EncounterPanelProps) {
  const mitigation = computeArmorMitigation(target.armor, PLAYER_LEVEL)
  const levelDiff = target.level - PLAYER_LEVEL

  return (
    <Panel title="Encounter" eyebrow="Simulation target" accentColor={getRoleAccentColor(role)}>
      <p className="panel-copy">
        The target every estimate is run against. Level drives the attack-table miss/dodge/glancing
        penalties and spell hit floor; armor only affects physical damage.
      </p>

      <div className="form-grid">
        <label className="field">
          <span>Target level</span>
          <select
            value={String(target.level)}
            onChange={(event) => onChange({ ...target, level: Number(event.target.value) })}
          >
            {TARGET_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level} {level === 73 ? '(raid boss)' : `(+${level - PLAYER_LEVEL})`}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Target armor</span>
          <input
            type="number"
            min={0}
            max={30000}
            step={100}
            value={target.armor}
            aria-label="Target armor"
            onChange={(event) => onChange({ ...target, armor: Math.max(0, Number(event.target.value) || 0) })}
          />
        </label>
      </div>

      <div className="encounter-presets">
        {ARMOR_PRESETS.map((preset) => (
          <button
            className={`encounter-preset ${target.armor === preset.armor ? 'encounter-preset-active' : ''}`.trim()}
            key={preset.label}
            onClick={() => onChange({ ...target, armor: preset.armor })}
            type="button"
          >
            {preset.label}
            <small>{preset.armor.toLocaleString()}</small>
          </button>
        ))}
      </div>

      <div className="summary-card encounter-summary">
        <span>Physical damage reduced by armor</span>
        <strong data-testid="encounter-armor-mitigation">{(mitigation * 100).toFixed(1)}%</strong>
        <p>
          {levelDiff > 0
            ? `A +${levelDiff} level target raises your miss chance and, at +3, adds the full glancing-blow penalty against it.`
            : 'An even-level target carries no level-based miss or glancing penalty.'}
        </p>
        <small>
          Armor presets are community approximations for TBC-era targets, not tooltip-exact per-boss values.
        </small>
      </div>
    </Panel>
  )
}
