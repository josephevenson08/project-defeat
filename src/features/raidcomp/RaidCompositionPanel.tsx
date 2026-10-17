import { useEffect, useMemo, useState } from 'react'
import type { Buff } from '../../domain/buffs/buffTypes'
import { getClassColor } from '../../domain/character/classColors'
import {
  PARTY_SIZE,
  RAID_SIZES,
  addToGroup,
  clearSeat,
  computeCoverage,
  emptyRoster,
  filledSlots,
  getBuffIcon,
  getRaidBuild,
  lackingPartyBuffs,
  moveSeat,
  partyBuffCount,
  raidBuildsByClass,
  renameSeat,
  seatAt,
  seatContributions,
  setRosterMeta,
  resizeRoster,
} from '../../domain/raidcomp'
import type { RaidBuild, Roster, RosterSlot, SeatRef } from '../../domain/raidcomp'
import type { RaidPlayerSize } from '../../domain/raids/raidTypes'
import { exampleRaid } from '../../domain/raids/exampleRaids'
import { describeProvider } from '../../domain/buffs/buffTypes'
import { anniversaryRaidWide, castOnAnyGroup, isPartyScoped } from '../../domain/buffs/buffScope'
import { sampleBuffs } from '../../domain/buffs/sampleBuffs'
import { describeStats } from '../../domain/stats/describeStats'
import { downloadRosterImage } from './exportRosterImage'
import { MissingList, OneMoreSeat, RaidCoverage, ReachTag, RoleBalance } from './RaidAdvice'
import { article, buildName, iconUrl, inWords } from './raidcompFormat'
import { loadRoster, saveRoster } from './rosterStorage'

/**
 * Raid Composition, as decided on 2026-10-07/08 and ported in step 5 of docs/design/PORT-PLAN.md: the
 * planning table (`docs/design/prototypes/tabs/raid-composition.html`), dark, with a click-to-fill
 * palette, aiming at a group, a pencil for names, Undo after anything that removes people, and the
 * example roster; then what it adds up to (`RaidAdvice.tsx`).
 *
 * **Built around groups because in TBC composition *is* group assignment.** Most raid buffs reach only
 * the caster's group — every totem, every aura, both Warrior shouts — so which group the Shaman sits in
 * decides who actually receives Strength of Earth. The first version treated everything as raid-wide
 * and told a raid leader Battle Shout was covered when five of twenty-five players had it.
 */

/** For the hero, and computed so it cannot go stale the way the hard-coded "24 of the 33" did. */
const PARTY_ONLY_COUNT = sampleBuffs.filter((buff) => isPartyScoped(buff.id)).length
const ANY_GROUP_NAMES = sampleBuffs.filter((buff) => castOnAnyGroup(buff.id)).map((buff) => buff.name)
const RAID_WIDE_HERE = sampleBuffs.filter((buff) => buff.id in anniversaryRaidWide).map((buff) => buff.name)

/*
 * There used to be a "usually 2-3 tanks, 5-7 healers" band here, in amber when a roster fell outside
 * it. Removed by request, and it was the right call: the range varies by fight far more than one
 * static band can express, so it read as the app second-guessing a raid leader who knows their
 * roster better than it does. The counts stay; the opinion goes.
 */

/**
 * How a seat is named in labels and messages: the player's own name when the seat has one, because that
 * is what a raid leader is thinking about, and the spec and class when it does not.
 */
function describeSeat(slot: RosterSlot): string {
  return slot.playerName ?? `${slot.spec} ${slot.className}`
}

/**
 * The build a seat represents. Falls back to the first build of that spec when a seat carries no
 * `buildId` — every seat saved before builds existed, and every spec that only has one build anyway.
 */
function buildForSlot(slot: RosterSlot): RaidBuild | undefined {
  if (slot.buildId) return getRaidBuild(slot.buildId)
  return raidBuildsByClass.find((entry) => entry.className === slot.className)?.builds.find((build) => build.spec === slot.spec)
}

const where = (ref: SeatRef) => `group ${ref.groupIndex + 1}, seat ${ref.seatIndex + 1}`

