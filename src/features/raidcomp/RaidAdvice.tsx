import { useEffect } from 'react'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getClassColor } from '../../domain/character/classColors'
import { sampleBuffs } from '../../domain/buffs/sampleBuffs'
import { sampleTargetDebuffs } from '../../domain/buffs/sampleTargetDebuffs'
import { bestAddition, buffReach, getBuffIcon, partyBuffCount, raidGaps } from '../../domain/raidcomp'
import type { BuffReach, CoverageReport, CoverageSection, RaidBuild, Roster } from '../../domain/raidcomp'
import { article, buildName, iconUrl, inWords } from './raidcompFormat'
import { cue } from '../../lib/motion'

/**
 * What the raid table adds up to (port step 5, the decided Raid Composition design): role balance,
 * what one more seat would add to each group, what is missing and who fixes it, and the raid-wide and
 * boss coverage. All of it reads the same "someone here can cast it" counting as the seats.
 */

const ROLE_ORDER: readonly CharacterRole[] = ['Tank', 'Healer', 'Physical DPS', 'Caster DPS']


const REACH_LABEL: Record<BuffReach, string> = {
  Party: 'Party',
  'Any group': 'Any group',
  Raid: 'Raid',
  Single: 'Single',
  Boss: 'On the boss',
}

/** How far a buff reaches, as a small tag: the distinction the whole screen is built on. */
export function ReachTag({ reach }: { reach: BuffReach }) {
  return <span className={`raidcomp-reach raidcomp-reach-${reach.toLowerCase().replace(/\s+/g, '-')}`}>{REACH_LABEL[reach]}</span>
}

export function RoleBalance({ report }: { report: CoverageReport }) {
  // The bars fill the first time they come into view (port step 7's motion layer).
  useEffect(() => cue({ kind: 'fill', target: '.raidcomp-rolebar-track i' }), [])
  const rows: [string, number, string][] = [
    ...ROLE_ORDER.map((role): [string, number, string] => [role, report.roleCounts[role], `raidcomp-role-${role.replace(/\s+/g, '-').toLowerCase()}`]),
    ['Open seats', report.remaining, 'raidcomp-role-open'],
  ]
  return (
    <section className="panel raidcomp-result" aria-labelledby="raidcomp-roles-title">
      <h2 id="raidcomp-roles-title">
        Role balance{' '}
        <small>
          {report.filled} of {report.size} seated
        </small>
      </h2>
      <ul className="raidcomp-rolebars" aria-label="Role balance">
        {rows.map(([label, count, testId]) => (
          <li key={label} className="raidcomp-rolebar" data-testid={testId}>
            <span>{label}</span>
            <span className="raidcomp-rolebar-track" aria-hidden="true">
              <i style={{ width: `${Math.round((count / report.size) * 100)}%` }} />
            </span>
            <span className="raidcomp-rolebar-count">{count}</span>
          </li>
        ))}
      </ul>
      <p className="raidcomp-small">
        Role comes from the build a seat signed up as, so a Feral (Bear) counts as a tank and a Feral (Cat) as physical DPS. Both bring
        Leader of the Pack.
      </p>
    </section>
  )
}

