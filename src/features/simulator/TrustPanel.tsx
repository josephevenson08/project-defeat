import { DPS_REFERENCE_SOURCE } from '../../domain/simulation/dpsReference'
import type { CharacterProfile } from '../character/characterTypes'
import { specTrust, trustRange } from './bestCase'
import { formatNumber, versusObserved } from './simFormat'

/**
 * "How far to trust it": every DPS spec's best case by this model against what players of it average.
 *
 * The best cases are worked out here, from the same function the calibration test in
 * `tests/planner.spec.ts` pins the range with, so the panel and the test cannot disagree. Your spec's
 * row is marked; healers and tanks, who have no reference, see the table without a mark.
 */
export function TrustPanel({ character, scoreExact }: { character: CharacterProfile; scoreExact: number }) {
  const rows = specTrust()
  const { low, high } = trustRange(rows)
  const max = Math.max(...rows.map((row) => row.dps))
  const yours = versusObserved(character.className, character.spec, scoreExact)

  return (
    <div className="sim-trust" data-testid="simulation-trust">
      <p className="sim-trust-key" aria-hidden="true">
        <span>
          <i className="obs" />
          What players average (archon.gg)
        </span>
        <span>
          <i className="mod" />
          This model at best case
        </span>
      </p>
      <ol className="sim-trust-specs" aria-label="Each DPS spec: the model's best case against what players average">
        {rows.map((row) => {
          const me = row.className === character.className && row.spec === character.spec
          return (
            <li key={`${row.className}-${row.spec}`} className={me ? 'sim-trust-yours' : undefined} aria-current={me ? 'true' : undefined}>
              <span className="sim-trust-name">
                {row.spec} {row.className}
              </span>
              <span className="sim-trust-bars" aria-hidden="true">
                <i className="obs" style={{ width: `${((row.dps / max) * 100).toFixed(1)}%` }} />
                <i className="mod" style={{ width: `${((row.best / max) * 100).toFixed(1)}%` }} />
              </span>
              <span className="sim-trust-nums">
                {formatNumber(row.best)} / {formatNumber(row.dps)}
              </span>
              <span className="sim-trust-x">{row.ratio.toFixed(2)}×</span>
            </li>
          )
        })}
      </ol>
      <p className="sim-small">
        Best case is the model&apos;s own number with rank-1 BiS, every buff and consumable and the sourced talents, the way the app&apos;s
        tests measure it. Across all {rows.length} DPS specs it reads <b>{low.toFixed(2)}×</b> to <b>{high.toFixed(2)}×</b> low
        {yours
          ? `; your character's ${formatNumber(scoreExact)} is ${yours.text} (${formatNumber(yours.observed)})`
          : ''}
        . {DPS_REFERENCE_SOURCE}.
      </p>
    </div>
  )
}
