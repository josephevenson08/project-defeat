import { useMemo, useState } from 'react'
import { describeProvider } from '../../domain/buffs/buffTypes'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import type { CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { getRoleForSpec, tbcClasses } from '../../domain/character/tbcClasses'
import type { RaidPlayerSize } from '../../domain/raids/raidTypes'
import { RAID_SIZES, computeCoverage, describeSuggestion } from '../../domain/raidcomp'
import type { CoverageSection, RosterSlot } from '../../domain/raidcomp'

/**
 * The raid-composition planner: a roster in, buff and debuff coverage out.
 *
 * **Why this is a section rather than another planner panel.** The planner answers "how good is my
 * character"; this answers "is my raid missing anything", and the person asking is usually not the
 * person being geared. Nothing on this screen is about the character in the rail, so putting it
 * under the planner would have inherited a rail that describes something else — the same mistake
 * the tier lists and raids sections already avoid by having no rail at all.
 *
 * **Every buff counts here, including the fifteen the simulator marks `notModelled`.** That flag
 * means the stat model cannot express the effect; it says nothing about whether the buff matters. To
 * a raid leader Bloodlust is not a rounding error. This is the one surface where that dataset is
 * worth all 33 entries rather than the 18 `calculateStats` can apply, which is most of the reason
 * this feature is cheap: the data was already sourced and already correct.
 */

/** Roles in the order a raid leader counts them, not alphabetical. */
const ROLE_ORDER: readonly CharacterRole[] = ['Tank', 'Healer', 'Physical DPS', 'Caster DPS']

/**
 * Rough shape of a working raid, shown as guidance rather than enforced.
 *
 * Deliberately a *range* and deliberately soft. Real Phase 2 raids run 2-3 tanks and 5-7 healers
 * depending on the fight, and an app that turned that into a red error would be asserting a
 * precision the game does not have. The panel says what is unusual; it never says what is wrong.
 */
const TYPICAL_SHAPE: Record<RaidPlayerSize, Partial<Record<CharacterRole, readonly [number, number]>>> = {
  10: { Tank: [1, 2], Healer: [2, 3] },
  25: { Tank: [2, 3], Healer: [5, 7] },
}

type SpecOption = { className: TbcClass; spec: TbcSpec; role: CharacterRole }

const ALL_SPECS: readonly SpecOption[] = tbcClasses.flatMap((definition) =>
  definition.specs.map((spec) => ({
    className: definition.className,
    spec,
    role: getRoleForSpec(definition.className, spec),
  })),
)

function CoverageList<T extends Buff | TargetDebuff>({
  section,
  label,
}: {
  section: CoverageSection<T>
  label: string
}) {
  const total = section.covered.length + section.missing.length

  return (
    <section className="raidcomp-coverage" aria-label={label}>
      <header className="raidcomp-coverage-head">
        <h3>{label}</h3>
        <span className="raidcomp-coverage-count" data-testid={`raidcomp-${label.toLowerCase()}-count`}>
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
                {/* Redundancy is worth seeing: one Shaman covering ten totems is a single point of failure. */}
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
  const [size, setSize] = useState<RaidPlayerSize>(25)
  const [slots, setSlots] = useState<readonly RosterSlot[]>([])

  const report = useMemo(() => computeCoverage({ size, slots }), [size, slots])

  const addSlot = (className: TbcClass, spec: TbcSpec) => setSlots((current) => [...current, { className, spec }])

  /*
   * Removes the LAST matching seat rather than the first. Seats of the same spec are interchangeable,
   * so which one goes is arbitrary — but taking the most recently added makes add-then-undo behave
   * the way a person expects when they miscount.
   */
  const removeSlot = (className: TbcClass, spec: TbcSpec) =>
    setSlots((current) => {
      const index = current.map((slot) => slot.className === className && slot.spec === spec).lastIndexOf(true)
      return index === -1 ? current : [...current.slice(0, index), ...current.slice(index + 1)]
    })

  const countOf = (className: TbcClass, spec: TbcSpec) =>
    slots.filter((slot) => slot.className === className && slot.spec === spec).length

  const shape = TYPICAL_SHAPE[size]

  return (
    <div className="panel raidcomp" data-testid="raidcomp-panel">
      <header className="panel-head">
        <h2>Raid Composition</h2>
        <p className="panel-copy">
          Build a roster and see which of the {report.buffs.covered.length + report.buffs.missing.length} raid buffs
          and {report.debuffs.covered.length + report.debuffs.missing.length} target debuffs it actually brings. Every
          entry is the same sourced data the Buffs panel uses, each cited to the spell rank it was read from.
        </p>
      </header>

      <div className="raidcomp-controls">
        <div className="raidcomp-size" role="group" aria-label="Raid size">
          {RAID_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              className={option === size ? 'is-active' : ''}
              aria-pressed={option === size}
              onClick={() => setSize(option)}
              data-testid={`raidcomp-size-${option}`}
            >
              {option}-player
            </button>
          ))}
        </div>

        <p className="raidcomp-filled" data-testid="raidcomp-filled">
          <strong>{report.filled}</strong> of {report.size} seats
          {report.remaining < 0 ? ` · ${-report.remaining} over` : report.remaining > 0 ? ` · ${report.remaining} open` : ''}
        </p>

        {slots.length > 0 && (
          <button type="button" className="raidcomp-clear" onClick={() => setSlots([])}>
            Clear roster
          </button>
        )}
      </div>

      <section className="raidcomp-roles" aria-label="Role balance">
        {ROLE_ORDER.map((role) => {
          const band = shape[role]
          const count = report.roleCounts[role]
          // "Unusual" rather than "wrong" — the band is guidance, and only shown where one exists.
          const unusual = band !== undefined && slots.length > 0 && (count < band[0] || count > band[1])
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

      <section className="raidcomp-roster" aria-label="Add specs">
        <h3>Roster</h3>
        <div className="raidcomp-spec-grid">
          {ALL_SPECS.map(({ className, spec }) => {
            const count = countOf(className, spec)
            return (
              <div key={`${className}-${spec}`} className={count > 0 ? 'raidcomp-spec is-picked' : 'raidcomp-spec'}>
                <button
                  type="button"
                  className="raidcomp-spec-add"
                  onClick={() => addSlot(className, spec)}
                  data-testid={`raidcomp-add-${className}-${spec}`.replace(/\s+/g, '-').toLowerCase()}
                  aria-label={`Add ${spec} ${className}`}
                >
                  <span className="raidcomp-spec-name">
                    {spec} {className}
                  </span>
                  {count > 0 && <span className="raidcomp-spec-count">{count}</span>}
                </button>
                {count > 0 && (
                  <button
                    type="button"
                    className="raidcomp-spec-remove"
                    onClick={() => removeSlot(className, spec)}
                    aria-label={`Remove ${spec} ${className}`}
                  >
                    −
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="raidcomp-columns">
        <CoverageList section={report.buffs} label="Buffs" />
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
