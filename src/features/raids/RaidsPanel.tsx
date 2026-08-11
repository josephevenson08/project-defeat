import { useState } from 'react'
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
 * One raid's loot, boss by boss.
 *
 * Deliberately **not** a fight guide. Mechanics and per-role callouts were removed: this page answers
 * "what drops here", and a boss's abilities are a different question asked at a different time —
 * usually while looking at something other than a planner.
 *
 * Everything is expanded. The accordion this replaced hid the loot behind a click per boss, which
 * meant the one thing the page is for was never visible on arrival.
 */
export function RaidsPanel({ raidId }: RaidsPanelProps) {
  const [view, setView] = useState<RaidsPanelView>('loot')

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
        <div className="raid-detail" data-testid="raid-detail">
          {bosses.map((boss) => (
            <section className="raid-boss" key={boss.id} aria-label={`${boss.name} loot`}>
              <div className="raid-boss-header-static">
                <strong>{boss.name}</strong>
                <span className="raid-boss-loot-count">{boss.loot.length} drops</span>
              </div>
              {boss.loot.length > 0 ? (
                <RaidLootList entries={boss.loot} nameColor={lootNameColor} />
              ) : (
                <p className="raid-loot-empty">No notable drops catalogued for this encounter yet.</p>
              )}
            </section>
          ))}

          {raid.notableTrashLoot && raid.notableTrashLoot.length > 0 && (
            <section className="raid-boss" aria-label="Trash loot">
              <div className="raid-boss-header-static">
                <strong>Trash</strong>
                <span className="raid-boss-loot-count">{raid.notableTrashLoot.length} drops</span>
              </div>
              <RaidLootList entries={raid.notableTrashLoot} nameColor={lootNameColor} />
            </section>
          )}

          {raid.needsVerification && <small className="needs-verification">{raid.notes ?? 'Needs source verification.'}</small>}
        </div>
      )}
    </Panel>
  )
}
