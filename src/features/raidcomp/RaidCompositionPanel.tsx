import { useEffect, useMemo, useState } from 'react'
import { describeProvider } from '../../domain/buffs/buffTypes'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import type { CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { getRoleForSpec, tbcClasses } from '../../domain/character/tbcClasses'
import type { RaidPlayerSize } from '../../domain/raids/raidTypes'
import {
  PARTY_SIZE,
  RAID_SIZES,
  addToGroup,
  clearSeat,
  computeCoverage,
  describeSuggestion,
  emptyRoster,
  resizeRoster,
} from '../../domain/raidcomp'
import type { CoverageSection, Roster } from '../../domain/raidcomp'
import { downloadRosterImage } from './exportRosterImage'
import { clearStoredRoster, loadRoster, saveRoster } from './rosterStorage'

/**
 * The raid-composition planner: a seating chart in, buff coverage out.
 *
 * **It is built around groups because in TBC composition *is* group assignment.** 24 of the 33 raid
 * buffs are party-scoped — every totem, every aura, both Warrior shouts, Arcane Brilliance, Gift of
 * the Wild — so which group the Shaman sits in decides who actually receives Strength of Earth. The
 * first version of this panel treated every buff as raid-wide and told a raid leader Battle Shout
 * was covered when five of twenty-five players had it. Sourcing the scopes from the spell tooltips
 * is what turned this from a checklist into a planning tool.
 *
 * **A section rather than a planner panel** because nothing here belongs to the character in the
 * rail — the person planning a raid is usually not the person being geared.
 */

const ROLE_ORDER: readonly CharacterRole[] = ['Tank', 'Healer', 'Physical DPS', 'Caster DPS']

/**
 * Rough shape of a working raid, shown as guidance rather than enforced.
 *
 * Deliberately a range and deliberately soft: real Phase 2 raids run 2-3 tanks and 5-7 healers
 * depending on the fight. The panel says what is unusual; it never says what is wrong.
 */
const TYPICAL_SHAPE: Record<RaidPlayerSize, Partial<Record<CharacterRole, readonly [number, number]>>> = {
  10: { Tank: [1, 2], Healer: [2, 3] },
  25: { Tank: [2, 3], Healer: [5, 7] },
}

const ALL_SPECS = tbcClasses.flatMap((definition) =>
  definition.specs.map((spec) => ({
    className: definition.className,
    spec,
    role: getRoleForSpec(definition.className, spec),
  })),
)

function CoverageList<T extends Buff | TargetDebuff>({ section, label }: { section: CoverageSection<T>; label: string }) {
  const total = section.covered.length + section.missing.length
  const testLabel = label.toLowerCase().replace(/[^a-z]+/g, '-')

  return (
    <section className="raidcomp-coverage" aria-label={label}>
      <header className="raidcomp-coverage-head">
        <h3>{label}</h3>
        <span className="raidcomp-coverage-count" data-testid={`raidcomp-${testLabel}-count`}>
          {section.covered.length} / {total}
        </span>
      </header>

      {section.missing.length > 0 && (
        <ul className="raidcomp-missing">
          {section.missing.map(({ entry, needs }) => (
            <li key={entry.id}>
              <span className="raidcomp-entry-name">{entry.name}</span>
              <span className="raidcomp-entry-need">needs {needs}</span>
            </li>
          ))}
        </ul>
      )}

      {section.covered.length > 0 && (
        <ul className="raidcomp-covered">
          {section.covered.map(({ entry, providedBy }) => (
            <li key={entry.id}>
              <span className="raidcomp-entry-name">{entry.name}</span>
              <span className="raidcomp-entry-source">
                {describeProvider(entry)}
                {providedBy > 1 ? ` · ${providedBy}×` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function RaidCompositionPanel() {
  const [roster, setRoster] = useState<Roster>(() => loadRoster() ?? emptyRoster(25))
  /*
   * Which group a picked spec lands in. Defaulting to the first group with room means a raid leader
   * can fill 25 seats by clicking 25 specs, and only has to think about groups when they want to.
   */
  const [selectedGroup, setSelectedGroup] = useState(0)

  const report = useMemo(() => computeCoverage(roster), [roster])

  useEffect(() => {
    saveRoster(roster)
  }, [roster])

  const firstGroupWithRoom = roster.groups.findIndex((group) => group.includes(undefined))
  const targetGroup = roster.groups[selectedGroup]?.includes(undefined) ? selectedGroup : firstGroupWithRoom

  const place = (className: TbcClass, spec: TbcSpec) => {
    if (targetGroup === -1) return
    setRoster((current) => addToGroup(current, targetGroup, { className, spec }))
  }

  const shape = TYPICAL_SHAPE[roster.size]
  const title = `${roster.size}-player raid`

  return (
    <div className="panel raidcomp" data-testid="raidcomp-panel">
      <header className="panel-head">
        <h2>Raid Composition</h2>
        <p className="panel-copy">
          Seat a raid and see what each group actually receives. <strong>24 of the 33 raid buffs are
          party-scoped in TBC</strong> — totems, auras and shouts reach only the caster's group of five — so
          where someone sits matters as much as whether they are in the raid at all. Every scope is read
          from the spell's own tooltip.
        </p>
      </header>

      <div className="raidcomp-controls">
        <div className="raidcomp-size" role="group" aria-label="Raid size">
          {RAID_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              className={option === roster.size ? 'is-active' : ''}
              aria-pressed={option === roster.size}
              onClick={() => setRoster((current) => resizeRoster(current, option))}
              data-testid={`raidcomp-size-${option}`}
            >
              {option}-player
            </button>
          ))}
        </div>

        <p className="raidcomp-filled" data-testid="raidcomp-filled">
          <strong>{report.filled}</strong> of {report.size} seats
          {report.remaining > 0 ? ` · ${report.remaining} open` : ''}
        </p>

        <div className="raidcomp-actions">
          <button
            type="button"
            className="raidcomp-export"
            onClick={() => downloadRosterImage(roster, title)}
            data-testid="raidcomp-export"
          >
            Export image
          </button>
          {report.filled > 0 && (
            <button
              type="button"
              className="raidcomp-clear"
              onClick={() => {
                setRoster(emptyRoster(roster.size))
                clearStoredRoster()
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <section className="raidcomp-roles" aria-label="Role balance">
        {ROLE_ORDER.map((role) => {
          const band = shape[role]
          const count = report.roleCounts[role]
          const unusual = band !== undefined && report.filled > 0 && (count < band[0] || count > band[1])
          return (
            <div key={role} className="raidcomp-role" data-testid={`raidcomp-role-${role.replace(/\s+/g, '-').toLowerCase()}`}>
              <span className="raidcomp-role-count">{count}</span>
              <span className="raidcomp-role-label">{role}</span>
              {band && (
                <span className={unusual ? 'raidcomp-role-band is-unusual' : 'raidcomp-role-band'}>
                  usually {band[0]}–{band[1]}
                </span>
              )}
            </div>
          )
        })}
      </section>

      <section className="raidcomp-picker" aria-label="Add a spec">
        <h3>
          Add to <span className="raidcomp-target">Group {targetGroup === -1 ? '—' : targetGroup + 1}</span>
        </h3>
        <div className="raidcomp-spec-grid">
          {ALL_SPECS.map(({ className, spec }) => (
            <button
              key={`${className}-${spec}`}
              type="button"
              className="raidcomp-spec-add"
              disabled={targetGroup === -1}
              onClick={() => place(className, spec)}
              data-testid={`raidcomp-add-${className}-${spec}`.replace(/\s+/g, '-').toLowerCase()}
              aria-label={`Add ${spec} ${className}`}
            >
              {spec} {className}
            </button>
          ))}
        </div>
      </section>

      {/* The working surface: seating on the left of each column, what that seating buys underneath. */}
      <section className="raidcomp-groups" aria-label="Groups">
        {report.groups.map((groupCoverage) => {
          const group = roster.groups[groupCoverage.groupIndex]
          const isTarget = groupCoverage.groupIndex === targetGroup
          return (
            <div
              key={groupCoverage.groupIndex}
              className={isTarget ? 'raidcomp-group is-target' : 'raidcomp-group'}
              data-testid={`raidcomp-group-${groupCoverage.groupIndex + 1}`}
            >
              <button
                type="button"
                className="raidcomp-group-head"
                onClick={() => setSelectedGroup(groupCoverage.groupIndex)}
                aria-pressed={isTarget}
              >
                <span>Group {groupCoverage.groupIndex + 1}</span>
                <span className="raidcomp-group-count">
                  {groupCoverage.filled}/{PARTY_SIZE}
                </span>
              </button>

              <ol className="raidcomp-seats">
                {group.map((slot, seatIndex) => (
                  <li key={seatIndex} className={slot ? 'raidcomp-seat is-filled' : 'raidcomp-seat'}>
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => setRoster((current) => clearSeat(current, groupCoverage.groupIndex, seatIndex))}
                        aria-label={`Remove ${slot.spec} ${slot.className} from group ${groupCoverage.groupIndex + 1}`}
                        data-role={getRoleForSpec(slot.className, slot.spec)}
                      >
                        <span className="raidcomp-seat-name">
                          {slot.spec} {slot.className}
                        </span>
                        <span className="raidcomp-seat-remove" aria-hidden="true">
                          ×
                        </span>
                      </button>
                    ) : (
                      <span className="raidcomp-seat-empty">—</span>
                    )}
                  </li>
                ))}
              </ol>

              {/*
                What this group receives, which is the whole reason the seating is on screen. Shown
                per group and deliberately kept out of the exported image: this is the decision
                surface, the image is the result.
              */}
              <div className="raidcomp-group-buffs">
                <span className="raidcomp-group-buffs-label">
                  Party buffs · {groupCoverage.partyBuffs.length}
                </span>
                {groupCoverage.partyBuffs.length === 0 ? (
                  <span className="raidcomp-group-buffs-none">
                    {groupCoverage.filled === 0 ? 'Empty group' : 'None from this group'}
                  </span>
                ) : (
                  <ul>
                    {groupCoverage.partyBuffs.map((buff) => (
                      <li key={buff.id}>{buff.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <div className="raidcomp-columns">
        <CoverageList section={report.raidWide} label="Raid-wide" />
        <CoverageList section={report.partyScoped} label="Party buffs" />
        <CoverageList section={report.debuffs} label="Debuffs" />
      </div>

      {report.suggestions.length > 0 && (
        <section className="raidcomp-suggestions" aria-label="What to add next">
          <h3>What one more seat would buy you</h3>
          <ul>
            {report.suggestions.slice(0, 5).map((suggestion) => (
              <li key={`${suggestion.className}-${suggestion.specs.join('-')}`}>
                <span className="raidcomp-entry-name">{describeSuggestion(suggestion)}</span>
                <span className="raidcomp-entry-source">
                  +{suggestion.wouldAdd.length} — {suggestion.wouldAdd.slice(0, 4).join(', ')}
                  {suggestion.wouldAdd.length > 4 ? ` and ${suggestion.wouldAdd.length - 4} more` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
