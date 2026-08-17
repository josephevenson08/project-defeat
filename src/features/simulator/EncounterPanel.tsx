import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { computeArmorMitigation } from '../../domain/simulation/damageFormulas'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'

const PLAYER_LEVEL = 70

type EncounterPanelProps = {
  target: SimulationTarget
  role: CharacterRole
}

/**
 * What the simulation runs against — stated, not configured.
 *
 * This used to offer a target-level select, an armor field, three armor presets and a damage-taken
 * input. All of it went, by request: the point of the tab is to gear a character and press Run, and
 * four controls in front of that is ceremony charging rent. It follows the reference TBC simulators,
 * which fix a standard raid target rather than asking first.
 *
 * The target is still *named*, and that is not the same thing as configuring it. A DPS figure is
 * meaningless without knowing what it was measured against — the level gap drives the whole attack
 * table, and armor decides how much of the damage survives. Removing the controls should not remove
 * the reader's ability to know what the number means.
 *
 * `SimulationTarget` keeps every field it had, including `damageTakenPerSecond`. The domain can still
 * express all of it and the tests still exercise it; it simply is not asked of the player any more.
 */
export function EncounterPanel({ target, role }: EncounterPanelProps) {
  const mitigation = computeArmorMitigation(target.armor, PLAYER_LEVEL)
  const levelDiff = target.level - PLAYER_LEVEL

  return (
    <Panel title="Encounter" eyebrow="Simulation target" accentColor={getRoleAccentColor(role)}>
      <p className="panel-copy">
        Every estimate runs against one fixed target — a <strong>level {target.level}</strong> raid boss with{' '}
        <strong>{target.armor.toLocaleString()}</strong> armor. There is nothing to configure here: gear your
        character, then run the simulation.
      </p>

      <div className="summary-card encounter-summary">
        <span>Physical damage reduced by armor</span>
        <strong data-testid="encounter-armor-mitigation">{(mitigation * 100).toFixed(1)}%</strong>
        <p>
          {levelDiff > 0
            ? `A +${levelDiff} level target raises your miss chance and, at +3, adds the full glancing-blow penalty against it.`
            : 'An even-level target carries no level-based miss or glancing penalty.'}
        </p>
        <small>
          Armor is a widely-cited community approximation for a TBC raid boss, not a tooltip-exact per-boss value.
          Rage from damage taken is not counted, which understates rage-using specs — see the result summary.
        </small>
      </div>
    </Panel>
  )
}
