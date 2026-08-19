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
  getBuffIcon,
  getSpecIcon,
  moveSeat,
  renameSeat,
  resizeRoster,
} from '../../domain/raidcomp'
import type { CoverageSection, Roster, SeatRef } from '../../domain/raidcomp'
import { downloadRosterImage } from './exportRosterImage'
import { clearStoredRoster, loadRoster, saveRoster } from './rosterStorage'

/**
 * The raid-composition planner: a seating chart in, buff coverage out.
 *
 * **Built around groups because in TBC composition *is* group assignment.** 24 of the 33 raid buffs
 * are party-scoped — every totem, every aura, both Warrior shouts — so which group the Shaman sits in
 * decides who actually receives Strength of Earth. The first version treated everything as raid-wide
 * and told a raid leader Battle Shout was covered when five of twenty-five players had it.
 */

const ROLE_ORDER: readonly CharacterRole[] = ['Tank', 'Healer', 'Physical DPS', 'Caster DPS']

/**
 * Rough shape of a working raid, shown as guidance rather than enforced. Real Phase 2 raids run 2-3
 * tanks and 5-7 healers depending on the fight, so the panel says what is unusual, never what is wrong.
 */
const TYPICAL_SHAPE: Record<RaidPlayerSize, Partial<Record<CharacterRole, readonly [number, number]>>> = {
  10: { Tank: [1, 2], Healer: [2, 3] },
  25: { Tank: [2, 3], Healer: [5, 7] },
}

const ALL_SPECS = tbcClasses.flatMap((definition) =>
  definition.specs.map((spec) => ({ className: definition.className, spec })),
)

const iconUrl = (name: string | undefined) => (name ? `${import.meta.env.BASE_URL}icons/${name}.jpg` : undefined)

