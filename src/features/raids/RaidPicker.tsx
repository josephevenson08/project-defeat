import { sampleRaids } from '../../domain/raids'
import { getBossesForRaid } from '../../domain/raids'

type RaidPickerProps = {
  onSelect: (raidId: string) => void
}

/**
 * Which raid you came to read about, chosen before any of it is shown.
 *
 * Five raids' loot tables stacked on one page is several hundred rows, and nobody arrives wanting
 * all of them — you arrive wanting one. Choosing first means the page that follows is entirely about
 * the thing you asked for, and the rail then carries the other four for switching.
 */
export function RaidPicker({ onSelect }: RaidPickerProps) {
  return (
    <div className="raid-picker">
      <div className="raid-picker-head">
        <p className="eyebrow">Loot tables</p>
        <h2>Which raid?</h2>
        <p className="panel-copy">
          The five raids a Phase 2 player runs. Pick one to see what drops in it; the rest stay one click away.
        </p>
      </div>

      <div className="raid-picker-grid">
        {sampleRaids.map((raid) => {
          const bosses = getBossesForRaid(raid.id)
          const drops = bosses.reduce((total, boss) => total + boss.loot.length, 0) + (raid.notableTrashLoot?.length ?? 0)

          return (
            <button key={raid.id} type="button" className="raid-picker-card" onClick={() => onSelect(raid.id)} data-testid={`raid-pick-${raid.id}`}>
              <span className="raid-picker-tier">
                {raid.tier} · {raid.playerSize}-player
              </span>
              <span className="raid-picker-name">{raid.name}</span>
              {/* Counts are computed rather than written, so they cannot drift from the data. */}
              <span className="raid-picker-count">
                {bosses.length} {bosses.length === 1 ? 'boss' : 'bosses'} · {drops} notable drops
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
