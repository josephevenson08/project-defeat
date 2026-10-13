import { useMemo } from 'react'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import { filledSlots } from '../../domain/raidcomp'
import { specTierLists } from '../../domain/tierlists'
import { allSpecs, sameSpec, type SpecRef } from '../../domain/tierlists/specStanding'
import type { CharacterProfile } from '../character/characterTypes'
import { loadRoster } from '../raidcomp/rosterStorage'
import { AgainstTheLogs } from './AgainstTheLogs'
import { TierBoard } from './TierBoard'
import { specName } from './tierFormat'

export type TierListsView = 'board' | 'logs'

type TierListsPanelProps = {
  /**
   * The character to mark on the lists, when there is one. Undefined until creation has actually been
   * run — highlighting the default Fury Warrior for someone who never chose it would be inventing an
   * answer to "where do I stand".
   */
  highlight?: CharacterProfile
  /** Which view is showing, kept by `App` so it survives a visit to another tab. */
  view: TierListsView
  onViewChange: (view: TierListsView) => void
  /** The spec whose card is open; your own spec until you press another. */
  selected?: SpecRef
  onSelect: (spec: SpecRef) => void
}

const placementCount = specTierLists.reduce(
  (total, list) => total + list.tiers.reduce((sum, tier) => sum + tier.placements.length, 0),
  0,
)

/**
 * Spec Tier Lists, as decided on 2026-10-12 (`docs/design/prototypes/tabs/tier-lists.html`): design A,
 * the tier board, with design B's chart of Wowhead's tiers against the logs behind a switch.
 *
 * **These rank specs, not items.** They cannot narrow a per-slot BiS list and are not wired into one;
 * the page says so before anything else, because a tier list is the first thing a new player mistakes
 * for gear advice.
 */
export function TierListsPanel({ highlight, view, onViewChange, selected, onSelect }: TierListsPanelProps) {
  const yours: SpecRef | undefined = highlight && { className: highlight.className, spec: highlight.spec }

  /*
   * The Raid Composition roster, when one is saved: the card says how many of a spec are in it. Read
   * once per visit, since nothing on this tab changes the roster. Without a roster the line is left
   * out rather than counted against an example raid nobody built.
   */
  const raidCount = useMemo(() => {
    const roster = loadRoster()
    const seats = roster ? filledSlots(roster) : []
    if (seats.length === 0) return undefined
    return (spec: SpecRef) => seats.filter((seat) => sameSpec(seat, spec)).length
  }, [])

  return (
    <>
      <section className="tier-hero" aria-labelledby="tier-hero-title">
        <p className="eyebrow">Spec Tier Lists · Phase 2 · the board and the logs</p>
        <h1 id="tier-hero-title">
          Where every spec stands in <em>Tier 5 raiding</em>.
        </h1>
        <p>
          Wowhead's three Phase 2 rankings as a board of spec icons: press any spec for its place on every list, what the logs say and
          what it brings to a raid. Switch to the logs to see Wowhead's tiers against what players actually parse.
        </p>
        <ul className="tier-hero-facts" aria-label="What is on this page">
          <li>
            <b>Lists</b>
            {specTierLists.length}
          </li>
          <li>
            <b>Placements</b>
            {placementCount}
          </li>
          <li>
            <b>Specs</b>
            {allSpecs.length}
          </li>
          {yours && (
            <li>
              <b>Your spec</b>
              {specName(yours)}
            </li>
          )}
        </ul>
        <p className="tier-note">
          <strong>These rank specs, not items.</strong> They say nothing about which helm to wear and are not what the planner's per-slot
          gear rankings are built from. Wowhead's reasoning for each placement is their own writing and is not reproduced here; follow
          the link under each list to read it.
        </p>
      </section>

      <div className="tier-view">
        <ViewSwitch
          label="Show"
          value={view}
          onChange={onViewChange}
          options={[
            { id: 'board', label: 'The board', hint: "Wowhead's three lists" },
            { id: 'logs', label: 'Against the logs', hint: 'what players parse' },
          ]}
        />
        {view === 'board' ? (
          <TierBoard yours={yours} selected={selected ?? yours} onSelect={onSelect} raidCount={raidCount} />
        ) : (
          <AgainstTheLogs yours={yours} raidCount={raidCount} />
        )}
      </div>
    </>
  )
}