export function OneMoreSeat({ roster, onSeat }: { roster: Roster; onSeat: (groupIndex: number, build: RaidBuild) => void }) {
  return (
    <section className="panel raidcomp-result" aria-labelledby="raidcomp-add-title" data-testid="raidcomp-one-more">
      <h2 id="raidcomp-add-title">What one more seat would add</h2>
      <p className="raidcomp-small">For each group, the one build that would bring that group the most party buffs it lacks.</p>
      <ul className="raidcomp-lines">
        {roster.groups.map((group, groupIndex) => {
          const suggestion = bestAddition(group)
          if (!suggestion) {
            return (
              <li key={groupIndex} className="is-ok">
                <span className="raidcomp-line-head">Group {groupIndex + 1}</span>
                Already receives every party buff.
              </li>
            )
          }
          const name = buildName(suggestion.build)
          const open = suggestion.openSeat >= 0
          return (
            <li key={groupIndex}>
              <span className="raidcomp-line-head">
                Group {groupIndex + 1} · {open ? 'one more seat' : 'full: if one seat changed'}
              </span>
              {article(name)} <b style={{ color: getClassColor(suggestion.build.className) }}>{name}</b> would add{' '}
              {inWords(suggestion.gains.map((buff) => buff.name))}.
              {open && (
                <button
                  type="button"
                  className="raidcomp-quick"
                  onClick={() => onSeat(groupIndex, suggestion.build)}
                  data-testid={`raidcomp-quick-${groupIndex + 1}`}
                >
                  Seat {article(name).toLowerCase()} {name} in group {groupIndex + 1}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function MissingList({ roster, filled }: { roster: Roster; filled: number }) {
  const gaps = raidGaps(roster)
  return (
    <section className="panel raidcomp-result" aria-labelledby="raidcomp-miss-title" data-testid="raidcomp-missing">
      <h2 id="raidcomp-miss-title">Missing — who fixes it</h2>
      <ul className="raidcomp-lines">
        {filled === 0 ? (
          <li className="is-ok">
            <span className="raidcomp-line-head">Whole raid</span>
            Nobody is seated yet, so every buff is missing. Add a player or load the example roster.
          </li>
        ) : (
          <>
            {gaps.raid.length === 0 ? (
              <li className="is-ok">
                <span className="raidcomp-line-head">Whole raid</span>
                Someone in the raid can cast every one of the {sampleBuffs.length} buffs and {sampleTargetDebuffs.length} debuffs.
              </li>
            ) : (
              gaps.raid.map((gap) => (
                <li key={gap.entry.id} className="is-warn">
                  <span className="raidcomp-line-head">Whole raid</span>
                  <b>{gap.entry.name}</b> <ReachTag reach={gap.reach} />: nobody brings it. Needs {gap.needs}.
                </li>
              ))
            )}
            {gaps.groups.map((group) => (
              <li key={group.groupIndex}>
                <span className="raidcomp-line-head">
                  Group {group.groupIndex + 1} · {group.lacking.length} of {partyBuffCount} party buffs missing
                </span>
                {group.byNeed.map((row, index) => (
                  <span key={row.needs}>
                    {index > 0 && ' · '}
                    <b>{row.needs}</b>: {row.buffs.map((buff) => buff.name).join(', ')}
                  </span>
                ))}
              </li>
            ))}
          </>
        )}
      </ul>
    </section>
  )
}

/**
 * The checklist: every buff and debuff, with how many seats bring it.
 *
 * Modelled on Wowhead's own layout, a dense list where the *count* leads, because the question a raid
 * leader is scanning for is "have I got one, and how many". Covered entries carry their provider count
 * in class colour; missing ones are dimmed with a zero, so absence reads as a gap in a list rather than
 * as a separate section you have to cross-reference. The raid-wide list tags how far each one reaches.
 */
function BuffChecklist<T extends Buff | TargetDebuff>({ section, label, tagReach = false }: { section: CoverageSection<T>; label: string; tagReach?: boolean }) {
  const total = section.covered.length + section.missing.length
  const testLabel = label.toLowerCase().replace(/[^a-z]+/g, '-')
  const rows = [
    ...section.covered.map(({ entry, providedBy }) => ({ entry, count: providedBy, needs: undefined as string | undefined })),
    ...section.missing.map(({ entry, needs }) => ({ entry, count: 0, needs })),
  ]

  return (
    <section className="raidcomp-checklist" aria-label={label}>
      <header className="raidcomp-coverage-head">
        <h3>{label}</h3>
        <span className="raidcomp-coverage-count" data-testid={`raidcomp-${testLabel}-count`}>
          {section.covered.length} / {total}
        </span>
      </header>
      <ul className="raidcomp-checklist-rows">
        {rows.map(({ entry, count, needs }) => (
          <li key={entry.id} className={count > 0 ? 'is-covered' : 'is-missing'} title={needs ? `Needs ${needs}` : undefined}>
            <span className="raidcomp-check-count">{count}</span>
            <img className="raidcomp-row-icon" src={iconUrl(getBuffIcon(entry.id))} alt="" loading="lazy" />
            <span className="raidcomp-check-name" style={{ color: count > 0 ? getClassColor(entry.providedByClass) : undefined }}>
              {entry.name}
              {tagReach && (
                <>
                  {' '}
                  <ReachTag reach={buffReach(entry.id)} />
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RaidCoverage({ report }: { report: CoverageReport }) {
  return (
    <section className="panel raidcomp-result raidcomp-coverage" aria-labelledby="raidcomp-wide-title">
      <h2 id="raidcomp-wide-title">Raid-wide, single-target and on the boss</h2>
      <div className="raidcomp-columns">
        <BuffChecklist section={report.raidWide} label="Raid-wide" tagReach />
        <BuffChecklist section={report.partyScoped} label="Party buffs" />
        <BuffChecklist section={report.debuffs} label="Debuffs" />
      </div>
      <p className="raidcomp-small">
        The number is how many seats could cast it (Wowhead&apos;s count), not how many copies are up. Party buffs here are across the whole
        raid; each group&apos;s own are on the table above.
      </p>
    </section>
  )
}