/** Wowhead shows granted buffs as a row of icons; the names live in the title, as they do there. */
function BuffIcons({ buffs, emptyLabel }: { buffs: readonly Buff[]; emptyLabel: string }) {
  if (buffs.length === 0) return <span className="raidcomp-group-buffs-none">{emptyLabel}</span>

  return (
    <ul className="raidcomp-buff-icons">
      {buffs.map((buff) => (
        <li key={buff.id}>
          <img
            src={iconUrl(getBuffIcon(buff.id))}
            alt={buff.name}
            title={buff.name}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
  )
}

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
              <img className="raidcomp-row-icon" src={iconUrl(getBuffIcon(entry.id))} alt="" loading="lazy" />
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
              <img className="raidcomp-row-icon" src={iconUrl(getBuffIcon(entry.id))} alt="" loading="lazy" />
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
  const [selectedGroup, setSelectedGroup] = useState(0)
  /** The seat currently being dragged. Held in state so the drop target can style itself. */
  const [dragging, setDragging] = useState<SeatRef | undefined>()
  /** Which seat has its name field open. One at a time keeps the chart readable. */
  const [naming, setNaming] = useState<SeatRef | undefined>()
  /**
   * The in-progress name, held here rather than left to an uncontrolled input.
   *
   * An uncontrolled `defaultValue` field looked simpler and was subtly wrong: React re-renders this
   * list on every roster change, and a re-render while the field is open discards whatever was typed
   * because the DOM value is not the source of truth. Controlled state survives that, and it is also
   * the only version a test can drive.
   */
  const [draftName, setDraftName] = useState('')

  const report = useMemo(() => computeCoverage(roster), [roster])

  useEffect(() => {
    saveRoster(roster)
  }, [roster])

  const firstGroupWithRoom = roster.groups.findIndex((group) => group.includes(undefined))
  const targetGroup = roster.groups[selectedGroup]?.includes(undefined) ? selectedGroup : firstGroupWithRoom

  const shape = TYPICAL_SHAPE[roster.size]
  const title = `${roster.size}-player raid`

  const place = (className: TbcClass, spec: TbcSpec) => {
    if (targetGroup === -1) return
    setRoster((current) => addToGroup(current, targetGroup, { className, spec }))
  }

  const sameSeat = (a: SeatRef | undefined, b: SeatRef) =>
    a !== undefined && a.groupIndex === b.groupIndex && a.seatIndex === b.seatIndex

  return (
    <div className="panel raidcomp" data-testid="raidcomp-panel">
      <header className="panel-head">
        <h2>Raid Composition</h2>
        <p className="panel-copy">
          Seat a raid and see what each group actually receives. <strong>24 of the 33 raid buffs are
          party-scoped in TBC</strong> — totems, auras and shouts reach only the caster's group of five — so
          where someone sits matters as much as whether they are in the raid. Drag to move a player; click a
          name to label the seat.
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
              <img src={iconUrl(getSpecIcon(className, spec))} alt="" loading="lazy" decoding="async" />
              <span>
                {spec} {className}
              </span>
            </button>
          ))}
        </div>
      </section>

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
                {group.map((slot, seatIndex) => {
                  const ref: SeatRef = { groupIndex: groupCoverage.groupIndex, seatIndex }
                  const isNaming = sameSeat(naming, ref)

                  return (
                    <li
                      key={seatIndex}
                      className={`raidcomp-seat${slot ? ' is-filled' : ''}${sameSeat(dragging, ref) ? ' is-dragging' : ''}`}
                      /*
                       * Every seat is a drop target, empty ones included — dragging into a gap is the
                       * obvious way to move someone, and `moveSeat` swaps when the destination is
                       * occupied so a drop never silently deletes anybody.
                       */
                      onDragOver={(event) => {
                        if (dragging) event.preventDefault()
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        if (dragging) setRoster((current) => moveSeat(current, dragging, ref))
                        setDragging(undefined)
                      }}
                    >
                      {slot ? (
                        <div
                          className="raidcomp-seat-body"
                          draggable
                          onDragStart={() => setDragging(ref)}
                          onDragEnd={() => setDragging(undefined)}
                          data-role={getRoleForSpec(slot.className, slot.spec)}
                        >
                          <img
                            className="raidcomp-seat-icon"
                            src={iconUrl(getSpecIcon(slot.className, slot.spec))}
                            alt=""
                            loading="lazy"
                          />

                          <span className="raidcomp-seat-text">
                            {isNaming ? (
                              <input
                                className="raidcomp-seat-input"
                                autoFocus
                                value={draftName}
                                placeholder="Player name"
                                aria-label={`Name for ${slot.spec} ${slot.className}`}
                                data-testid={`raidcomp-name-input-${groupCoverage.groupIndex + 1}-${seatIndex + 1}`}
                                onChange={(event) => setDraftName(event.target.value)}
                                onBlur={() => {
                                  setRoster((current) => renameSeat(current, ref, draftName))
                                  setNaming(undefined)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    setRoster((current) => renameSeat(current, ref, draftName))
                                    setNaming(undefined)
                                  }
                                  // Escape abandons the edit, leaving whatever name was already there.
                                  if (event.key === 'Escape') setNaming(undefined)
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className="raidcomp-seat-label"
                                onClick={() => {
                                  setDraftName(slot.playerName ?? '')
                                  setNaming(ref)
                                }}
                                aria-label={`Name the ${slot.spec} ${slot.className} in group ${groupCoverage.groupIndex + 1}`}
                              >
                                {slot.playerName ? (
                                  <>
                                    <span className="raidcomp-seat-player">{slot.playerName}</span>
                                    <span className="raidcomp-seat-spec">
                                      {slot.spec} {slot.className}
                                    </span>
                                  </>
                                ) : (
                                  <span className="raidcomp-seat-name">
                                    {slot.spec} {slot.className}
                                  </span>
                                )}
                              </button>
                            )}
                          </span>

                          <button
                            type="button"
                            className="raidcomp-seat-remove"
                            onClick={() => setRoster((current) => clearSeat(current, ref.groupIndex, ref.seatIndex))}
                            aria-label={`Remove ${slot.spec} ${slot.className}`}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <span className="raidcomp-seat-empty">—</span>
                      )}
                    </li>
                  )
                })}
              </ol>

              {/*
                What this seating buys, as icons — the same shape Wowhead uses, and deliberately kept
                out of the exported image: this is the decision surface, the PNG is the result.
              */}
              <div className="raidcomp-group-buffs">
                <span className="raidcomp-group-buffs-label">Party buffs · {groupCoverage.partyBuffs.length}</span>
                <BuffIcons
                  buffs={groupCoverage.partyBuffs}
                  emptyLabel={groupCoverage.filled === 0 ? 'Empty group' : 'None from this group'}
                />
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
