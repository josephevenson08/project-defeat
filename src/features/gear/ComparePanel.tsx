import { useMemo, useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById } from '../../domain/gems/sampleGems'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import type { TalentPoints } from '../../domain/talents/talentTypes'
import { isSimulationEnabled } from '../../featureFlags'
import type { CharacterProfile } from '../character/characterTypes'
import {
  comparableItemsFor,
  comparableSlotsFor,
  compareItems,
  defaultComparisonPair,
  type ComparisonContext,
  type ComparisonSide,
} from './compareItems'
import { getGearSlotDisplayName } from './gearData'
import type { EquippedGear, GearItem, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { slotGlyph } from './slotGlyphs'

type ComparePanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  role: CharacterRole
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  target?: SimulationTarget
  talentPoints: TalentPoints
}

function itemOrigin(item: GearItem) {
  return [item.instance, item.boss, item.vendor, item.reputation, item.craftedBy, item.zone].filter(Boolean).join(' · ')
}

/** One item's column header — icon, name in its quality colour, where it comes from. */
function SideHeader({ side, glyph, label }: { side: ComparisonSide; glyph: string; label: string }) {
  const origin = itemOrigin(side.item)

  return (
    <div className="compare-side-header">
      <span className="compare-side-label">{label}</span>
      <div className="compare-side-item">
        <ItemIcon wowItemId={side.item.wowItemId} fallback={glyph} />
        <div>
          <h4 style={{ color: getQualityColor(side.item.quality) }}>{side.item.name}</h4>
          {side.isEquipped && <small className="compare-equipped-flag">Currently equipped</small>}
          {origin && <small className="compare-side-origin">{origin}</small>}
        </div>
      </div>
    </div>
  )
}

/**
 * Two items for one slot, side by side, with the stat difference and the change in the role's
 * headline number.
 *
 * **This is the question the upgrade finder cannot answer.** That list ranks everything which beats
 * what you already wear, so it cannot show a pair where one side is a downgrade, cannot compare two
 * items you do not own yet, and gives a single score where what you want is the stat line behind it.
 * Two things drop and you have one token: that is this panel.
 *
 * The score is shown only for the roles the Simulation tab is shown for, which is the same call
 * `featureFlags.ts` records and made for the same reason — a headline number a Healer or Tank would
 * read as authoritative, from a model this project does not aim at them. **The stat comparison is
 * shown to every role**, because those totals are the ones already on the rail beside this panel; it
 * is the simulated score, not the arithmetic, that the role rule is about.
 */