/**
 * A seat's two lines: the player's name over their build, or the build over its role. Shared by the
 * seat and by the move destination button, which has to show the same thing: a raid leader choosing
 * where to put someone is reading the chart while they choose.
 */
function SeatIdentity({ slot }: { slot: RosterSlot }) {
  const build = buildForSlot(slot)
  const name = `${build?.label ?? slot.spec} ${slot.className}`

  return slot.playerName ? (
    <>
      <span className="raidcomp-seat-player">{slot.playerName}</span>
      <span className="raidcomp-seat-spec" style={{ color: getClassColor(slot.className) }}>
        {name}
        {build && <span className="raidcomp-seat-role"> · {build.role}</span>}
      </span>
    </>
  ) : (
    <>
      <span className="raidcomp-seat-name" style={{ color: getClassColor(slot.className) }}>
        {name}
      </span>
      {build && <span className="raidcomp-seat-role">{build.role}</span>}
    </>
  )
}

/** The reader's own zone, which is the right default for the person filling the chart in. */
const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/**
 * Every IANA zone the browser knows, with the local one guaranteed present. `supportedValuesOf` is not
 * universal, so the fallback is the local zone plus UTC rather than a hand-written list of "common"
 * zones — a short list is wrong for exactly the people it excludes.
 */
const TIMEZONES: readonly string[] = (() => {
  const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return [...new Set([LOCAL_TIMEZONE, 'UTC', ...supported])].sort()
})()

/**
 * What one seated player brings, revealed on hover or keyboard focus.
 *
 * The group row under each party shows **party-scoped buffs only**, which is the point of the layout —
 * but it means a Druid's Faerie Fire is invisible there, because a debuff on the boss is not something
 * group 1 "receives". So the per-seat answer lives on the seat, split by reach rather than merged.
 */
