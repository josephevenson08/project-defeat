import { useEffect } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import { getRotationAbilities } from '../../domain/abilities'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { tbcClasses } from '../../domain/character/tbcClasses'
import { animateResultCard } from '../../lib/animations'
import type { SimulationResult } from './simulationTypes'

/**
 * How many specs have a real multi-ability rotation, **computed rather than written down**.
 *
 * This sentence said "two specs" while the answer was five, and it had been wrong since the day
 * Affliction, Shadow and Destruction gained their rotations. A test in `planner.spec.ts` already
 * asserted the real figure and its own comment even quoted the panel's stale number — so the count
 * was known to be wrong and nothing connected the two, which is this repo's recurring failure in its
 * purest form: prose describing code, updated by hand, on a surface a player reads.
 *
 * Derived at module scope because the ability catalogue is static data. Nothing here can drift now:
 * adding a rotation moves the number on screen in the same commit.
 */
const rotationCoverage = tbcClasses
  .flatMap((entry) => entry.specs.map((spec) => getRotationAbilities(entry.className, spec).length))
  .reduce(
    (totals, count) => (count > 1 ? { ...totals, multi: totals.multi + 1 } : { ...totals, single: totals.single + 1 }),
    { multi: 0, single: 0 },
  )

type SimulatorPanelProps = {
  result: SimulationResult | undefined
  role: CharacterRole
  onRun: () => void
}

/**
 * Renders the `**bold**` the researched notes are written with.
 *
 * These strings are authored as prose with emphasis — "**Feral Attack Power**", "**armor does not
 * reduce it**" — and were rendered as plain text, so a player read the asterisks. Twenty-one markers
 * across four ability files, some of them years-old and none of them ever visible as emphasis.
 *
 * Deliberately **not** a markdown renderer. It handles exactly one construct, splits on a literal
 * delimiter, and cannot emit HTML from the string — anything else in the prose stays literal, which
 * is the right trade for text that is authored in this repo rather than supplied by anyone.
 */
function withEmphasis(text: string) {
  // Odd indexes are the spans that sat between a pair of markers. An unpaired trailing `**` therefore
  // lands on an even index and renders as plain text rather than swallowing the rest of the note.
  return text.split('**').map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))
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
        <strong> Rotation coverage is the standing gap:</strong> {rotationCoverage.multi} specs layer their real special
        attacks on top of auto attacks, and the other {rotationCoverage.single} are modeled from a single signature
        ability, which understates any spec whose damage is spread across several buttons. Every estimate&apos;s summary
        names what it left out and why — read it, because the caveats differ by spec rather than being boilerplate.
      </p>
      <Button onClick={onRun}>Run Simulation</Button>
      {result ? (
        <div className="simulation-result" aria-live="polite">
          <span>{result.metricLabel}</span>
          <strong data-testid="simulation-score">{result.score}</strong>
          <p>{result.summary}</p>

          {/*
            What this estimate misses for THIS spec, in its own words.

            All 31 signature abilities carry researched prose on how far a single-ability
            approximation sits from that spec's real rotation — that a Beast Mastery hunter's damage
            largely bypasses Steady Shot, that Survival is brought for Expose Weakness rather than
            personal DPS — and none of it reached the interface until now.

            Its own block rather than more sentences in the summary: the summary says how the number
            was computed, this says why it is wrong for you, and the second is the one a reader
            actually needs. Given the warn treatment because it is a caveat, not commentary.
          */}
          {result.specNote && (
            <p className="simulation-spec-note" data-testid="simulation-spec-note">
              <strong>What this estimate misses for your spec:</strong> {withEmphasis(result.specNote)}
            </p>
          )}

          {/*
            Only appears once points are actually spent on something unmodelled, which is what keeps
            it from becoming furniture. Separate from the spec note above because it is a different
            claim: that one is about the rotation, this one is about the talents you chose.
          */}
          {result.unmodelledTalentNote && (
            <p className="simulation-spec-note" data-testid="simulation-talent-note">
              <strong>Talents you have spent that this cannot model:</strong> {withEmphasis(result.unmodelledTalentNote)}
            </p>
          )}

          {/*
            Where the damage actually comes from, in the shape a Warcraft Logs damage table has.

            Above the breakdown rather than below, because it answers the question a reader has first
            — "what is this number made of" — where `breakdown` answers "how was it computed". The two
            were one list until now, and mixing an input like crit chance in with an output like
            Windfury DPS is what stopped either question being answerable.

            The bar is the share, drawn the way a log draws it, so a spec can be scanned rather than
            read.
          */}
          {result.damageSources && result.damageSources.length > 0 && (
            <div className="damage-sources" data-testid="simulation-damage-sources">
              <h4 className="damage-sources-heading">Damage sources</h4>
              {result.damageSources.map((source) => (
                <div className="damage-source" key={source.name}>
                  <span className="damage-source-name">{source.name}</span>
                  <span className="damage-source-bar" aria-hidden="true">
                    <span style={{ width: `${Math.max(1, source.share * 100)}%` }} />
                  </span>
                  <span className="damage-source-share">{(source.share * 100).toFixed(1)}%</span>
                  <strong className="damage-source-dps">{Math.round(source.dps * 10) / 10}</strong>
                </div>
              ))}
            </div>
          )}

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
