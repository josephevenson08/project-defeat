import type { CharacterProfile } from '../character/characterTypes'
import { formatBreakdownValue, formatNumber, versusObserved } from './simFormat'
import type { SimulationResult } from './simulationTypes'
import { TrustPanel } from './TrustPanel'

/**
 * Renders the `**bold**` the researched notes are written with.
 *
 * Deliberately **not** a markdown renderer. It handles exactly one construct, splits on a literal
 * delimiter, and cannot emit HTML from the string; anything else in the prose stays literal, which is
 * the right trade for text authored in this repo rather than supplied by anyone.
 */
function withEmphasis(text: string) {
  // Odd indexes are the spans between a pair of markers, so an unpaired trailing `**` lands on an even
  // index and renders as plain text rather than swallowing the rest of the note.
  return text.split('**').map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))
}

/**
 * Step 3 of "What to do next": the estimate, and how far to trust it.
 *
 * Last rather than first, by the decided design: what to act on leads, and the number follows with
 * what it misses for you, where the damage comes from (the shape of a Warcraft Logs damage table, which
 * sums to the estimate), how it was computed, and every DPS spec's best case against the logs.
 */
export function TheEstimate({ character, result }: { character: CharacterProfile; result: SimulationResult }) {
  const versus = versusObserved(character.className, character.spec, result.scoreExact)
  const sources = result.damageSources ?? []

  return (
    <section className="sim-step sim-step-wide" aria-labelledby="sim-step-estimate">
      <h3 id="sim-step-estimate">
        <span className="sim-step-n" aria-hidden="true">
          3
        </span>
        The estimate, and how far to trust it
      </h3>
      <div className="sim-estimate" aria-live="polite">
        <span className="sim-metric">{result.metricLabel}</span>
        <strong className="sim-score" data-testid="simulation-score">
          {formatNumber(result.score, 1)}
        </strong>
        {versus && (
          <span className="sim-versus" data-testid="simulation-versus">
            {versus.text} ({formatNumber(versus.observed)}, archon.gg)
          </span>
        )}
      </div>

      {(result.specNote || result.unmodelledTalentNote) && (
        <div className="sim-misses">
          {/*
            What this estimate misses for THIS spec, in its own words, then the talents you spent that
            the model cannot express. Two claims, so two lines: one is about the rotation, the other
            about the talents you chose, and the second only appears once points are actually spent.
          */}
          {result.specNote && (
            <p className="simulation-spec-note" data-testid="simulation-spec-note">
              <strong>What this estimate misses for your spec:</strong> {withEmphasis(result.specNote)}
            </p>
          )}
          {result.unmodelledTalentNote && (
            <p className="simulation-spec-note" data-testid="simulation-talent-note">
              <strong>Talents you have spent that this cannot model:</strong> {withEmphasis(result.unmodelledTalentNote)}
            </p>
          )}
        </div>
      )}

      <div className="sim-tables">
        {sources.length > 0 && (
          <div>
            <h4>Where the damage comes from</h4>
            <table className="sim-sources" data-testid="simulation-damage-sources">
              <caption className="visually-hidden">Damage sources</caption>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col" className="num">
                    DPS
                  </th>
                  <th scope="col" className="num">
                    Share
                  </th>
                  <th scope="col">
                    <span className="visually-hidden">Share bar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr className="damage-source" key={source.name}>
                    <td>{source.name}</td>
                    <td className="num damage-source-dps">{formatNumber(source.dps, 1)}</td>
                    <td className="num damage-source-share">{formatNumber(source.share * 100, 1)}%</td>
                    <td className="sim-sources-bar" aria-hidden="true">
                      <span>
                        <i style={{ width: `${Math.max(1, source.share * 100)}%` }} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <h4>How the number was computed</h4>
          <p className="sim-small sim-summary" data-testid="simulation-summary">
            {result.summary}
          </p>
          <dl className="breakdown-list" aria-label="Result breakdown">
            {result.breakdown.map((entry) => (
              <div key={entry.label}>
                <dt>{entry.label}</dt>
                <dd>{formatBreakdownValue(entry.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <TrustPanel character={character} scoreExact={result.scoreExact} />
    </section>
  )
}
