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
        Runs a TBC attack-table/spell-table simulation against a level 73 raid boss using the current character's stat
        totals, active buffs/consumables, and any target debuffs toggled below. Auto-attack/base-spell-damage rotation
        modeling is still a known gap — see the result summary for what each estimate does and doesn't cover yet.
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
    </Panel>
  )
}
