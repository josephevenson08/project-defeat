import { useEffect, useRef, useState } from 'react'
import { animateStatUpdate } from '../../lib/animations'
import { relevantStats } from '../../domain/stats/statRelevance'
import type { CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { statLabels, type StatBlock } from './statsTypes'

type StatBarProps = {
  stats: StatBlock
  role: CharacterRole
  className: TbcClass
  spec: TbcSpec
}

/**
 * Every number on the planner, in one place.
 *
 * **It replaced two readouts that showed the same stats twice.** The rail listed all twenty-six down
 * the left; "Key totals" sat in the middle of the paperdoll with six of them repeated. The owner's
 * heuristic evaluation caught it from the outside — "key totals in the middle that look like the
 * stats section" — and it is the rule this redesign is built on: a number appears once per screen.
 *
 * Collapsed it is the six that matter for the role, on one sticky line, so a swap's effect stays
 * visible while you scroll the gear list. Open it is the full grouped table **and the six are not
 * repeated above it**, because then they would be in the table.
 */

/**
 * The six worth watching while changing gear, per role.
 *
 * Filtered through the same relevance rules the full table uses rather than trusted as written: a
 * headline list is a per-role guess, and `statRelevance` knows the per-*spec* exceptions — a Feral
 * Druid seeing Expertise it cannot use is the same wrong row the rail already learned to hide.
 */
const HEADLINE_BY_ROLE: Record<CharacterRole, ReadonlyArray<keyof StatBlock>> = {
  'Physical DPS': ['attackPower', 'hitRating', 'critRating', 'hasteRating', 'expertiseRating', 'armorPenetration'],
  'Caster DPS': ['spellPower', 'spellHitRating', 'spellCritRating', 'spellHasteRating', 'intellect', 'mp5'],
  Healer: ['healingPower', 'spellCritRating', 'spellHasteRating', 'mp5', 'intellect', 'spirit'],
  Tank: ['armor', 'stamina', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating'],
}

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

/** Kept byte-identical to the old rail's scheme so existing test ids keep resolving. */
function testIdForStat(label: string) {
  return `stat-${label.toLowerCase().replaceAll(' ', '-')}`
}

export function StatBar({ stats, role, className, spec }: StatBarProps) {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  /*
   * Deliberately not persisted, like the old rail's toggle. It is a display preference rather than
   * part of the build, and the saved-build format is a compatibility surface — adding a view toggle
   * to it would mean every saved build carries a decision about a table.
   */
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const values = ref.current?.querySelectorAll('.stat-value')
    // Handing anime an empty list makes it warn "No target found" on every stat change.
    if (!values?.length) return
    animateStatUpdate(values)
  }, [stats, open, showAll])

  const headline = relevantStats(HEADLINE_BY_ROLE[role], role, className, spec)

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    keys: showAll ? group.keys : relevantStats(group.keys, role, className, spec),
  })).filter((group) => group.keys.length > 0)

  const shownCount = visibleGroups.reduce((total, group) => total + group.keys.length, 0)
  const totalCount = GROUPS.reduce((total, group) => total + group.keys.length, 0)
  const hiddenCount = totalCount - shownCount

  function statRow(key: keyof StatBlock, layout: 'inline' | 'row') {
    const label = LABEL_BY_KEY.get(key) ?? key
    const value = Math.round(stats[key])
    return (
      <div
        className={`stat-${layout} ${value === 0 ? 'stat-zero' : ''}`.trim()}
        data-testid={testIdForStat(label)}
        key={key}
      >
        <span className="stat-label">{label}</span>
        {/* Tabular figures so the column lines up as you swap items and digits change width — the
            whole point of keeping these on screen is watching one move. */}
        <span className="stat-value">{value.toLocaleString()}</span>
      </div>
    )
  }

  return (
    <section className="stat-bar" ref={ref} aria-label="Stats" data-open={open || undefined}>
      <div className="stat-bar-line">
        {/* The headline six are absent, not hidden, while the table is open: rendering both would put
            the same number on screen twice, which is the thing this component exists to stop. */}
        {!open && headline.map((key) => statRow(key, 'inline'))}
        {open && <span className="stat-bar-title">Stats</span>}

        <button
          type="button"
          className="stat-bar-toggle"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          data-testid="stat-bar-toggle"
        >
          {open ? 'Hide stats' : `All ${shownCount} stats`}
        </button>
      </div>

      {open && (
        <div className="stat-bar-table">
          {visibleGroups.map((group) => (
            <section className="stat-group" key={group.title}>
              <p className="stat-group-title">{group.title}</p>
              {group.keys.map((key) => statRow(key, 'row'))}
            </section>
          ))}

          {/*
            Says how many rows are hidden rather than just offering a toggle, so the table never looks
            like it is simply missing stats. Nothing is removed — this is the escape hatch for any
            spec where the relevance call is arguable.
          */}
          {hiddenCount > 0 || showAll ? (
            <button type="button" className="stat-show-all" onClick={() => setShowAll((current) => !current)} data-testid="stat-show-all">
              {showAll ? `Show only ${spec} stats` : `Show ${hiddenCount} more`}
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
