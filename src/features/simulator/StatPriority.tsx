import type { StatWeightsResult } from './calculateStatWeights'

function formatPerPoint(value: number) {
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.1) return value.toFixed(2)
  return value.toFixed(3)
}

/**
 * Step 1 of "What to do next": the stats to gem and enchant for, in order, from re-running the model
 * with each one nudged (`calculateStatWeights`).
 *
 * **Three kinds of row, kept apart because they mean different things.** A stat with a positive
 * weight is worth chasing; a modelled stat at zero adds nothing at this gear (past the hit cap, say);
 * a stat the engine does not read yet is unknown, not worthless, and is named on its own line so its
 * zero is never read as a verdict.
 */
export function StatPriority({ weights }: { weights: StatWeightsResult }) {
  const modeled = weights.entries.filter((entry) => !entry.notModeledYet)
  const worth = modeled.filter((entry) => entry.perPoint > 0)
  const nothing = modeled.filter((entry) => entry.perPoint <= 0)
  const unmodeled = weights.entries.filter((entry) => entry.notModeledYet)
  const maxRelative = Math.max(...worth.map((entry) => entry.relative), 1)
  const [first, second, third] = worth

  return (
    <section className="sim-step" aria-labelledby="sim-step-priority">
      <h3 id="sim-step-priority">
        <span className="sim-step-n" aria-hidden="true">
          1
        </span>
        Your stat priority
      </h3>
      {first && (
        <p className="sim-lead" data-testid="stat-priority">
          Gem and enchant for <b>{first.label}</b>
          {second && `, then ${second.label}`}
          {third && `, then ${third.label}`}.
        </p>
      )}
      <p className="sim-small">
        Each stat&apos;s worth in {weights.referenceLabel}, from re-running the model with {weights.probeAmount} more of it. Higher is
        better; crossing a cap, the hit cap above all, reshuffles the list.
      </p>
      <ol className="stat-weights" data-testid="stat-weights">
        {[...worth, ...nothing].map((entry) => (
          <li className={`stat-weight-row${entry.perPoint > 0 ? '' : ' stat-weight-none'}`} data-testid={`stat-weight-${entry.stat}`} key={entry.stat}>
            <span className="stat-weight-label">{entry.label}</span>
            <span className="stat-weight-bar" aria-hidden="true">
              <i style={{ width: `${Math.max(0, (entry.relative / maxRelative) * 100)}%` }} />
            </span>
            <span className="stat-weight-value">
              {entry.perPoint > 0 ? (
                <>
                  1 = {entry.relative.toFixed(2)} {weights.referenceLabel}
                  <small>{formatPerPoint(entry.perPoint)} a point</small>
                </>
              ) : (
                'adds nothing at this gear'
              )}
            </span>
          </li>
        ))}
      </ol>
      {unmodeled.length > 0 && (
        <p className="stat-weights-unmodeled">
          <b>Not modelled yet:</b> {unmodeled.map((entry) => entry.label).join(', ')}. The engine doesn&apos;t read{' '}
          {unmodeled.length === 1 ? 'it' : 'them'}, so {unmodeled.length === 1 ? 'its' : 'their'} worth is unknown here, not zero.
        </p>
      )}
    </section>
  )
}
