import { useState, type CSSProperties, type ReactNode } from 'react'
import { Panel } from '../../components/layout/Panel'
import { getAttunementChainForRaid, getBossesForRaid, sampleRaids, type RaidLootEntry } from '../../domain/raids'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getItemById } from '../gear/gearData'
import { RaidAttunementChain } from './RaidAttunementChain'
import { RaidLootList } from './RaidLootList'

type RaidsPanelView = 'loot' | 'attunement'

type RaidsPanelProps = {
  raidId: string
}

/** Catalog-backed loot renders in its item quality colour; uncatalogued drops fall back to plain text. */
function lootNameColor(entry: RaidLootEntry) {
  const item = entry.itemId ? getItemById(entry.itemId) : undefined
  return item ? getQualityColor(item.quality) : undefined
}

/**
 * One encounter: a card you can see, and its loot table behind a click on it.
 *
 * The card and the table are **siblings rather than parent and child**, and that is what makes the
 * layout work. The cards sit two to a row at a width the artwork can fill; a table nested inside one
 * would be squeezed into half a page. As a sibling spanning every column it gets the full width the
 * loot rows were built for, and `grid-auto-flow: dense` on the container pulls the next card up into
 * the gap so the row above never breaks.
 *
 * `art` is optional: a boss with no picture keeps its card and simply has no background, the same way
 * the raid picker handles a missing raid panel.
 */
function BossCard({
  id,
  name,
  art,
  dropCount,
  open,
  onToggle,
  children,
}: {
  id: string
  name: string
  art?: string
  dropCount: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panelId = `boss-loot-${id}`

  return (
    <>
      <button
        type="button"
        className="raid-boss-card"
        data-open={open || undefined}
        style={art ? ({ '--boss-art': `url(${art})` } as CSSProperties) : undefined}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid={`boss-card-${id}`}
      >
        <span className="raid-boss-card-plate">
          <span className="raid-boss-card-name">{name}</span>
          {/* Computed, never written, so it cannot drift from the loot data. */}
          <span className="raid-boss-card-count">
            {dropCount} {dropCount === 1 ? 'drop' : 'drops'}
          </span>
          {/* Named as well as drawn — a chevron alone is colour-and-shape only. */}
          <span className="raid-boss-card-cue">{open ? 'Hide loot' : 'See the loot'}</span>
        </span>
      </button>

      {open && (
        <div className="raid-boss-drop" id={panelId} role="region" aria-label={`${name} loot`} data-testid={`boss-loot-${id}`}>
          {children}
        </div>
      )}
    </>
  )
}

/**
 * One raid's loot, encounter by encounter.
 *
 * Deliberately **not** a fight guide. Mechanics and per-role callouts were removed: this page answers
 * "what drops here", and a boss's abilities are a different question asked at a different time —
 * usually while looking at something other than a planner.
 *
 * **A card per boss, with the loot behind a click.** This reverses an earlier decision and the reason
 * it is right now and was wrong then is worth stating. The accordion this restores was removed
 * because a page of collapsed bars showed nothing on arrival — the one thing the tab is for sat
 * behind a click, under a row of identical grey headers that told you nothing about which to press.
 * With artwork on the cards the closed page is no longer empty: you arrive at Karazhan and see
 * Attumen, Moroes, the Curator. The fold now costs a click to reach a loot table rather than costing
 * you the whole page.
 *
 * Encounters with no artwork keep their card and simply have no picture, so Serpentshrine and Tempest
 * Keep read as unfinished rather than broken.
 */
export function RaidsPanel({ raidId }: RaidsPanelProps) {
  const [view, setView] = useState<RaidsPanelView>('loot')
  /*
   * Which encounters are open, as a set rather than a single id.
   *
   * Comparing two bosses' drops is a real thing to want — "which of these two do I actually need" —
   * and a single-open accordion makes that impossible. Held here rather than lifted: nothing outside
   * this panel has any use for it, and it should not survive switching raids.
   */
  const [openBosses, setOpenBosses] = useState<ReadonlySet<string>>(new Set())

  const toggleBoss = (id: string) =>
    setOpenBosses((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const raid = sampleRaids.find((entry) => entry.id === raidId)
  const bosses = getBossesForRaid(raidId)
  const attunement = getAttunementChainForRaid(raidId)

  if (!raid) return <Panel title="Raids" eyebrow="Loot">{<div className="raids-empty">No raid selected.</div>}</Panel>

  const totalDrops = bosses.reduce((total, boss) => total + boss.loot.length, 0) + (raid.notableTrashLoot?.length ?? 0)

  return (
    <Panel title={raid.name} eyebrow={`${raid.tier} · ${raid.playerSize}-player · ${totalDrops} notable drops`} className="raids-panel-shell">
      <p className="panel-copy">{raid.description}</p>

      {attunement && (
        <div className="tab-nav raid-view-nav">
          <button
            type="button"
            className={`tab-nav-button ${view === 'loot' ? 'tab-nav-button-active' : ''}`.trim()}
            onClick={() => setView('loot')}
          >
            Loot
          </button>
          <button
            type="button"
            className={`tab-nav-button ${view === 'attunement' ? 'tab-nav-button-active' : ''}`.trim()}
            onClick={() => setView('attunement')}
          >
            Attunement
          </button>
        </div>
      )}

      {view === 'attunement' && attunement ? (
        <RaidAttunementChain chain={attunement} />
      ) : (
        <div className="raid-detail raid-boss-grid" data-testid="raid-detail">
          {bosses.map((boss) => (
            <BossCard
              key={boss.id}
              id={boss.id}
              name={boss.name}
              art={`${import.meta.env.BASE_URL}raids/bosses/${boss.id}.jpg`}
              dropCount={boss.loot.length}
              open={openBosses.has(boss.id)}
              onToggle={() => toggleBoss(boss.id)}
            >
              {boss.loot.length > 0 ? (
                <RaidLootList entries={boss.loot} nameColor={lootNameColor} />
              ) : (
                <p className="raid-loot-empty">No notable drops catalogued for this encounter yet.</p>
              )}
            </BossCard>
          ))}

          {raid.notableTrashLoot && raid.notableTrashLoot.length > 0 && (
            <BossCard
              id="trash"
              name="Trash"
              dropCount={raid.notableTrashLoot.length}
              open={openBosses.has('trash')}
              onToggle={() => toggleBoss('trash')}
            >
              <RaidLootList entries={raid.notableTrashLoot} nameColor={lootNameColor} />
            </BossCard>
          )}

          {raid.needsVerification && (
            <small className="needs-verification raid-boss-grid-note">{raid.notes ?? 'Needs source verification.'}</small>
          )}
        </div>
      )}
    </Panel>
  )
}
