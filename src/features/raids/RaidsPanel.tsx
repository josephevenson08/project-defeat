import { useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import {
  getAttunementChainForRaid,
  getBossesForRaid,
  sampleRaids,
  type Raid,
  type RaidBoss,
  type RaidLootEntry,
} from '../../domain/raids'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getItemById } from '../gear/gearData'
import { RaidAttunementChain } from './RaidAttunementChain'
import { RaidLootList } from './RaidLootList'

type RaidsPanelView = 'bosses' | 'attunement'

function raidSummaryLine(raid: Raid) {
  return [`${raid.playerSize}-player`, raid.tier, `Phase ${raid.phase}`, `${raid.resetDays}-day lockout`].join(' · ')
}

/** Catalog-backed loot renders in its item quality colour; uncatalogued drops fall back to plain text. */
function lootNameColor(entry: RaidLootEntry) {
  const item = entry.itemId ? getItemById(entry.itemId) : undefined
  return item ? getQualityColor(item.quality) : undefined
}

function bossHeading(boss: RaidBoss) {
  if (boss.optional) return 'Optional'
  return boss.encounterOrder ? `Encounter ${boss.encounterOrder}` : 'Encounter order varies'
}

export function RaidsPanel() {
  const [selectedRaidId, setSelectedRaidId] = useState<string>('serpentshrine-cavern')
  const [view, setView] = useState<RaidsPanelView>('bosses')
  const [expandedBossId, setExpandedBossId] = useState<string | undefined>(undefined)

  const raid = sampleRaids.find((entry) => entry.id === selectedRaidId)
  const bosses = getBossesForRaid(selectedRaidId)
  const attunement = getAttunementChainForRaid(selectedRaidId)

  function selectRaid(raidId: string) {
    setSelectedRaidId(raidId)
    setView('bosses')
    setExpandedBossId(undefined)
  }

  return (
    <Panel title="Raids" eyebrow="Bosses, loot & attunements" className="raids-panel-shell">
      <p className="panel-copy">
        The five raids a Phase 2 player runs, boss by boss. Loot that already exists in the item catalog is colour-coded
        by quality; notable drops that are not catalogued yet are listed by name and flagged &quot;needs
        verification&quot; rather than given an invented id.
      </p>

      <div className="raids-picker">
        {sampleRaids.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`tab-nav-button ${entry.id === selectedRaidId ? 'tab-nav-button-active' : ''}`.trim()}
            onClick={() => selectRaid(entry.id)}
          >
            {entry.name}
          </button>
        ))}
      </div>

      {raid ? (
        <div className="raid-detail" data-testid="raid-detail">
          <div className="raid-detail-header">
            <h3>{raid.name}</h3>
            <span>{raidSummaryLine(raid)}</span>
          </div>
          <p className="panel-copy">{raid.description}</p>

          <dl className="raid-facts">
            <div>
              <dt>Location</dt>
              <dd>
                {raid.zone} — {raid.location}
              </dd>
            </div>
            <div>
              <dt>Attunement</dt>
              <dd>{raid.attunement}</dd>
            </div>
          </dl>

          {/* Only SSC and TK have a full chain modelled; the other three raids show their one-line summary above. */}
          {attunement && (
            <div className="raids-view-toggle">
              <button
                type="button"
                className={`tab-nav-button ${view === 'bosses' ? 'tab-nav-button-active' : ''}`.trim()}
                onClick={() => setView('bosses')}
              >
                Bosses
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
            <>
              <h4 className="raid-section-heading">Bosses &amp; loot ({bosses.length})</h4>
              <div className="raid-boss-list">
                {bosses.map((boss) => {
                  const isExpanded = expandedBossId === boss.id

                  return (
                    <article className="raid-boss" key={boss.id}>
                      <button
                        type="button"
                        className="raid-boss-header"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedBossId(isExpanded ? undefined : boss.id)}
                      >
                        <div>
                          <strong>{boss.name}</strong>
                          <span>{bossHeading(boss)}</span>
                        </div>
                        <span className="raid-boss-loot-count">{boss.loot.length} notable drops</span>
                      </button>

                      <p className="raid-boss-mechanics">{boss.mechanics}</p>

                      {boss.roleNotes && boss.roleNotes.length > 0 && (
                        <ul className="raid-boss-role-notes">
                          {boss.roleNotes.map((roleNote) => (
                            <li key={roleNote.role}>
                              <strong>{roleNote.role}</strong>
                              <span>{roleNote.note}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {boss.needsVerification && (
                        <small className="needs-verification">{boss.notes ?? 'Needs source verification.'}</small>
                      )}
                      {!boss.needsVerification && boss.notes && <p className="raid-boss-note">{boss.notes}</p>}

                      {isExpanded && <RaidLootList entries={boss.loot} nameColor={lootNameColor} />}
                    </article>
                  )
                })}
              </div>

              {raid.notableTrashLoot && raid.notableTrashLoot.length > 0 && (
                <>
                  <h4 className="raid-section-heading">Notable trash drops</h4>
                  <RaidLootList entries={raid.notableTrashLoot} nameColor={lootNameColor} />
                </>
              )}
            </>
          )}

          {raid.needsVerification && <small className="needs-verification">{raid.notes ?? 'Needs source verification.'}</small>}
        </div>
      ) : (
        <div className="raids-empty">No raid selected.</div>
      )}
    </Panel>
  )
}