function SeatContributionCard({ slot }: { slot: RosterSlot }) {
  const contributions = seatContributions(slot)
  const sections: readonly [string, readonly { id: string; name: string }[]][] = [
    ['Party', contributions.party],
    ['Raid-wide', contributions.raidWide],
    ['Debuffs', contributions.debuffs],
  ]

  const total = contributions.party.length + contributions.raidWide.length + contributions.debuffs.length
  if (total === 0) return null

  return (
    <div className="raidcomp-seat-card" role="tooltip">
      {sections.map(([label, entries]) =>
        entries.length === 0 ? null : (
          <div key={label} className="raidcomp-seat-card-group">
            <span className="raidcomp-seat-card-label">{label}</span>
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <img src={iconUrl(getBuffIcon(entry.id))} alt="" loading="lazy" />
                  {entry.name}
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}

/**
 * What one buff actually is, on hover or keyboard focus. The effect is **derived from the same fields
 * the stat totals read**, not written again here, so the card cannot describe something the planner is
 * not applying; a buff whose value this app cannot express says so in its own words instead.
 */
function BuffCard({ buff }: { buff: Buff }) {
  /*
   * Flat stats only, and that is not an omission: the one buff whose whole value is a multiplier,
   * Greater Blessing of Kings, is raid-scoped, so it never appears in this row. A test asserts no
   * party-scoped buff carries `statMultipliers`, so if that changes the gap fails rather than hiding.
   */
  const effect = describeStats(buff.stats)

  return (
    <div className="raidcomp-buff-card" role="tooltip">
      <span className="raidcomp-buff-card-name">{buff.name}</span>
      <span className="raidcomp-buff-card-source">{describeProvider(buff)}</span>
      {effect && <span className="raidcomp-buff-card-effect">{effect}</span>}
      {buff.notModelled && <span className="raidcomp-buff-card-unmodelled">{buff.notModelled}</span>}
    </div>
  )
}

/** Wowhead shows granted buffs as a row of icons; hovering or focusing one says what it is. */
function BuffIcons({ buffs, emptyLabel }: { buffs: readonly Buff[]; emptyLabel: string }) {
  if (buffs.length === 0) return <span className="raidcomp-group-buffs-none">{emptyLabel}</span>

  return (
    <ul className="raidcomp-buff-icons">
      {buffs.map((buff) => (
        // `tabIndex` so the card is reachable without a mouse: the CSS reveals it on `:focus-within`.
        <li key={buff.id} tabIndex={0} data-testid={`raidcomp-buff-${buff.id}`}>
          <img src={iconUrl(getBuffIcon(buff.id))} alt={buff.name} loading="lazy" decoding="async" />
          <BuffCard buff={buff} />
        </li>
      ))}
    </ul>
  )
}

/** How many of the party buffs a group receives, as the ring the decided design draws round its number. */
function CoverageRing({ seated, received }: { seated: number; received: number }) {
  const circumference = 2 * Math.PI * 14
  return (
    <svg className="raidcomp-ring" viewBox="0 0 34 34" aria-hidden="true">
      <circle className="raidcomp-ring-bg" cx="17" cy="17" r="14" />
      <circle
        className="raidcomp-ring-fg"
        cx="17"
        cy="17"
        r="14"
        strokeDasharray={circumference.toFixed(2)}
        strokeDashoffset={(circumference * (1 - received / partyBuffCount)).toFixed(2)}
      />
      <text x="17" y="17">
        {seated}
      </text>
    </svg>
  )
}

/** Our own pencil, drawn here rather than taken from an icon font. */
const PENCIL = (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M11.2 2.3l2.5 2.5-7.9 7.9-3.2.7.7-3.2z M9.8 3.7l2.5 2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

type Status = { text: string; undo?: Roster }

export function RaidCompositionPanel() {
  const [roster, setRoster] = useState<Roster>(() => loadRoster() ?? emptyRoster(25))
  /** The group the palette fills next, when the reader pressed one; otherwise it fills in order. */
  const [aim, setAim] = useState<number | undefined>()
  /** The seat currently being dragged. Held in state so the drop target can style itself. */
  const [dragging, setDragging] = useState<SeatRef | undefined>()
  /**
   * The seat picked up by the **Move** button, waiting for somewhere to go.
   *
   * **Drag is not enough, and on a phone it is nothing at all.** HTML5 drag-and-drop is driven by mouse
   * events, which touch browsers do not synthesise, and the keyboard had the same problem. So moving is
   * a two-step *pick up, then place*: one press arms this, the next press on any seat lands the player
   * there. The drag stays for the mouse users who already reach for it.
   */
  const [moving, setMoving] = useState<SeatRef | undefined>()
  /** Which seat has its name field open. One at a time keeps the chart readable. */
  const [naming, setNaming] = useState<SeatRef | undefined>()
  /** The in-progress name, controlled so a re-render while the field is open cannot discard it. */
  const [draftName, setDraftName] = useState('')
  /** The last change, said in a line, with the roster to go back to when it removed people. */
  const [status, setStatus] = useState<Status | undefined>()

  const report = useMemo(() => computeCoverage(roster), [roster])

  useEffect(() => {
    saveRoster(roster)
  }, [roster])

  /*
   * Escape puts the player back down. Bound to the window rather than to the seats, because arming a
   * move moves focus onto the destination buttons and there is no one element reliably focused when a
   * raid leader changes their mind.
   */
  useEffect(() => {
    if (!moving) return
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoving(undefined)
    }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [moving])

  const firstGroupWithRoom = roster.groups.findIndex((group) => group.includes(undefined))
  const targetGroup = aim !== undefined && roster.groups[aim]?.includes(undefined) ? aim : firstGroupWithRoom
  const targetSeat = targetGroup === -1 ? -1 : roster.groups[targetGroup].indexOf(undefined)
  const title = `${roster.size}-player raid`

  /**
   * Every change to the seating goes through here: the example becomes "edited" unless the change
   * keeps it as it is (a name, the example itself), anything held is put down, and the line under the
   * table says what happened, with Undo when people were removed.
   */
  function commit(next: Roster, text: string, { undoable = false, keepExample = false } = {}) {
    setRoster(next.example === 'loaded' && !keepExample ? { ...next, example: 'edited' } : next)
    setMoving(undefined)
    setStatus({ text, undo: undoable ? roster : undefined })
  }

  /** "Group 2 now receives 7 of 18 party buffs." */
  const receivesLine = (next: Roster, groupIndex: number) =>
    `Group ${groupIndex + 1} now receives ${partyBuffCount - lackingPartyBuffs(next.groups[groupIndex]).length} of ${partyBuffCount} party buffs.`

  function seatBuild(groupIndex: number, build: RaidBuild) {
    const seatIndex = roster.groups[groupIndex]?.indexOf(undefined) ?? -1
    if (seatIndex === -1) return
    const next = addToGroup(roster, groupIndex, { className: build.className, spec: build.spec, buildId: build.id })
    const full = !next.groups.some((group) => group.includes(undefined))
    commit(
      next,
      `Seated ${article(buildName(build)).toLowerCase()} ${buildName(build)} in ${where({ groupIndex, seatIndex })}. ${receivesLine(next, groupIndex)}${full ? ' The raid is full.' : ''}`,
    )
  }

  function moveTo(from: SeatRef, to: SeatRef) {
    const held = seatAt(roster, from)
    const there = seatAt(roster, to)
    if (!held || (from.groupIndex === to.groupIndex && from.seatIndex === to.seatIndex)) {
      setMoving(undefined)
      return
    }
    const next = moveSeat(roster, from, to)
    const counts =
      from.groupIndex === to.groupIndex
        ? ` Group ${to.groupIndex + 1} still receives the same party buffs.`
        : ` ${receivesLine(next, to.groupIndex)} ${receivesLine(next, from.groupIndex)}`
    commit(
      next,
      (there
        ? `${describeSeat(held)} (now group ${to.groupIndex + 1}) and ${describeSeat(there)} (now group ${from.groupIndex + 1}) swapped.`
        : `${describeSeat(held)} moved to ${where(to)}.`) + counts,
    )
  }

  function resize(size: RaidPlayerSize) {
    if (size === roster.size) return
    const dropped = roster.groups.slice(size / PARTY_SIZE).flat().filter(Boolean).length
    if (aim !== undefined && aim >= size / PARTY_SIZE) setAim(undefined)
    commit(
      resizeRoster(roster, size),
      `${size}-player raid: ${size / PARTY_SIZE} groups of five.${
        dropped ? ` ${dropped} ${dropped === 1 ? 'player' : 'players'} in groups 3 to 5 ${dropped === 1 ? 'was' : 'were'} removed.` : ''
      }`,
      { undoable: dropped > 0 },
    )
  }

  function loadExample() {
    const had = report.filled
    commit(
      { ...exampleRaid(roster.size), ...(roster.meta ? { meta: roster.meta } : {}), example: 'loaded' },
      `Loaded the example ${roster.size}-player roster: real specs, invented seating.`,
      { undoable: had > 0, keepExample: true },
    )
  }

  function clearRaid() {
    const had = report.filled
    commit(
      { ...emptyRoster(roster.size), ...(roster.meta ? { meta: roster.meta } : {}) },
      `Cleared ${had} ${had === 1 ? 'player' : 'players'}. Every seat is empty.`,
      { undoable: true, keepExample: true },
    )
  }

  function undo() {
    if (!status?.undo) return
    setRoster(status.undo)
    setMoving(undefined)
    setStatus({ text: 'Undone. The raid is back as it was.' })
  }

  function saveName(ref: SeatRef, slot: RosterSlot) {
    const name = draftName.trim()
    setNaming(undefined)
    if (name === (slot.playerName ?? '')) return
    commit(
      renameSeat(roster, ref, draftName),
      name ? `Named the ${buildName(buildForSlot(slot)!)} in ${where(ref)} ${name}.` : `Cleared the name in ${where(ref)}.`,
      { keepExample: true },
    )
  }

  const sameSeat = (a: SeatRef | undefined, b: SeatRef) => a !== undefined && a.groupIndex === b.groupIndex && a.seatIndex === b.seatIndex

  /*
   * The player in the air, read back out of the roster rather than copied into state, so renaming or
   * resizing under an armed move cannot leave the labels describing an older version of the seat.
   */
  const movingSlot = moving ? seatAt(roster, moving) : undefined

  const rosterTag =
    report.filled === 0 ? (
      'Empty raid · click a spec below, or load the example'
    ) : roster.example ? (
      <>
        <span className="raidcomp-example-tag">Example</span>{' '}
        {roster.example === 'edited' ? 'roster, edited' : 'roster: invented seating of real specs'} · {report.filled} of {report.size}{' '}
        seated
      </>
    ) : (
      `Your raid · ${report.filled} of ${report.size} seated`
    )

  return (
    <>
      <section className="raidcomp-hero" aria-labelledby="raidcomp-hero-title">
        <p className="eyebrow">Raid Composition · Groups of five</p>
        <h1 id="raidcomp-hero-title">
          Seat your raid so <em>every group gets its buffs</em>.
        </h1>
        <p>
          In TBC, {PARTY_ONLY_COUNT} of the {sampleBuffs.length} raid buffs reach only the caster&apos;s own party: every totem, every aura,
          both shouts. {inWords(ANY_GROUP_NAMES)} can be cast on any group, and {inWords(RAID_WIDE_HERE)} reaches the whole raid on
          Anniversary realms. Click specs to fill the seats, move people between groups, and watch what each group receives.
        </p>
      </section>

      <section className="panel raidcomp" aria-labelledby="raidcomp-table-title" data-testid="raidcomp-panel">
        <header className="raidcomp-head">
          <h2 id="raidcomp-table-title">Raid table</h2>
          <span className="raidcomp-roster-tag" data-testid="raidcomp-roster-tag">
            {rosterTag}
          </span>
        </header>
        {/*
          **The counts say who can cast a buff, not what will be up, and that has to be on the screen.**
          This follows Wowhead's raid-composition model by request, and Wowhead counts a lone Holy
          Paladin as providing all six Greater Blessings. In the game they hold one.
        */}
        <p className="raidcomp-caveat" data-testid="raidcomp-counting-note">
          <strong>Counts are who could cast it, not what will be up at once.</strong> One Paladin lights up every Greater Blessing here and
          holds one in the game; the same goes for a Shaman&apos;s totems and a Warrior&apos;s shouts.
        </p>

        <div className="raidcomp-controls">
          <div className="raidcomp-size" role="group" aria-label="Raid size">
            {RAID_SIZES.map((option) => (
              <button
                key={option}
                type="button"
                className={option === roster.size ? 'is-active' : ''}
                aria-pressed={option === roster.size}
                onClick={() => resize(option)}
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
            <button type="button" className="raidcomp-example" onClick={loadExample} data-testid="raidcomp-example">
              {report.filled > 0 ? 'Reset to example' : 'Load example roster'}
            </button>
            <button type="button" className="raidcomp-clear" onClick={clearRaid} disabled={report.filled === 0} data-testid="raidcomp-clear">
              Clear raid
            </button>
            <button
              type="button"
              className="raidcomp-export"
              // Async: the seat icons are loaded before anything is drawn, because drawImage silently
              // draws nothing for an image that has not finished loading.
              onClick={() => void downloadRosterImage(roster, title)}
              data-testid="raidcomp-export"
            >
              Export image
            </button>
          </div>
        </div>

        {/*
          Everything here is optional and free text. A raid leader wants "SSC — Tuesday" and an invite
          time on the chart they paste into Discord; nobody wants a required form between them and a
          PNG. Folded away, as the decided design has it, since it is for the export alone.
        */}
        <details className="raidcomp-meta-fold">
          <summary>Raid details for the exported chart (optional)</summary>
          <section className="raidcomp-meta" aria-label="Raid details">
            <input
              className="raidcomp-meta-title"
              value={roster.meta?.title ?? ''}
              placeholder={`${roster.size}-player raid`}
              aria-label="Raid title"
              data-testid="raidcomp-meta-title"
              onChange={(event) => setRoster((current) => setRosterMeta(current, 'title', event.target.value))}
            />
            {/* Real pickers: every browser draws its own calendar and clock, correct on a phone for free. */}
            <div className="raidcomp-meta-when">
              <input
                type="date"
                className="raidcomp-meta-date"
                value={roster.meta?.date ?? ''}
                aria-label="Raid date"
                data-testid="raidcomp-meta-date"
                onChange={(event) => setRoster((current) => setRosterMeta(current, 'date', event.target.value))}
              />
              <input
                type="time"
                className="raidcomp-meta-time"
                value={roster.meta?.startTime ?? ''}
                aria-label="Raid start time"
                data-testid="raidcomp-meta-time"
                onChange={(event) => setRoster((current) => setRosterMeta(current, 'startTime', event.target.value))}
              />
              {/* A start time is ambiguous the moment the chart leaves the room; defaulted to the reader's zone. */}
              <select
                className="raidcomp-meta-timezone"
                value={roster.meta?.timezone ?? LOCAL_TIMEZONE}
                aria-label="Raid time zone"
                data-testid="raidcomp-meta-timezone"
                onChange={(event) => setRoster((current) => setRosterMeta(current, 'timezone', event.target.value))}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="raidcomp-meta-description"
              value={roster.meta?.description ?? ''}
              placeholder="Description — loot rules, invites, anything the raid should read"
              aria-label="Raid description"
              data-testid="raidcomp-meta-description"
              onChange={(event) => setRoster((current) => setRosterMeta(current, 'description', event.target.value))}
            />
          </section>
        </details>

        <section className="raidcomp-picker" aria-label="Add a spec">
          <header className="raidcomp-picker-head">
            <h3>
              Add a player · next seat:{' '}
              <span className="raidcomp-target" data-testid="raidcomp-next-seat">
                {targetGroup === -1 ? 'none, the raid is full' : where({ groupIndex: targetGroup, seatIndex: targetSeat })}
              </span>
            </h3>
            <span className="raidcomp-aim">
              {aim !== undefined && targetGroup === aim ? (
                <>
                  Filling group {aim + 1}.{' '}
                  <button type="button" className="raidcomp-unaim" onClick={() => setAim(undefined)}>
                    Fill in order
                  </button>
                </>
              ) : targetGroup === -1 ? (
                'Remove someone, or switch to 25-player, to seat more.'
              ) : (
                `Fills group 1 first, on through group ${roster.groups.length}.`
              )}
            </span>
          </header>
          {/*
            Grouped by class rather than one flat grid of 27: scanning "which Druid do I want" is the actual
            question. The class name carries Blizzard's own colour, which a raid leader already recognises.
          */}
          <div className="raidcomp-classes">
            {raidBuildsByClass.map(({ className, builds }) => (
              <div key={className} className="raidcomp-class">
                <h4 className="raidcomp-class-name" style={{ color: getClassColor(className) }}>
                  {className}
                </h4>
                <div className="raidcomp-class-builds">
                  {builds.map((build) => (
                    <button
                      key={build.id}
                      type="button"
                      className="raidcomp-spec-add"
                      disabled={targetGroup === -1}
                      onClick={() => seatBuild(targetGroup, build)}
                      title={build.note ? `${build.role} · ${build.note}` : build.role}
                      data-testid={`raidcomp-add-${build.id}`}
                      aria-label={`Add ${build.label} ${className}`}
                    >
                      <img src={iconUrl(build.icon)} alt="" loading="lazy" decoding="async" />
                      <span>{build.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="raidcomp-howto">
          Click a spec to seat it in the next open seat, filling group 1 first. Press a group&apos;s name to fill that group instead.{' '}
          <strong>To move a player, press Move on their seat and then the seat you want them in</strong> (a taken seat swaps), or drag them
          there. The pencil names a player. Esc cancels.
        </p>

        {/*
          Says what is in the air and how to put it down, for a phone user who cannot see a drag cursor
          and for a screen reader, which hears it because the region is live. Only while a move is armed.
        */}
        {movingSlot && (
          <p className="raidcomp-moving" role="status" data-testid="raidcomp-moving">
            Moving <strong>{describeSeat(movingSlot)}</strong> — choose their seat, or press Escape to leave them where they are.
          </p>
        )}

        <section className={`raidcomp-groups raidcomp-groups-${roster.groups.length}`} aria-label="Groups">
          {report.groups.map((groupCoverage) => {
            const groupIndex = groupCoverage.groupIndex
            const group = roster.groups[groupIndex]
            const isTarget = groupIndex === targetGroup

            return (
              <div
                key={groupIndex}
                className={`raidcomp-group${isTarget ? ' is-target' : ''}${aim === groupIndex ? ' is-aimed' : ''}`}
                data-testid={`raidcomp-group-${groupIndex + 1}`}
              >
                <header className="raidcomp-group-top">
                  <CoverageRing seated={groupCoverage.filled} received={groupCoverage.partyBuffs.length} />
                  <div>
                    <h3>
                      <button
                        type="button"
                        className="raidcomp-group-head"
                        onClick={() => setAim(aim === groupIndex ? undefined : groupIndex)}
                        aria-pressed={aim === groupIndex}
                        aria-label={`Group ${groupIndex + 1}: fill this group next`}
                      >
                        Group {groupIndex + 1}
                      </button>
                    </h3>
                    <small className="raidcomp-group-count">
                      {groupCoverage.filled} of {PARTY_SIZE} seated · {groupCoverage.partyBuffs.length} of {partyBuffCount} party buffs
                    </small>
                  </div>
                </header>

                <ol className="raidcomp-seats">
                  {group.map((slot, seatIndex) => {
                    const ref: SeatRef = { groupIndex, seatIndex }
                    const isNaming = sameSeat(naming, ref)
                    const build = slot ? buildForSlot(slot) : undefined

                    return (
                      <li
                        key={seatIndex}
                        className={`raidcomp-seat${slot ? ' is-filled' : ''}${sameSeat(dragging, ref) ? ' is-dragging' : ''}${sameSeat(moving, ref) ? ' is-moving' : ''}${
                          isTarget && seatIndex === targetSeat ? ' is-next' : ''
                        }`}
                        /*
                         * Every seat is a drop target, empty ones included, and `moveSeat` swaps when the
                         * destination is taken, so a drop never silently deletes anybody.
                         */
                        onDragOver={(event) => {
                          if (dragging) event.preventDefault()
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          if (dragging) moveTo(dragging, ref)
                          setDragging(undefined)
                        }}
                      >
                        {/*
                          While a move is armed every other seat becomes one button covering the whole
                          seat, rather than an overlay on the controls already there: one 44px target per
                          seat, and no nested interactive elements.
                        */}
                        {movingSlot && moving && !sameSeat(moving, ref) ? (
                          <button
                            type="button"
                            className="raidcomp-seat-place"
                            onClick={() => moveTo(moving, ref)}
                            aria-label={
                              slot
                                ? `Swap ${describeSeat(movingSlot)} with ${describeSeat(slot)} in group ${groupIndex + 1}, seat ${seatIndex + 1}`
                                : `Move ${describeSeat(movingSlot)} to group ${groupIndex + 1}, seat ${seatIndex + 1}`
                            }
                            data-testid={`raidcomp-place-${groupIndex + 1}-${seatIndex + 1}`}
                            data-role={build?.role}
                          >
                            {slot ? (
                              <>
                                <img className="raidcomp-seat-icon" src={iconUrl(build?.icon)} alt="" loading="lazy" />
                                <span className="raidcomp-seat-text raidcomp-seat-ident">
                                  <SeatIdentity slot={slot} />
                                </span>
                              </>
                            ) : (
                              <span className="raidcomp-seat-empty">Open seat</span>
                            )}
                            <span className="raidcomp-seat-here">{slot ? 'Swap here' : 'Move here'}</span>
                          </button>
                        ) : slot ? (
                          <div
                            className="raidcomp-seat-body"
                            draggable={!isNaming}
                            onDragStart={() => setDragging(ref)}
                            onDragEnd={() => setDragging(undefined)}
                            data-role={build?.role}
                          >
                            <img className="raidcomp-seat-icon" src={iconUrl(build?.icon)} alt="" loading="lazy" />

                            <span className="raidcomp-seat-text">
                              {isNaming ? (
                                <input
                                  className="raidcomp-seat-input"
                                  autoFocus
                                  value={draftName}
                                  placeholder="Player name"
                                  aria-label={`Name for ${slot.spec} ${slot.className}`}
                                  data-testid={`raidcomp-name-input-${groupIndex + 1}-${seatIndex + 1}`}
                                  onChange={(event) => setDraftName(event.target.value)}
                                  onBlur={() => saveName(ref, slot)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') saveName(ref, slot)
                                    // Escape abandons the edit, leaving whatever name was already there.
                                    if (event.key === 'Escape') setNaming(undefined)
                                  }}
                                />
                              ) : (
                                <SeatIdentity slot={slot} />
                              )}
                            </span>

                            {!isNaming && (
                              <button
                                type="button"
                                className="raidcomp-seat-label"
                                onClick={() => {
                                  setDraftName(slot.playerName ?? '')
                                  setNaming(ref)
                                }}
                                aria-label={`Name the ${slot.spec} ${slot.className} in group ${groupIndex + 1}`}
                                title={slot.playerName ? 'Rename this player' : 'Name this player'}
                              >
                                {PENCIL}
                              </button>
                            )}

                            <span className="raidcomp-seat-acts">
                              {/*
                                The word rather than an arrow glyph, and it changes to "Cancel" when armed
                                rather than keeping its text under a different `aria-label`: the page tells
                                a raid leader to press "Move", and voice control needs the words to match.
                              */}
                              <button
                                type="button"
                                className="raidcomp-seat-move"
                                aria-pressed={sameSeat(moving, ref)}
                                onClick={() => setMoving(sameSeat(moving, ref) ? undefined : ref)}
                                aria-label={
                                  sameSeat(moving, ref)
                                    ? `Cancel moving ${describeSeat(slot)}`
                                    : `Move ${describeSeat(slot)} out of group ${groupIndex + 1}`
                                }
                                data-testid={`raidcomp-move-${groupIndex + 1}-${seatIndex + 1}`}
                              >
                                {sameSeat(moving, ref) ? 'Cancel' : 'Move'}
                              </button>
                              <button
                                type="button"
                                className="raidcomp-seat-remove"
                                onClick={() =>
                                  // Removing the held player puts the move down with them (commit does).
                                  commit(clearSeat(roster, groupIndex, seatIndex), `Removed ${describeSeat(slot)} from ${where(ref)}.`, {
                                    undoable: true,
                                  })
                                }
                                aria-label={`Remove ${slot.spec} ${slot.className}`}
                              >
                                Remove
                              </button>
                            </span>

                            {/* Revealed by CSS on hover and on keyboard focus within the seat. */}
                            <SeatContributionCard slot={slot} />
                          </div>
                        ) : (
                          <span className="raidcomp-seat-empty">
                            Open seat{isTarget && seatIndex === targetSeat ? <small> · next to fill</small> : null}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ol>

                {/*
                  What this seating buys, as icons, the way Wowhead shows them, with the reach tag the
                  decided design puts on it. Kept out of the exported image: this is the decision surface,
                  the PNG is the result.
                */}
                <div className="raidcomp-group-buffs">
                  <span className="raidcomp-group-buffs-label">
                    Receives {groupCoverage.partyBuffs.length} of {partyBuffCount} <ReachTag reach="Party" />
                  </span>
                  <BuffIcons buffs={groupCoverage.partyBuffs} emptyLabel={groupCoverage.filled === 0 ? 'Empty group' : 'None from this group'} />
                </div>
              </div>
            )
          })}
        </section>
        <p className="raidcomp-plus">
          Every group also gets the {report.raidWide.covered.length} <ReachTag reach="Raid" />, <ReachTag reach="Any group" /> and{' '}
          <ReachTag reach="Single" /> buffs the raid can cast, which do not depend on seating.
        </p>

        <p className="raidcomp-status" role="status" data-testid="raidcomp-status">
          {status?.text}
          {status?.undo && (
            <>
              {' '}
              <button type="button" className="raidcomp-undo" onClick={undo} data-testid="raidcomp-undo">
                Undo
              </button>
            </>
          )}
        </p>
      </section>

      <div className="raidcomp-results">
        <RoleBalance report={report} />
        <OneMoreSeat roster={roster} onSeat={seatBuild} />
        <MissingList roster={roster} filled={filledSlots(roster).length} />
        <RaidCoverage report={report} />
      </div>
    </>
  )
}
