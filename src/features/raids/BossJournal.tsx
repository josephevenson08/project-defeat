import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { SpecIcon } from '../../components/ui/SpecIcon'
import {
  getAttunementChainForRaid,
  getBossesForRaid,
  listKey,
  lootItem,
  lootKindLabel,
  lootRankFor,
  lootSources,
  sortLoot,
  wowheadLists,
  type Raid,
  type RaidBoss,
  type RaidLootEntry,
  type SpecRef,
} from '../../domain/raids'
import { hasBossArt } from '../../domain/raids/bossArt'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { describeStats } from '../../domain/stats/describeStats'
import { LootIcon } from './LootIcon'
import { RaidAbout } from './RaidAbout'
import { listName, lootKey, slotName, type LootTipBinder } from './raidLootTip'
import { defaultJournalPage, journalPages, type JournalPage } from './raidsSession'
import { cue } from '../../lib/motion'

type BossJournalProps = {
  raid: Raid
  page: JournalPage
  onPage: (page: JournalPage) => void
  /** The spec the loot is ranked for; undefined shows every drop unranked. */
  lootFor?: SpecRef
  onLootFor: (value: SpecRef | 'all') => void
  bindTip: LootTipBinder
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/**
 * Design A, the boss journal (decided 2026-10-11): one boss at a time, the way the game's Adventure
 * Guide reads. The raid's bosses down the side with the owner's art where there is some; the chosen
 * boss's loot as icons with game tooltips, and "Loot for" any spec, which puts that spec's picks
 * first with their rank on its Wowhead Phase 2 list. "About the raid" holds the facts and the way in.
 */
export function BossJournal({ raid, page, onPage, lootFor, onLootFor, bindTip }: BossJournalProps) {
  const [tab, setTab] = useState<'loot' | 'fight'>('loot')
  const bosses = getBossesForRaid(raid.id)
  const pages = journalPages(raid)
  const current = pages.includes(page) ? page : defaultJournalPage(raid)
  const index = pages.indexOf(current)
  const boss = bosses.find((candidate) => candidate.id === current)
  const chain = getAttunementChainForRaid(raid.id)
  const onList = (entries: readonly RaidLootEntry[]) => (lootFor ? entries.filter((entry) => lootRankFor(entry, lootFor)).length : 0)
  const shortSpec = lootFor?.spec
  const railRef = useRef<HTMLUListElement>(null)

  /*
   * On a phone the bosses are one row you swipe along, so the open one has to be in view in that row
   * — by moving the row, not the page, which would jump the reader away from the boss they opened.
   */
  useEffect(() => {
    const list = railRef.current
    const open = list?.querySelector<HTMLElement>('button[aria-current="true"]')
    if (!list || !open || list.scrollWidth <= list.clientWidth) return
    const row = list.getBoundingClientRect()
    const box = open.getBoundingClientRect()
    if (box.left < row.left || box.right > row.right) list.scrollLeft += box.left - row.left - 12
  }, [current])

  /*
   * Another boss's or raid's page rises into place (port step 7's motion layer). Not the first one: the
   * tab's own entrance covers that, and the rise's long, slow tail would still be moving it when a
   * reader, or a test measuring a control, gets there.
   */
  const shownPage = useRef(`${raid.id}/${current}`)
  useEffect(() => {
    const key = `${raid.id}/${current}`
    if (shownPage.current !== key) cue({ kind: 'rise', target: '.journal-page' })
    shownPage.current = key
  }, [raid.id, current])

  function go(next: JournalPage) {
    onPage(next)
  }

  /* Arrow keys move through the boss list, as they would through the game's. */
  function onRailKey(event: KeyboardEvent<HTMLUListElement>) {
    const step = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, number>)[event.key]
    const current = (event.target as HTMLElement).closest('button')
    if (!step || !current) return
    const buttons = [...event.currentTarget.querySelectorAll('button')]
    const next = buttons[buttons.indexOf(current) + step]
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }

  const railRow = (id: JournalPage, portrait: ReactNode, name: ReactNode, meta: ReactNode) => (
    <li key={id}>
      <button type="button" aria-current={id === current} onClick={() => go(id)} data-testid={`journal-page-${id}`}>
        {portrait}
        <span className="journal-rail-text">
          <b>{name}</b>
          <small>{meta}</small>
        </span>
      </button>
    </li>
  )

  const forSpec = (entries: readonly RaidLootEntry[]) =>
    lootFor ? (
      <>
        {' '}
        · <em>{onList(entries)} for {shortSpec}</em>
      </>
    ) : null

  let banner: { art: string; withArt: boolean; number: string; title: string; line: string }
  if (current === 'about') {
    banner = {
      art: asset(`raids/${raid.id}.jpg`),
      withArt: false,
      number: `${raid.tier} · ${raid.playerSize} players`,
      title: `About ${raid.name}`,
      line: `${plural(bosses.length, 'boss', 'bosses')} · ${plural(lootSources(raid).reduce((n, s) => n + s.entries.length, 0), 'drop')} · ${chain ? `attunement: ${chain.name}` : 'no attunement'}`,
    }
  } else if (current === 'trash' || !boss) {
    banner = {
      art: asset(`raids/${raid.id}.jpg`),
      withArt: false,
      number: raid.name,
      title: 'Notable trash',
      line: `${plural(raid.notableTrashLoot?.length ?? 0, 'drop')} from trash, not a boss`,
    }
  } else {
    const ordered = bosses.filter((candidate) => !candidate.optional)
    banner = {
      art: hasBossArt(boss.id) ? asset(`raids/bosses/${boss.id}.jpg`) : asset(`raids/${raid.id}.jpg`),
      withArt: hasBossArt(boss.id),
      number: boss.optional ? 'Optional boss' : `Boss ${boss.encounterOrder ?? ordered.indexOf(boss) + 1} of ${ordered.length}`,
      title: boss.name,
      line: `${plural(boss.loot.length, 'drop')}${lootFor ? ` · ${onList(boss.loot)} on the ${listName(lootFor)} list` : ''}`,
    }
  }

  return (
    <div className="journal">
      <nav className="panel journal-rail" aria-label={`${raid.name}: bosses`}>
        <div className="journal-rail-raid">
          <img src={asset(`raids/${raid.id}.jpg`)} alt="" width={64} height={40} loading="lazy" />
          <span>
            <b>{raid.name}</b>
            <small>
              {raid.tier} · {raid.playerSize} players · Phase {raid.phase}
            </small>
          </span>
        </div>
        <ul className="journal-rail-list" onKeyDown={onRailKey} ref={railRef}>
          {railRow(
            'about',
            <span className="journal-portrait journal-portrait-info" aria-hidden="true">
              i
            </span>,
            'About the raid',
            chain ? `Getting in · ${chain.name}` : 'Getting in · no attunement',
          )}
          {bosses.map((candidate, order) =>
            railRow(
              candidate.id,
              <BossPortrait boss={candidate} order={order} />,
              <>
                {candidate.name}
                {candidate.optional && <span className="journal-optional">Optional</span>}
              </>,
              <>
                {plural(candidate.loot.length, 'drop')}
                {forSpec(candidate.loot)}
              </>,
            ),
          )}
          {raid.notableTrashLoot?.length
            ? railRow(
                'trash',
                <span className="journal-portrait" aria-hidden="true">
                  ✦
                </span>,
                'Notable trash',
                <>
                  {plural(raid.notableTrashLoot.length, 'drop')}
                  {forSpec(raid.notableTrashLoot)}
                </>,
              )
            : null}
        </ul>
      </nav>

      <section className="panel journal-page" aria-labelledby="journal-title" data-testid="journal-page">
        <div
          className={`journal-banner${banner.withArt ? '' : ' journal-banner-plain'}`}
          style={{ '--journal-art': `url(${banner.art})` } as CSSProperties}
        >
          <div className="journal-banner-text">
            <span className="journal-number">{banner.number}</span>
            <h2 id="journal-title">{banner.title}</h2>
            <p>{banner.line}</p>
          </div>
          <div className="journal-step">
            <button type="button" aria-label="Previous" disabled={index <= 0} onClick={() => go(pages[index - 1])}>
              ←
            </button>
            <button type="button" aria-label="Next" disabled={index >= pages.length - 1} onClick={() => go(pages[index + 1])}>
              →
            </button>
          </div>
        </div>

        {boss && (
          <div className="journal-tabs" role="tablist" aria-label={boss.name}>
            {(['loot', 'fight'] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`journal-tab-${id}`}
                aria-controls="journal-body"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {id === 'loot' ? 'Loot' : 'The fight'}
              </button>
            ))}
          </div>
        )}

        <div
          className="journal-body"
          id="journal-body"
          role={boss ? 'tabpanel' : undefined}
          aria-labelledby={boss ? `journal-tab-${tab}` : undefined}
        >
          {current === 'about' ? (
            <RaidAbout raid={raid} />
          ) : boss && tab === 'fight' ? (
            <BossFight boss={boss} />
          ) : (
            <JournalLoot
              entries={boss ? boss.loot : (raid.notableTrashLoot ?? [])}
              fromTrash={!boss}
              lootFor={lootFor}
              onLootFor={onLootFor}
              bindTip={bindTip}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function BossPortrait({ boss, order }: { boss: RaidBoss; order: number }) {
  if (hasBossArt(boss.id)) {
    return (
      <span
        className="journal-portrait"
        style={{ backgroundImage: `url(${asset(`raids/bosses/${boss.id}.jpg`)})` }}
        aria-hidden="true"
      />
    )
  }
  return (
    <span className="journal-portrait" aria-hidden="true">
      {boss.optional ? '·' : String(boss.encounterOrder ?? order + 1).padStart(2, '0')}
    </span>
  )
}

function BossFight({ boss }: { boss: RaidBoss }) {
  return (
    <div className="journal-fight">
      <p>{boss.mechanics}</p>
      {boss.roleNotes && boss.roleNotes.length > 0 && (
        <ul className="journal-roles">
          {boss.roleNotes.map((note) => (
            <li key={note.role}>
              <b>{note.role}</b> {note.note}
            </li>
          ))}
        </ul>
      )}
      {boss.needsVerification && (
        <p className="journal-verify">
          <strong>Needs checking.</strong> {boss.notes}
        </p>
      )}
    </div>
  )
}

const byClass = [...new Set(wowheadLists.map((list) => list.className))].sort().map((className) => ({
  className,
  lists: wowheadLists.filter((list) => list.className === className),
}))

/** The list each drop sits on, and how much else is there: the journal's loot tab. */
function JournalLoot({
  entries,
  fromTrash,
  lootFor,
  onLootFor,
  bindTip,
}: {
  entries: readonly RaidLootEntry[]
  fromTrash: boolean
  lootFor?: SpecRef
  onLootFor: (value: SpecRef | 'all') => void
  bindTip: LootTipBinder
}) {
  const sorted = sortLoot(entries)
  const mine = lootFor
    ? sorted.filter((entry) => lootRankFor(entry, lootFor)).sort((a, b) => lootRankFor(a, lootFor)!.rank - lootRankFor(b, lootFor)!.rank)
    : []
  const rest = sorted.filter((entry) => !mine.includes(entry))
  const who = lootFor ? listName(lootFor) : ''

  return (
    <>
      <div className="journal-filter">
        <label>
          Loot for{' '}
          <select
            value={lootFor ? listKey(lootFor) : 'all'}
            onChange={(event) => {
              const list = wowheadLists.find((candidate) => candidate.key === event.target.value)
              onLootFor(list ? { className: list.className, spec: list.spec } : 'all')
            }}
            data-testid="loot-for"
          >
            <option value="all">Every spec</option>
            {byClass.map((group) => (
              <optgroup key={group.className} label={group.className}>
                {group.lists.map((list) => (
                  <option key={list.key} value={list.key}>
                    {list.spec} {list.className}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="journal-count">
          {lootFor ? (
            <>
              <SpecIcon className={lootFor.className} spec={lootFor.spec} size={22} />
              {mine.length
                ? `${plural(mine.length, 'drop')} here ${mine.length === 1 ? 'is' : 'are'} on the ${who} list`
                : `Nothing here is on the ${who} list`}
            </>
          ) : (
            `${plural(sorted.length, 'drop')}, tokens first`
          )}
        </span>
      </div>

      {!lootFor ? (
        <LootList entries={sorted} bindTip={bindTip} />
      ) : (
        <>
          {mine.length ? (
            <>
              <h3 className="journal-subhead">On Wowhead's {who} list, best first</h3>
              <LootList entries={mine} lootFor={lootFor} bindTip={bindTip} />
            </>
          ) : (
            <p className="journal-empty">
              No drop from {fromTrash ? "this raid's notable trash" : 'this boss'} is on Wowhead's Phase 2 {who} list. Pick another spec,
              or see everything below.
            </p>
          )}
          {rest.length > 0 && (
            <details className="journal-more" open={mine.length === 0 || undefined}>
              <summary>{plural(rest.length, 'other drop')}</summary>
              <LootList entries={rest} lootFor={lootFor} bindTip={bindTip} />
            </details>
          )}
        </>
      )}
    </>
  )
}

function LootList({ entries, lootFor, bindTip }: { entries: readonly RaidLootEntry[]; lootFor?: SpecRef; bindTip: LootTipBinder }) {
  return (
    <ul className="journal-loot">
      {entries.map((entry) => {
        const item = lootItem(entry)
        const rank = lootFor ? lootRankFor(entry, lootFor) : undefined
        const meta = [
          slotName(item?.slot),
          item?.weaponType ? [item.handType, item.weaponType].filter(Boolean).join(' ') : item?.armorType,
          item?.itemLevel ? `ilvl ${item.itemLevel}` : '',
          lootKindLabel(entry),
        ]
          .filter(Boolean)
          .join(' · ')
        const stats = describeStats(item?.stats)
        return (
          <li key={`${entry.name}-${entry.itemId ?? ''}`}>
            <button type="button" className="journal-item" data-loot={lootKey(entry)} {...bindTip(entry)}>
              <LootIcon entry={entry} size={40} />
              <span className="journal-item-text">
                <b style={{ color: item ? getQualityColor(item.quality) : undefined }}>{entry.name}</b>
                <small>{meta || 'Not in the item catalogue'}</small>
                {stats && <span className="journal-item-stats">{stats}</span>}
              </span>
              {rank && lootFor && <RankBadge rank={rank.rank} list={listName(lootFor)} slot={slotName(rank.slot) ?? ''} />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function RankBadge({ rank, list, slot }: { rank: number; list: string; slot: string }) {
  return (
    <span className={`loot-rank${rank === 1 ? ' loot-rank-first' : ''}`} title={`Rank ${rank} on Wowhead's ${list} list (${slot})`}>
      #{rank}
      <span className="visually-hidden"> on the {list} list</span>
    </span>
  )
}
