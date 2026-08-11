import { sampleRaids } from '../../domain/raids'

type RaidRailProps = {
  selectedRaidId: string
  onSelect: (raidId: string) => void
  onBackToPicker: () => void
}

/**
 * The other raids, in the rail, so switching between loot tables costs one click and never leaves
 * the page.
 *
 * This is the same argument that put the stat totals in the rail on the planner: the rail holds the
 * thing you keep coming back to while reading the main pane. On the planner that is your stats; on
 * Raids it is the list of raids.
 */
export function RaidRail({ selectedRaidId, onSelect, onBackToPicker }: RaidRailProps) {
  return (
    <section className="rail-raids" aria-label="Raids">
      <div className="rail-character-head">
        <h2 className="rail-heading">Raids</h2>
        <button type="button" className="rail-character-restart" onClick={onBackToPicker} data-testid="raids-back-to-picker">
          All raids
        </button>
      </div>

      <ul className="rail-raid-list">
        {sampleRaids.map((raid) => {
          const selected = raid.id === selectedRaidId
          return (
            <li key={raid.id}>
              <button
                type="button"
                className={`rail-raid ${selected ? 'rail-raid-selected' : ''}`.trim()}
                onClick={() => onSelect(raid.id)}
                aria-current={selected ? 'true' : undefined}
                data-testid={`rail-raid-${raid.id}`}
              >
                <span className="rail-raid-name">{raid.name}</span>
                <span className="rail-raid-meta">
                  {raid.tier} · {raid.playerSize}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
