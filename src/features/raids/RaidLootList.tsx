import type { RaidLootEntry } from '../../domain/raids'
import { getItemById } from '../gear/gearData'

type RaidLootListProps = {
  entries: readonly RaidLootEntry[]
  /** Supplied by the panel so quality colouring stays in one place. */
  nameColor: (entry: RaidLootEntry) => string | undefined
}

function lootMeta(entry: RaidLootEntry) {
  const item = entry.itemId ? getItemById(entry.itemId) : undefined
  const wowItemId = entry.wowItemId ?? item?.wowItemId

  return [
    entry.dropType,
    item?.slot,
    entry.roles?.join(', '),
    wowItemId ? `Item ID ${wowItemId}` : undefined,
    entry.itemId ? undefined : 'Not in item catalog',
  ]
    .filter(Boolean)
    .join(' · ')
}

export function RaidLootList({ entries, nameColor }: RaidLootListProps) {
  return (
    <div className="raid-loot-list">
      {entries.map((entry) => (
        <div className="raid-loot-row" key={`${entry.dropType}-${entry.itemId ?? entry.name}`}>
          <div>
            <strong style={{ color: nameColor(entry) }}>{entry.name}</strong>
            <span>{lootMeta(entry)}</span>
          </div>
          {entry.needsVerification ? (
            <small className="needs-verification">{entry.notes ?? 'Needs source verification.'}</small>
          ) : (
            entry.notes && <p>{entry.notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}
