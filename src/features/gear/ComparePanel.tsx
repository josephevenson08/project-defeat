import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Panel } from '../../components/layout/Panel'
import { ItemTooltip } from '../../components/ui/ItemTooltip'
import { whereFrom, whereText, wornItem } from '../../domain/bis'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById } from '../../domain/gems/sampleGems'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import { relevantStats } from '../../domain/stats/statRelevance'
import type { TalentPoints } from '../../domain/talents/talentTypes'
import { isSimulationEnabled } from '../../featureFlags'
import type { CharacterProfile } from '../character/characterTypes'
import {
  comparableItemsFor,
  comparableSlotsFor,
  compareCandidates,
  compareItems,
  defaultCompareItem,
  type ComparisonContext,
  type ComparisonSide,
  type ComparisonStatRow,
} from './compareItems'
import type { CompareSession } from './compareSession'
import { fittedItemTip } from './fittedItemTip'
import { getGearSlotDisplayName } from './gearData'
import type { EquippedGear, EquippedSlot, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { SlotStrip } from './SlotStrip'
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
  session: CompareSession
  onSession: (session: CompareSession) => void
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

/** "+6 Crit Rating" reads "+6 Crit" in a sentence, as the prototype's summary has it. */
const statWord = (row: ComparisonStatRow) => `${row.delta > 0 ? '+' : '−'}${Math.abs(row.delta)} ${row.label.replace(/ Rating$/, '')}`

/** The other side as its tooltip, fitted out with what its score assumes and Equip applies. */
const sideTip = (side: ComparisonSide, entryWhere: string) =>
  fittedItemTip(side.item, { item: side.item, gemIds: [...side.gemIds], enchantId: side.enchantId }, entryWhere)

/**
 * Compare (port step 6): what you wear against another item for the same slot, the way the game
 * shows it when you hover with Shift (design A's side-by-side tooltips), with design B's summary of
 * the trade in one sentence. Pick the slot from your gear and the other item from Wowhead's list for
 * it, or any item the slot takes.
 *
 * **The score is the app's own simulator, not the prototype's example weights.** Each side is swapped
 * into the set you are wearing (`compareItems`), so set and socket bonuses count, and both are gemmed
 * the same way. It is shown for the roles the Simulation tab is shown for, the call `featureFlags.ts`
 * records; the stat changes are for every role, since those totals are the ones on the stat bar.
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
  session,
  onSession,
  onEquip,
}: ComparePanelProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const context: ComparisonContext = useMemo(
    () => ({ character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints }),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints],
  )

  /*
   * The slot is held as a choice that can fall out of date rather than pinned to a valid one, because
   * changing spec changes which slots exist, and a two-hander closes the off hand. It is resolved on
   * every render instead of an effect writing state back.
   */
  const slots = useMemo(() => comparableSlotsFor(character, gear), [character, gear])
  const slot = slots.includes(session.slot) ? session.slot : slots[0]
  const candidates = useMemo(() => (slot ? compareCandidates(context, slot) : []), [context, slot])
  const worn = slot ? wornItem(gear, slot) : undefined
  // Any item the slot takes, best item level first: the old panel's pickers walked the whole catalogue in its own order.
  const anyItems = useMemo(
    () =>
      slot
        ? comparableItemsFor(context, slot)
            .filter((item) => item.id !== worn?.id)
            .sort((a, b) => (b.itemLevel ?? 0) - (a.itemLevel ?? 0) || a.name.localeCompare(b.name))
        : [],
    [context, slot, worn],
  )
  const picked =
    session.otherId && session.otherId !== worn?.id
      ? (candidates.find((candidate) => candidate.item.id === session.otherId)?.item ?? anyItems.find((item) => item.id === session.otherId))
      : undefined
  const other = picked ?? (slot ? defaultCompareItem(context, slot, candidates) : undefined)
  const otherEntry = candidates.find((candidate) => candidate.item.id === other?.id)?.entry

  const comparison = useMemo(
    () => (slot && other ? compareItems(context, slot, gear[slot].item, other) : undefined),
    [context, slot, gear, other],
  )

  const accent = getRoleAccentColor(role)
  const title = 'Compare with what you wear'

  if (!slot || !other || !comparison) {
    return (
      <Panel title={title} eyebrow="Gear comparison" accentColor={accent} className="compare-panel-shell">
        <div className="simulation-empty" data-testid="compare-empty">
          No slot on this spec has an item to compare.
        </div>
      </Panel>
    )
  }

  const display = (key: GearSlot) => getGearSlotDisplayName(key, character.className, character.spec)
  const showScore = isSimulationEnabled(role)
  const rows = comparison.statRows
  const relevant = new Set(relevantStats(rows.map((row) => row.stat), role, character.className, character.spec))
  const sentenceRows = rows.filter((row) => relevant.has(row.stat))
  // In the stat sheet's order: points of different stats are not worth the same, so sorting by size would mislead.
  const gains = sentenceRows.filter((row) => row.delta > 0)
  const losses = sentenceRows.filter((row) => row.delta < 0)

  /*
   * The two scores and their difference all come from the *same* rounded pair: rounding each side on
   * its own and showing the exact delta prints "35.0 → 42.0, +7.1", three true numbers that visibly
   * fail to add up.
   */
  const round1 = (value: number) => Math.round(value * 10) / 10
  const leftScore = round1(comparison.left.scoreExact)
  const rightScore = round1(comparison.right.scoreExact)
  const shownDelta = round1(rightScore - leftScore)
  const shownPercent = leftScore === 0 ? 0 : (shownDelta / leftScore) * 100
  const signed = (value: number, digits: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`

  const gemNames = (gemIds: readonly string[]) =>
    gemIds
      .filter(Boolean)
      .map((gemId) => getGemById(gemId)?.name ?? gemId)
      .join(' + ')

  const equip = () => {
    onEquip(slot, { item: other, gemIds: [...comparison.right.gemIds], enchantId: comparison.right.enchantId })
    setMessage(`${display(slot)}: equipped ${other.name}. The Gear tab shows it too.`)
    onSession({ slot })
    stripRef.current?.querySelector<HTMLButtonElement>(`[data-slot="${slot}"]`)?.focus()
  }

  return (
    <Panel title={title} eyebrow="Gear comparison" accentColor={accent} className="compare-panel-shell">
      <p className="compare-lead">
        Hold your item against another for the same slot, as the game does when you hover with Shift. Each is swapped into the set you
        wear, so set and socket bonuses count, and both sides are scored the same way: the best colour-matched gems for you and the
        slot&apos;s current enchant where it stays legal. That compares the items rather than their gemming, which is why a pair here can
        read differently from the upgrade finder on the Simulation tab, which scores what you own as it is.
      </p>

      <SlotStrip
        character={character}
        gear={gear}
        slots={slots}
        selected={slot}
        onSelect={(next) => {
          setMessage('')
          onSession({ slot: next })
        }}
        label="Slot to compare"
        testIdPrefix="compare-slot"
        ref={stripRef}
      />

      <div className="compare-pick" role="group" aria-label={`${display(slot)} items`}>
        <span className="compare-pick-label">Compare with</span>
        {candidates.map(({ item, entry }) => {
          const isWorn = item.id === worn?.id
          return (
            <button
              key={item.id}
              type="button"
              className="compare-alt"
              aria-pressed={item.id === other.id}
              disabled={isWorn}
              aria-label={`${entry ? `Rank ${entry.rank}: ` : ''}${item.name}${isWorn ? ', what you wear' : ''}`}
              title={item.name}
              style={{ '--q': getQualityColor(item.quality) } as CSSProperties}
              data-testid={`compare-with-${item.id}`}
              onClick={() => onSession({ slot, otherId: item.id })}
            >
              <ItemIcon wowItemId={item.wowItemId} fallback={slotGlyph(slot)} />
              {entry && (
                <span className="compare-alt-rank" aria-hidden="true">
                  {entry.rank}
                </span>
              )}
              {isWorn && (
                <span className="compare-alt-worn" aria-hidden="true">
                  worn
                </span>
              )}
            </button>
          )
        })}
        <label className="compare-any">
          <span>{candidates.length ? 'Or any item for this slot' : 'Any item for this slot'}</span>
          <select
            aria-label="Any item for this slot"
            value={picked && !otherEntry ? other.id : ''}
            onChange={(event) => onSession({ slot, otherId: event.target.value || undefined })}
            data-testid="compare-any"
          >
            <option value="">Choose an item…</option>
            {anyItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.itemLevel ? ` (${item.itemLevel})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="compare-summary" data-testid="compare-summary">
        {gains.length ? (
          <>
            You gain <strong className="compare-gain">{gains.map(statWord).join(', ')}</strong>
          </>
        ) : (
          'You gain nothing'
        )}
        {losses.length > 0 && (
          <>
            {' '}
            and lose <strong className="compare-loss">{losses.map(statWord).join(', ')}</strong>
          </>
        )}
        .{' '}
        {showScore && (
          <span className="compare-score" data-testid="compare-score">
            <span className="compare-score-metric">{comparison.metricLabel}</span>{' '}
            <span className="compare-score-values">
              <strong>{leftScore.toFixed(1)}</strong> <span aria-hidden="true">→</span> <strong>{rightScore.toFixed(1)}</strong>
            </span>
            :{' '}
            <strong className={shownDelta >= 0 ? 'compare-gain' : 'compare-loss'} data-testid="compare-score-delta">
              {signed(shownDelta, 1)} ({signed(shownPercent, 1)}%)
            </strong>
          </span>
        )}
      </p>
      {!showScore && (
        <p className="compare-score-hidden" data-testid="compare-score-hidden">
          The stat changes apply to every spec. The simulated score is shown for damage specs only — this project aims its estimate at
          DPS, and a Healer or Tank headline from a model not built for them would read more confidently than it deserves.
        </p>
      )}

      <div className="compare-tips">
        <div className="compare-tip" data-testid="compare-yours">
          <p className="compare-tip-head">Currently equipped</p>
          {worn ? (
            // As you wear it: the score may assume other gems, which the note under the tooltips names.
            <ItemTooltip tip={fittedItemTip(worn, gear[slot], whereText(whereFrom(candidates.find((c) => c.item.id === worn.id)?.entry, worn)))} />
          ) : (
            <span className="item-tip">
              <b className="item-tip-name">Nothing in this slot</b>
            </span>
          )}
        </div>
        <div className="compare-tip" data-testid="compare-other">
          <p className="compare-tip-head">{otherEntry ? `Rank ${otherEntry.rank}${otherEntry.label ? ` · ${otherEntry.label}` : ''}` : "Not on Wowhead's list"}</p>
          <ItemTooltip tip={sideTip(comparison.right, whereText(whereFrom(otherEntry, other)))} />
          <div className="compare-changes" data-testid="compare-changes">
            <b>If you replace your item, these stats change:</b>
            {rows.length ? (
              rows.map((row) => (
                <span key={row.stat} className={row.delta > 0 ? 'compare-gain' : 'compare-loss'}>
                  {row.delta > 0 ? '+' : '−'}
                  {Math.abs(row.delta)} {row.label}
                </span>
              ))
            ) : (
              <span className="compare-same" data-testid="compare-no-difference">
                No stat this app models changes. Take whichever you like, but check the tooltips: the difference may be an effect the model
                does not express.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="compare-act">
        <button type="button" className="compare-equip" onClick={equip} data-testid="compare-equip">
          Equip {other.name}
        </button>
        <span className="compare-msg" role="status" data-testid="compare-message">
          {message}
        </span>
      </div>

      {comparison.assumesGemming && (
        <small className="compare-note" data-testid="compare-gem-note">
          Scored with {gemNames(comparison.left.gemIds) || 'no gems'} in yours and {gemNames(comparison.right.gemIds) || 'no gems'} in the
          other, the best gem of each socket colour for you, so each is what the item is worth <strong>once gemmed</strong>, whatever
          yours holds now. Equip puts the other on with exactly those.
        </small>
      )}
      {comparison.dataQuality !== 'sourced' && (
        <small className={`compare-note compare-data-note-${comparison.dataQuality}`} data-testid="compare-data-note">
          {comparison.dataQuality === 'skewed'
            ? 'One of these carries estimated stats and the other is sourced, so this difference is overstated in a predictable direction.'
            : 'Both items carry estimated stats, so this difference is approximate.'}
        </small>
      )}

      {rows.length > 0 && (
        <details className="compare-totals" data-testid="compare-totals">
          <summary>Your totals with each, stat by stat</summary>
          <table className="compare-table" data-testid="compare-table">
            <caption className="compare-table-caption">Character totals with each item equipped. Only the stats that differ are listed.</caption>
            <thead>
              <tr>
                <th scope="col">Stat</th>
                <th scope="col">With yours</th>
                <th scope="col">With this one</th>
                <th scope="col">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
        </details>
      )}
    </Panel>
  )
}
