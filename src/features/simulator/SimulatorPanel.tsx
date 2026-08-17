import { useEffect } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { animateResultCard } from '../../lib/animations'
import type { SimulationResult } from './simulationTypes'

type SimulatorPanelProps = {
  result: SimulationResult | undefined
  role: CharacterRole
  onRun: () => void
}

export function SimulatorPanel({ result, role, onRun }: SimulatorPanelProps) {
  useEffect(() => {
    if (result) animateResultCard('.simulation-result')
  }, [result])

  return (
    <Panel title="Simulation" eyebrow="Role-aware prototype" accentColor={getRoleAccentColor(role)}>
      <p className="panel-copy">
        Runs a TBC attack-table/spell-table simulation against the target configured above, using the current
        character&apos;s stat totals, talents, active buffs and consumables, and any target debuffs toggled below.
        <strong> Rotation coverage is the standing gap:</strong> two specs layer their real special attacks on top of
        auto attacks, and the rest are modeled from a single signature ability, which understates any spec whose damage
        is spread across several buttons. Every estimate&apos;s summary names what it left out and why — read it, because
        the caveats differ by spec rather than being boilerplate.
      </p>
      <Button onClick={onRun}>Run Simulation</Button>
      {result ? (
        <div className="simulation-result" aria-live="polite">
          <span>{result.metricLabel}</span>
          <strong data-testid="simulation-score">{result.score}</strong>
          <p>{result.summary}</p>
          <div className="breakdown-list" aria-label="Result breakdown">
            {result.breakdown.map((entry) => (
              <div key={entry.label}>
                <span>{entry.label}</span>
                <strong>{Math.round(entry.value * 10) / 10}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="simulation-empty">No run yet. Configure a character and start a simulation.</div>
      )}

      {/*
        Set bonuses used to be listed here. They moved to the gear panel (`SetBonuses`), because a set
        bonus describes what you are wearing rather than what the simulation computed — leaving them
        here meant hiding the simulator also hid them. The caveat that they are never folded into the
        score still applies, and is stated there.
      */}
    </Panel>
  )
}
