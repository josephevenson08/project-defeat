import { useEffect, useRef, useState } from 'react'
import { animateStatUpdate } from '../../lib/animations'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { relevantStats } from '../../domain/stats/statRelevance'
import type { CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { statLabels, type StatBlock } from './statsTypes'

type StatsRailProps = {
  stats: StatBlock
  role: CharacterRole
  className: TbcClass
  spec: TbcSpec
}

/**
 * The always-visible stat readout, modelled on the WoWSims left rail.
 *
 * These are **plain totals, not weighted values**. Stat weights are computed by the simulator, which
 * is currently hidden, so presenting anything weighted here would be quoting a number nothing
 * calculates. Armor is included because it is a displayed stat in its own right, not a
 * simulation-only derivation.
 *
 * **Rows the spec cannot use are hidden by default.** All 26 were shown before, which on a Fury
 * Warrior meant the whole Spell group, Feral attack power and six defensive rows reading 0 — about
 * half the rail carrying nothing, on the one surface that is always on screen. Healing Power 411 on
 * a Warrior reads as a bug rather than as an irrelevant row. `statRelevance.ts` holds the rules and
 * explains why attributes and armor are never among the hidden.
 *
 * Zero-valued stats that *are* relevant stay visible but dimmed rather than being hidden: a rail you
 * glance at while swapping gear should not reflow every time a stat crosses zero.
 *
 * **Below 900px the whole readout collapses behind a disclosure, and that is a concession the desktop
 * rail does not make.** The rail's premise is that the totals stay on screen while you move between
 * panels — but under 900px the shell stops being two columns, so the rail becomes a band *above* the
 * content and nothing about it is "always visible" any more. Measured on a 375px phone it was exactly
 * one full screen tall, which put the gear panel a whole swipe below the fold on every arrival. So on
 * a phone the trade runs the other way: one tap to read the stats, in exchange for the thing you came
 * to do being on the first screen.
 *
 * Collapsed means *absent*, not `display: none` — see `useMediaQuery` for why.
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

export function StatsRail({ stats, role, className, spec }: StatsRailProps) {
  const ref = useRef<HTMLElement>(null)
  /*
   * Deliberately not persisted. It is a display preference rather than part of the build, and the
   * saved-build format is a compatibility surface — adding a view toggle to it would mean every
   * saved build carries a decision about the rail.
   */
  const [showAll, setShowAll] = useState(false)

  /*
   * 900px is the shell's own breakpoint, not a second opinion about what counts as narrow — this
   * collapse exists *because* the shell stops being two columns there, so the two have to agree.
   */
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const [expandedWhenNarrow, setExpandedWhenNarrow] = useState(false)
  const readoutVisible = !isNarrow || expandedWhenNarrow

  useEffect(() => {
    const values = ref.current?.querySelectorAll('.rail-stat-value')
    // Nothing to animate while the readout is collapsed on a phone, and handing anime an empty list
    // makes it warn "No target found" on every stat change.
    if (!values?.length) return
    animateStatUpdate(values)
  }, [stats])

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    keys: showAll ? group.keys : relevantStats(group.keys, role, className, spec),
  })).filter((group) => group.keys.length > 0)

  const shownCount = visibleGroups.reduce((total, group) => total + group.keys.length, 0)
  const totalCount = GROUPS.reduce((total, group) => total + group.keys.length, 0)
  const hiddenCount = totalCount - shownCount

  return (
    <section className="rail-stats" ref={ref} aria-label="Stats">
      {isNarrow ? (
        <button
          type="button"
          className="rail-stats-disclosure"
          aria-expanded={expandedWhenNarrow}
          onClick={() => setExpandedWhenNarrow((current) => !current)}
          data-testid="rail-stats-disclosure"
        >
          <span className="rail-heading">Stats</span>
          {/* Names what is behind the button rather than just "Show", so a collapsed rail never reads
              as a section that has nothing in it. */}
          <span className="rail-stats-disclosure-hint">{expandedWhenNarrow ? 'Hide' : `${shownCount} stats`}</span>
        </button>
      ) : (
        <h2 className="rail-heading">Stats</h2>
      )}

      {readoutVisible && visibleGroups.map((group) => (
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

      {/*
        Says how many rows are hidden rather than just offering a toggle, so the rail never looks
        like it is simply missing stats. Nothing is removed — this is the escape hatch for any spec
        where the relevance call is arguable.
      */}
      {readoutVisible && (hiddenCount > 0 || showAll) ? (
        <button type="button" className="rail-stat-toggle" onClick={() => setShowAll((current) => !current)} data-testid="rail-show-all-stats">
          {showAll ? `Show only ${spec} stats` : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </section>
  )
}
