import { useEffect, useMemo, useRef, useState } from 'react'
import { FloatingTip } from '../../components/ui/FloatingTip'
import { ItemTooltip } from '../../components/ui/ItemTooltip'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import {
  exampleRaid,
  lootRankFor,
  raidersFrom,
  sampleRaids,
  whoWants,
  type Raid,
  type RaidBoss,
  type RaidLootEntry,
  type SpecRef,
} from '../../domain/raids'
import { loadRoster } from '../raidcomp/rosterStorage'
import { BossJournal, RankBadge } from './BossJournal'
import { ForMyRaid } from './ForMyRaid'
import { LootSearchResults } from './LootSearchResults'
import { listName, lootKey, raidLootTip, slotName } from './raidLootTip'
import { defaultJournalPage, type RaidsSession } from './raidsSession'

type RaidsPanelProps = {
  session: RaidsSession
  onSession: (next: RaidsSession) => void
  /** The character's spec, once one has been made: the journal ranks loot for it until you pick another. */
  yours?: SpecRef
  /** Goes to Raid Composition, where a raid is planned. */
  onPlanRaid: () => void
}

const PHASES = [...new Set(sampleRaids.map((raid) => raid.phase))].sort()

/**
 * Raids as decided on 2026-10-11 (`docs/design/prototypes/tabs/raids.html`), ported in step 2: the
 * raid picked from the page's own header, a search across the drops of all five raids, and two views
 * of the chosen raid behind a switch: design A's boss journal ("For me") and design C's "For my
 * raid". Every drop carries a game-style tooltip.
 *
 * It replaced a picker screen and a rail of raids: the five raids are one row of buttons now, and a
 * search reaches any drop without knowing which raid it is in.
 */
