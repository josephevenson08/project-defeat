import type { RaidLootEntry } from '../../domain/raids'
import { describeStats } from '../../domain/stats/describeStats'
import { getItemById } from '../gear/gearData'
import { slotGlyph } from '../gear/slotGlyphs'

type RaidLootListProps = {
  entries: readonly RaidLootEntry[]
  /** Supplied by the panel so quality colouring stays in one place. */
  nameColor: (entry: RaidLootEntry) => string | undefined
}

/**
 * A drop as a square frame plus what it is: name, then the stats it carries.
 *
 * The stats are the point. A loot table listing only names tells you what drops but not whether you
 * want it — which is the question you are actually asking while reading one.
 *
 * Not every listed drop is in the item catalogue. Those are shown by name and say so, rather than
 * being hidden or handed invented stats.
 */
export function RaidLootList({ entries, nameColor }: RaidLootListProps) {
  return (
    <div className="raid-loot-list">
      {entries.map((entry) => {
        const item = entry.itemId ? getItemById(entry.itemId) : undefined
        const wowItemId = entry.wowItemId ?? item?.wowItemId
        const stats = describeStats(item?.stats)

        return (
          <div className="raid-loot-row" key={`${entry.dropType}-${entry.itemId ?? entry.name}`} data-testid={`loot-${entry.itemId ?? entry.name}`}>
            <span className="raid-loot-frame" aria-hidden="true">
              <span className="raid-loot-frame-text">{item?.slot ? slotGlyph(item.slot) : '??'}</span>
              {item?.itemLevel ? <span className="raid-loot-ilvl">{item.itemLevel}</span> : null}
            </span>

            <div className="raid-loot-body">
              <strong style={{ color: nameColor(entry) }}>{entry.name}</strong>

              <span className="raid-loot-meta">
                {[entry.dropType, item?.slot, wowItemId ? `#${wowItemId}` : undefined, entry.roles?.join(', ')].filter(Boolean).join(' · ')}
              </span>

              {stats ? (
                <span className="raid-loot-stats">{stats}</span>
              ) : (
                <span className="raid-loot-stats raid-loot-stats-missing">
                  {entry.itemId ? 'No stats recorded for this item yet.' : 'Not in the item catalogue — listed by name only.'}
                </span>
              )}

              {entry.needsVerification ? (
                <small className="needs-verification">{entry.notes ?? 'Needs source verification.'}</small>
              ) : (
                entry.notes && <span className="raid-loot-note">{entry.notes}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
