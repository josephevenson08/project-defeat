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

      {/*
        **One raid per screen, scrolled through rather than scanned across.**

        Five cards in a row is a picker you read; five full-height panels is a thing you move through,
        which suits a set of five that each have a character and an atmosphere of their own. The art
        is the point — the loot table behind each of these is several hundred rows and the boss on the
        front is what tells you which one you want.

        Each raid looks for `public/raids/<id>.jpg` and simply has no background if the file is
        absent, so the page is complete either way. `--raid-art` carries the URL rather than an inline
        `background-image`, which keeps the gradient scrim in the stylesheet where it can be tuned
        with everything else.
      */}
      <div className="raid-picker-reel">
        {sampleRaids.map((raid) => {
          const bosses = getBossesForRaid(raid.id)
          const drops = bosses.reduce((total, boss) => total + boss.loot.length, 0) + (raid.notableTrashLoot?.length ?? 0)

          return (
            <button
              key={raid.id}
              type="button"
              className="raid-picker-card"
              style={{ '--raid-art': `url(${import.meta.env.BASE_URL}raids/${raid.id}.jpg)` } as React.CSSProperties}
              onClick={() => onSelect(raid.id)}
              data-testid={`raid-pick-${raid.id}`}
            >
              <span className="raid-picker-plate">
                <span className="raid-picker-tier">
                  {raid.tier} · {raid.playerSize}-player
                </span>
                <span className="raid-picker-name">{raid.name}</span>
                {/* Counts are computed rather than written, so they cannot drift from the data. */}
                <span className="raid-picker-count">
                  {bosses.length} {bosses.length === 1 ? 'boss' : 'bosses'} · {drops} notable drops
                </span>
                <span className="raid-picker-go">See what drops here →</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