export function RaidsPanel({ session, onSession, yours, onPlanRaid }: RaidsPanelProps) {
  const raid = sampleRaids.find((candidate) => candidate.id === session.raidId) ?? sampleRaids[0]
  const lootFor = session.lootFor === 'all' ? undefined : (session.lootFor ?? yours)
  const tip = useHoverTip<RaidLootEntry>()
  const [query, setQuery] = useState('')
  // A drop to scroll to once the page holding it has rendered: a ref, bumped by a counter that re-runs the effect.
  const pendingJump = useRef<string | undefined>(undefined)
  const [jumpCount, setJumpCount] = useState(0)
  const jumpTo = (key: string) => {
    pendingJump.current = key
    setJumpCount((count) => count + 1)
  }
  const searchRef = useRef<HTMLInputElement>(null)
  const searching = query.trim().length >= 2

  // The roster saved on Raid Composition. Read once per visit: nothing on this tab changes it.
  const saved = useMemo(() => loadRoster(), [])
  const raidersFor = (target: Raid) =>
    raidersFrom(saved && saved.size === target.playerSize && saved.groups.some((group) => group.some(Boolean)) ? saved : exampleRaid(target.playerSize))

  /*
   * A drop opened from a search or a shortcut: once the page holding it has rendered, it is scrolled
   * into view, opened if it sits in a folded list, focused and briefly marked.
   */
  useEffect(() => {
    const key = pendingJump.current
    if (!key) return
    pendingJump.current = undefined
    const target = document.querySelector<HTMLElement>(`[data-loot="${CSS.escape(key)}"]`)
    if (!target) return
    const folded = target.closest('details')
    if (folded) folded.open = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    target.classList.remove('loot-flash')
    void target.offsetWidth
    target.classList.add('loot-flash')
    const focusable = target.matches('button') ? target : target.querySelector('button')
    focusable?.focus({ preventScroll: true })
  }, [jumpCount])

  // "/" jumps to the search, as on most loot sites, unless you are already typing somewhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return
      const where = event.target as HTMLElement | null
      if (where && (where.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(where.tagName))) return
      event.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function update(patch: Partial<RaidsSession>) {
    tip.hide()
    onSession({ ...session, ...patch })
  }

  function openDrop(entry: RaidLootEntry, where: Raid, boss: RaidBoss | undefined) {
    setQuery('')
    update({
      raidId: where.id,
      pages: session.view === 'me' ? { ...session.pages, [where.id]: boss?.id ?? 'trash' } : session.pages,
    })
    jumpTo(lootKey(entry))
  }

  const annotate = (entry: RaidLootEntry, where: Raid) => {
    if (session.view === 'raid') {
      const count = whoWants(entry, raidersFor(where)).length
      return count ? <span className="loot-search-note">{count === 1 ? '1 raider wants it' : `${count} raiders want it`}</span> : null
    }
    const rank = lootFor ? lootRankFor(entry, lootFor) : undefined
    return rank && lootFor ? <RankBadge rank={rank.rank} list={listName(lootFor)} slot={slotName(rank.slot) ?? ''} /> : null
  }

  return (
    <>
      <section className="raids-hero" aria-labelledby="raids-title">
        <p className="eyebrow">Raids · the boss journal and your raid's loot</p>
        <h1 id="raids-title">
          Every boss, <em>every drop</em>, and who wants it.
        </h1>
        <p>
          Pick a raid, then a boss: its loot as the game shows it, with your spec's picks marked from Wowhead's Phase 2 lists. Switch to your
          raid to see who in it wants each drop, and which drops will be contested.
        </p>
        <div className="raid-pick" role="group" aria-label="Choose a raid">
          {PHASES.map((phase) => (
            <fieldset key={phase}>
              <legend>Phase {phase}</legend>
              {sampleRaids
                .filter((candidate) => candidate.phase === phase)
                .map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    aria-pressed={candidate.id === raid.id}
                    onClick={() => {
                      setQuery('')
                      update({ raidId: candidate.id })
                    }}
                    data-testid={`raid-pick-${candidate.id}`}
                  >
                    {candidate.name}
                    <small>{candidate.playerSize}</small>
                  </button>
                ))}
            </fieldset>
          ))}
        </div>
        <div className="loot-search-box" role="search">
          <label htmlFor="loot-search">Search loot</label>
          <div className="loot-search-field">
            <input
              ref={searchRef}
              id="loot-search"
              type="search"
              value={query}
              placeholder="Dragonspine Trophy, Destroyer, Mongoose…"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="loot-search-hint"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault()
                  setQuery('')
                }
              }}
              data-testid="loot-search"
            />
            {query && (
              <button type="button" className="loot-search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </div>
          <span className="loot-search-hint" id="loot-search-hint">
            Searches the drops of all five raids · press / to jump here, Esc to clear
          </span>
        </div>
      </section>

      <div className="raids-view">
        {searching ? (
          <LootSearchResults
            query={query}
            selectedRaidId={raid.id}
            annotate={annotate}
            onOpen={openDrop}
            onClear={() => {
              setQuery('')
              searchRef.current?.focus()
            }}
            bindTip={tip.bind}
          />
        ) : (
          <>
            <ViewSwitch
              label="Show the loot"
              value={session.view}
              onChange={(view) => update({ view })}
              options={[
                { id: 'me', label: 'For me', hint: 'boss by boss' },
                { id: 'raid', label: 'For my raid', hint: 'who wants what' },
              ]}
            />
            {session.view === 'me' ? (
              <BossJournal
                key={raid.id}
                raid={raid}
                page={session.pages[raid.id] ?? defaultJournalPage(raid)}
                onPage={(page) => update({ pages: { ...session.pages, [raid.id]: page } })}
                lootFor={lootFor}
                onLootFor={(value) => update({ lootFor: value })}
                bindTip={tip.bind}
              />
            ) : (
              <ForMyRaid key={raid.id} raid={raid} saved={saved} onPlanRaid={onPlanRaid} onJump={jumpTo} bindTip={tip.bind} />
            )}
          </>
        )}
      </div>

      {tip.target && (
        <FloatingTip anchor={tip.target.anchor} placement="beside" className="item-tip-box" testId="item-tip">
          <ItemTooltip tip={raidLootTip(tip.target.data, lootFor)} />
        </FloatingTip>
      )}
    </>
  )
}
