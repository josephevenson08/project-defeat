import { useEffect } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import type { ActiveSet } from '../../domain/gear/itemSets'
import { animateResultCard } from '../../lib/animations'
import type { SimulationResult } from './simulationTypes'

type SimulatorPanelProps = {
  result: SimulationResult | undefined
  role: CharacterRole
  /** Sets the equipped gear has pieces of. Surfaced because none of their bonuses are applied to the score. */
  activeSets: readonly ActiveSet[]
  onRun: () => void
}

export function SimulatorPanel({ result, role, activeSets, onRun }: SimulatorPanelProps) {
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

      {activeSets.length > 0 && (
        <div className="set-bonus-list" data-testid="set-bonuses">
          <h4>Tier set pieces equipped</h4>
          <p className="panel-copy">
            None of these bonuses are applied to the score above. Almost every TBC set bonus attaches to a named
            ability, a resource cost, or the party rather than to stats, so folding them in as a stat total would
            invent value rather than estimate it. They are listed so the gap is visible: any ranking built from
            itemised stats alone <strong>undervalues tier pieces</strong>.
          </p>
          {activeSets.map(({ set, equippedPieces, activeBonuses }) => (
            <div className="set-bonus-entry" key={set.id}>
              <span className="set-bonus-name">
                {set.name} ({equippedPieces}/{set.totalPieces})
              </span>
              {set.bonuses.map((bonus) => {
                const live = activeBonuses.includes(bonus)
                return (
                  <small className={live ? 'set-bonus-active' : 'set-bonus-inactive'} key={bonus.pieces}>
                    ({bonus.pieces}) {bonus.description}
                    {live ? ' — active, not modelled' : ''}
                  </small>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
