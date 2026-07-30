import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import type { StatWeightsResult } from './calculateStatWeights'

type StatWeightsPanelProps = {
  weights: StatWeightsResult
  role: CharacterRole
}

function formatPerPoint(value: number) {
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.1) return value.toFixed(2)
  return value.toFixed(3)
}

export function StatWeightsPanel({ weights, role }: StatWeightsPanelProps) {
  const modeled = weights.entries.filter((entry) => !entry.notModeledYet)
  const unmodeled = weights.entries.filter((entry) => entry.notModeledYet)
  const best = modeled[0]
  const maxRelative = Math.max(...modeled.map((entry) => Math.abs(entry.relative)), 1)

  return (
    <Panel title="Stat Priority" eyebrow="Stat weights (EP)" accentColor={getRoleAccentColor(role)} className="stat-weights-panel-shell">
      <p className="panel-copy">
        Each stat is probed by adding {weights.probeAmount} of it, re-running the simulation, and measuring how far the
        result moved. Values are per single point, normalized so 1 point of {weights.referenceLabel} = 1.00. A stat
        sitting at 0 here is either already capped (extra points genuinely do nothing) or not yet modeled — the two are
        listed separately below.
      </p>

      <div className="stat-weights" data-testid="stat-weights">
        {modeled.map((entry) => (
          <div className="stat-weight-row" data-testid={`stat-weight-${entry.stat}`} key={entry.stat}>
            <span className="stat-weight-label">{entry.label}</span>
            <div className="stat-weight-bar-track" aria-hidden="true">
              <div
                className="stat-weight-bar-fill"
                style={{ width: `${Math.max(0, (entry.relative / maxRelative) * 100)}%` }}
              />
            </div>
            <span className="stat-weight-relative">{entry.relative.toFixed(2)}</span>
            <span className="stat-weight-perpoint">
              {formatPerPoint(entry.perPoint)} / pt
            </span>
          </div>
        ))}
      </div>

      {best && best.relative > 0 && (
        <div className="summary-card stat-weights-summary">
          <span>Highest value stat</span>
          <strong data-testid="stat-weights-best">{best.label}</strong>
          <p>
            Worth {best.relative.toFixed(2)}x a point of {weights.referenceLabel} at this gear level. Re-check after
            large gear changes — crossing the hit cap in particular reshuffles this list.
          </p>
        </div>
      )}

      {unmodeled.length > 0 && (
        <div className="stat-weights-unmodeled">
          <h3>Not modeled by the simulator yet</h3>
          <p>
            These score zero because the engine doesn&apos;t read them, <strong>not</strong> because they&apos;re
            worthless in TBC. Treat their real value as unknown here.
          </p>
          <ul>
            {unmodeled.map((entry) => (
              <li key={entry.stat}>{entry.label}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
