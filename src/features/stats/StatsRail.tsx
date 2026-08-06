import { useEffect, useRef } from 'react'
import { animateStatUpdate } from '../../lib/animations'
import { statLabels, type StatBlock } from './statsTypes'

type StatsRailProps = {
  stats: StatBlock
}

/**
 * The always-visible stat readout, modelled on the WoWSims left rail.
 *
 * These are **plain totals, not weighted values**. Stat weights are computed by the simulator, which
 * is currently hidden, so presenting anything weighted here would be quoting a number nothing
 * calculates. Armor is included because it is a displayed stat in its own right, not a
 * simulation-only derivation.
 *
 * Zero-valued stats are shown but dimmed rather than hidden: a rail you glance at while swapping
 * gear should not reflow every time a stat crosses zero.
 */

const GROUPS: ReadonlyArray<{ title: string; keys: ReadonlyArray<keyof StatBlock> }> = [
  { title: 'Attributes', keys: ['strength', 'agility', 'stamina', 'intellect', 'spirit'] },
  {
    title: 'Physical',
    keys: ['attackPower', 'rangedAttackPower', 'feralAttackPower', 'hitRating', 'critRating', 'hasteRating', 'expertiseRating', 'armorPenetration'],
  },
  { title: 'Spell', keys: ['spellPower', 'healingPower', 'spellHitRating', 'spellCritRating', 'spellHasteRating', 'mp5'] },
  { title: 'Defence', keys: ['armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'resilienceRating'] },
]

const LABEL_BY_KEY = new Map(statLabels)

/** Kept byte-identical to the old panel's scheme so existing test ids keep resolving. */
function testIdForStat(label: string) {
  return `stat-${label.toLowerCase().replaceAll(' ', '-')}`
}

export function StatsRail({ stats }: StatsRailProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    animateStatUpdate(ref.current?.querySelectorAll('.rail-stat-value') ?? null)
  }, [stats])

  return (
    <section className="rail-stats" ref={ref} aria-label="Stats">
      <h2 className="rail-heading">Stats</h2>
      {GROUPS.map((group) => (
        <section className="rail-stat-group" key={group.title}>
          <p className="rail-stat-group-title">{group.title}</p>
          {group.keys.map((key) => {
            const label = LABEL_BY_KEY.get(key) ?? key
            const value = Math.round(stats[key])
            return (
              <div className={`rail-stat ${value === 0 ? 'rail-stat-zero' : ''}`.trim()} data-testid={testIdForStat(label)} key={key}>
                <span className="rail-stat-label">{label}</span>
                <span className="rail-stat-value">{value}</span>
              </div>
            )
          })}
        </section>
      ))}
    </section>
  )
}