export function ComparePanel({
  character,
  gear,
  role,
  activeBuffIds,
  activeConsumableIds,
  activeTargetDebuffIds,
  target,
  talentPoints,
}: ComparePanelProps) {
  const context: ComparisonContext = useMemo(
    () => ({
      character,
      gear,
      role,
      activeBuffIds,
      activeConsumableIds,
      activeTargetDebuffIds,
      target,
      talentPoints,
    }),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints],
  )

  const slots = useMemo(() => comparableSlotsFor(character, gear), [character, gear])

  /*
   * The slot is held as a choice that can fall out of date rather than pinned to a valid one, because
   * changing spec changes which slots exist. `activeSlot` resolves it on every render instead of an
   * effect writing state back — an effect would render once with a slot this spec does not have.
   */
  const [chosenSlot, setChosenSlot] = useState<GearSlot | undefined>(undefined)
  const activeSlot = chosenSlot && slots.includes(chosenSlot) ? chosenSlot : slots[0]

  const options = useMemo(
    () => (activeSlot ? comparableItemsFor(context, activeSlot) : []),
    [context, activeSlot],
  )

  const [chosenLeftId, setChosenLeftId] = useState<string | undefined>(undefined)
  const [chosenRightId, setChosenRightId] = useState<string | undefined>(undefined)

  /*
   * Defaults land you on a real comparison rather than an empty frame. Arriving at a panel whose
   * entire subject is behind two pickers you have not touched is the same emptiness the raid
   * accordion had — see `defaultComparisonPair` for why the pair is not simply the first two options.
   */
  const defaults = useMemo(
    () => (activeSlot ? defaultComparisonPair(context, activeSlot) : { left: undefined, right: undefined }),
    [context, activeSlot],
  )
  const left = options.find((item) => item.id === chosenLeftId) ?? defaults.left
  const right = options.find((item) => item.id === chosenRightId) ?? defaults.right

  const comparison = useMemo(
    () => (activeSlot && left && right ? compareItems(context, activeSlot, left, right) : undefined),
    [context, activeSlot, left, right],
  )

  const showScore = isSimulationEnabled(role)
  const accent = getRoleAccentColor(role)

  if (!activeSlot || !comparison) {
    return (
      <Panel title="Gear Comparison" eyebrow="Two items, one slot" accentColor={accent} className="compare-panel-shell">
        <div className="simulation-empty" data-testid="compare-empty">
          No slot on this spec has two legal items to compare.
        </div>
      </Panel>
    )
  }

  const gemNames = (gemIds: readonly string[]) =>
    gemIds.filter(Boolean).map((gemId) => getGemById(gemId)?.name ?? gemId).join(' + ')

  /*
   * The two scores and their difference are all derived from the *same* rounded pair, for the reason
   * the stat table rounds before differencing: rounding each side independently and then showing the
   * exact delta prints "35.0 → 42.0, +7.1", three true numbers that visibly fail to add up. The
   * exact figures stay on the comparison for anything that needs them; what a reader can check with
   * their eyes has to be self-consistent.
   */
  const round1 = (value: number) => Math.round(value * 10) / 10
  const leftScore = round1(comparison.left.scoreExact)
  const rightScore = round1(comparison.right.scoreExact)
  const shownDelta = round1(rightScore - leftScore)
  const shownPercent = leftScore === 0 ? 0 : (shownDelta / leftScore) * 100

  return (
    <Panel title="Gear Comparison" eyebrow="Two items, one slot" accentColor={accent} className="compare-panel-shell">
      <p className="panel-copy">
        Two items for the same slot, each swapped into the set you are actually wearing — so set bonuses
        and socket bonuses count, which a tooltip-against-tooltip comparison cannot see. Both sides are
        scored the same way: the best colour-matched gems for this character, and the slot&apos;s current
        enchant wherever it stays legal. That makes this a comparison of the two <strong>items</strong>{' '}
        rather than of their current gemming, and it is why a pair here can read differently from the
        same pair in the Upgrade Finder, which scores what you own as-is against what you would chase.
      </p>

      <div className="compare-pickers">
        <label className="field">
          <span>Slot</span>
          <select
            aria-label="Comparison slot"
            value={activeSlot}
            onChange={(event) => {
              setChosenSlot(event.target.value as GearSlot)
              // The previous pair belongs to the previous slot; keeping either id would silently fall
              // through to a default and look like the picker ignored the change.
              setChosenLeftId(undefined)
              setChosenRightId(undefined)
            }}
          >
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {getGearSlotDisplayName(slot, character.className, character.spec)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Left</span>
          <select
            aria-label="Left item"
            value={left?.id ?? ''}
            onChange={(event) => setChosenLeftId(event.target.value)}
          >
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Right</span>
          <select
            aria-label="Right item"
            value={right?.id ?? ''}
            onChange={(event) => setChosenRightId(event.target.value)}
          >
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-heads" data-testid="compare-heads">
        <SideHeader side={comparison.left} glyph={slotGlyph(activeSlot)} label="Left" />
        <SideHeader side={comparison.right} glyph={slotGlyph(activeSlot)} label="Right" />
      </div>

      {showScore ? (
        <div className="compare-score" data-testid="compare-score">
          <span className="compare-score-metric">{comparison.metricLabel}</span>
          <div className="compare-score-values">
            <strong>{leftScore.toFixed(1)}</strong>
            <span aria-hidden="true">→</span>
            <strong>{rightScore.toFixed(1)}</strong>
          </div>
          <span
            className={`compare-score-delta ${shownDelta >= 0 ? 'compare-gain' : 'compare-loss'}`}
            data-testid="compare-score-delta"
          >
            {shownDelta >= 0 ? '+' : ''}
            {shownDelta.toFixed(1)} ({shownDelta >= 0 ? '+' : ''}
            {shownPercent.toFixed(1)}%)
          </span>
        </div>
      ) : (
        <p className="compare-score-hidden" data-testid="compare-score-hidden">
          The stat comparison below applies to every spec. The simulated score is shown for damage
          specs only — this project aims its estimate at DPS, and a Healer or Tank headline from a model
          not built for them would read more confidently than it deserves.
        </p>
      )}

      {comparison.assumesGemming && (
        <small className="compare-note" data-testid="compare-gem-note">
          Assumes {gemNames(comparison.left.gemIds) || 'no gems'} on the left and{' '}
          {gemNames(comparison.right.gemIds) || 'no gems'} on the right, so each score is what the item is
          worth <strong>once gemmed</strong>.
        </small>
      )}

      {comparison.dataQuality !== 'sourced' && (
        <small className={`compare-note compare-data-note-${comparison.dataQuality}`} data-testid="compare-data-note">
          {comparison.dataQuality === 'skewed'
            ? 'One of these carries estimated stats and the other is sourced, so this difference is overstated in a predictable direction.'
            : 'Both items carry estimated stats, so this difference is approximate.'}
        </small>
      )}

      {comparison.statRows.length === 0 ? (
        <div className="simulation-empty" data-testid="compare-no-difference">
          These two produce identical totals for every stat this app models. That is a real answer —
          take whichever you like — but it can also mean the difference between them is an effect the
          model does not express, so check the tooltips.
        </div>
      ) : (
        <table className="compare-table" data-testid="compare-table">
          <caption className="compare-table-caption">
            Character totals with each item equipped. Only the stats that differ are listed.
          </caption>
          <thead>
            <tr>
              <th scope="col">Stat</th>
              <th scope="col">Left</th>
              <th scope="col">Right</th>
              <th scope="col">Difference</th>
            </tr>
          </thead>
          <tbody>
            {comparison.statRows.map((row) => (
              <tr key={row.stat}>
                <th scope="row">{row.label}</th>
                <td>{row.left}</td>
                <td>{row.right}</td>
                <td className={row.delta >= 0 ? 'compare-gain' : 'compare-loss'}>
                  {row.delta >= 0 ? '+' : ''}
                  {row.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
