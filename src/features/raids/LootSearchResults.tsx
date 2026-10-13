import type { ReactNode } from 'react'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { lootItem, lootKindLabel, searchRaidLoot, type Raid, type RaidBoss, type RaidLootEntry } from '../../domain/raids'
import { LootIcon } from './LootIcon'
import { slotName, type LootTipBinder } from './raidLootTip'

type LootSearchResultsProps = {
  query: string
  selectedRaidId: string
  /** What to say beside a hit: its rank for your spec, or how many raiders want it. */
  annotate: (entry: RaidLootEntry, raid: Raid) => ReactNode
  onOpen: (entry: RaidLootEntry, raid: Raid, boss: RaidBoss | undefined) => void
  onClear: () => void
  bindTip: LootTipBinder
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** The query's matches marked inside a name, case-insensitively. */
function highlight(name: string, query: string): ReactNode[] {
  const needle = query.trim().toLowerCase()
  const parts: ReactNode[] = []
  let from = 0
  let at = name.toLowerCase().indexOf(needle, from)
  while (at > -1) {
    parts.push(name.slice(from, at), <mark key={at}>{name.slice(at, at + needle.length)}</mark>)
    from = at + needle.length
    at = name.toLowerCase().indexOf(needle, from)
  }
  parts.push(name.slice(from))
  return parts
}

/**
 * The drops of all five raids whose name matches, grouped by raid and boss. Pressing one opens it
 * where it drops. It replaces the raid on screen while a search is going, as in the prototype.
 */
export function LootSearchResults({ query, selectedRaidId, annotate, onOpen, onClear, bindTip }: LootSearchResultsProps) {
  const results = searchRaidLoot(query)
  const total = results.reduce((sum, result) => sum + result.count, 0)

  if (total === 0) {
    return (
      <div className="panel loot-search-empty" data-testid="loot-search-results">
        <p>No drops match “{query.trim()}”.</p>
        <p>Try part of a name, such as “Trophy”, “Destroyer” or “Mongoose”.</p>
        <button type="button" className="button" onClick={onClear}>
          Clear search
        </button>
      </div>
    )
  }

  return (
    <div className="loot-search" data-testid="loot-search-results" aria-label="Search results">
      <div className="loot-search-head">
        <h2>
          {total === 1 ? '1 drop matches' : `${total} drops match`} in {plural(results.length, 'raid')}
        </h2>
        <p>Searching all five raids · press a drop to open it where it drops · Esc clears</p>
      </div>
      {results.map(({ raid, sources, count }) => (
        <section key={raid.id} className="panel loot-search-raid" aria-label={raid.name}>
          <h2>
            {raid.name}{' '}
            <small>
              Phase {raid.phase} · {raid.tier} · {plural(count, 'match', 'matches')}
              {raid.id === selectedRaidId ? ' · selected raid' : ''}
            </small>
          </h2>
          {sources.map((source) => (
            <div key={source.boss?.id ?? 'trash'}>
              <h3 className="loot-search-boss">{source.boss ? source.boss.name : 'Notable trash'}</h3>
              <ul className="loot-search-hits">
                {source.entries.map((entry) => {
                  const item = lootItem(entry)
                  const meta = [slotName(item?.slot), item?.itemLevel ? `ilvl ${item.itemLevel}` : '', lootKindLabel(entry)].filter(Boolean).join(' · ')
                  return (
                    <li key={`${entry.name}-${entry.itemId ?? ''}`}>
                      <button type="button" className="loot-search-hit" onClick={() => onOpen(entry, raid, source.boss)} {...bindTip(entry)}>
                        <LootIcon entry={entry} size={30} />
                        <span className="loot-search-name" style={{ color: item ? getQualityColor(item.quality) : undefined }}>
                          {highlight(entry.name, query)}
                        </span>
                        <span className="loot-search-meta">{meta}</span>
                      </button>
                      {annotate(entry, raid)}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
