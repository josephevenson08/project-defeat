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
    <Panel title="Simulation" eyebrow="Prototype run">
      <p className="panel-copy">
        Run a deterministic placeholder calculation using the current gear and stat totals. Accuracy comes later; the MVP
        proves the local workflow.
      </p>
      <Button onClick={onRun}>Run Simulation</Button>
      {result ? (
        <div className="simulation-result" aria-live="polite">
          <span>Estimated DPS</span>
          <strong>{result.estimatedDps}</strong>
          <p>{result.summary}</p>
        </div>
      ) : (
        <div className="simulation-empty">No run yet. Configure a character and start a simulation.</div>
      )}
    </Panel>
  )
}
