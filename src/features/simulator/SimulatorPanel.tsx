import { useEffect } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import { animateResultCard } from '../../lib/animations'
import type { SimulationResult } from './simulationTypes'

type SimulatorPanelProps = {
  result: SimulationResult | undefined
  onRun: () => void
}

export function SimulatorPanel({ result, onRun }: SimulatorPanelProps) {
  useEffect(() => {
    if (result) animateResultCard('.simulation-result')
  }, [result])

  return (
    <Panel title="Simulation" eyebrow="Role-aware prototype">
      <p className="panel-copy">
        Run a deterministic prototype calculation using the current character role, gear, gems, enchants, and stat totals.
        These formulas are intentionally simple placeholders.
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
