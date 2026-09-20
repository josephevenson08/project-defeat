import { useEffect, useMemo, useState } from 'react'
import type { Buff, TargetDebuff } from '../../domain/buffs/buffTypes'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getClassColor } from '../../domain/character/classColors'
import {
  PARTY_SIZE,
  RAID_SIZES,
  addToGroup,
  clearSeat,
  computeCoverage,
  emptyRoster,
  getBuffIcon,
  getRaidBuild,
  moveSeat,
  raidBuildsByClass,
  renameSeat,
  seatAt,
  seatContributions,
  setRosterMeta,
  resizeRoster,
} from '../../domain/raidcomp'
import type { CoverageSection, RaidBuild, Roster, RosterSlot, SeatRef } from '../../domain/raidcomp'
import { describeProvider } from '../../domain/buffs/buffTypes'
import { describeStats } from '../../domain/stats/describeStats'
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

/*
 * There used to be a "usually 2-3 tanks, 5-7 healers" band here, in amber when a roster fell outside
 * it. Removed by request, and it was the right call: the range varies by fight far more than one
 * static band can express, so it read as the app second-guessing a raid leader who knows their
 * roster better than it does. The counts stay; the opinion goes.
 */

const iconUrl = (name: string | undefined) => (name ? `${import.meta.env.BASE_URL}icons/${name}.jpg` : undefined)

/**
 * How a seat is named in the move controls' labels.
 *
 * The player's own name when the seat has one, because that is what a raid leader is thinking about,
 * and the spec and class when it does not — which is what the rename and remove buttons already say.
 */
function describeSeat(slot: RosterSlot): string {
  return slot.playerName ?? `${slot.spec} ${slot.className}`
}

/**
 * The build a seat represents.
 *
 * Falls back to the first build of that spec when a seat carries no `buildId` — which is every seat
 * saved before builds existed, and every spec that only has one build anyway.
 */
function buildForSlot(slot: RosterSlot): RaidBuild | undefined {
  if (slot.buildId) return getRaidBuild(slot.buildId)
  return raidBuildsByClass
    .find((entry) => entry.className === slot.className)
    ?.builds.find((build) => build.spec === slot.spec)
}

/**
 * A seat's two lines of text — the player's name over their build, or just the build.
 *
 * Shared by the seat's own rename button and by the move destination button, which has to show the
 * same thing: a raid leader choosing where to put someone is reading the chart while they choose, so
 * the seats cannot go blank the moment a move is armed.
 */
function SeatIdentity({ slot }: { slot: RosterSlot }) {
  const build = `${buildForSlot(slot)?.label ?? slot.spec} ${slot.className}`

  if (!slot.playerName) {
    return (
      <span className="raidcomp-seat-name" style={{ color: getClassColor(slot.className) }}>
        {build}
      </span>
    )
  }

  return (
    <>
      <span className="raidcomp-seat-player">{slot.playerName}</span>
      <span className="raidcomp-seat-spec" style={{ color: getClassColor(slot.className) }}>
        {build}
      </span>
    </>
  )
}

/** The reader's own zone, which is the right default for the person filling the chart in. */
const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/**
 * Every IANA zone the browser knows, with the local one guaranteed present.
 *
 * `supportedValuesOf` is not universal, so the fallback is the local zone plus UTC rather than a
 * hand-written list of "common" zones — a short list is wrong for exactly the people it excludes,
 * and a raid roster crosses time zones by nature.
 */
const TIMEZONES: readonly string[] = (() => {
  const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return [...new Set([LOCAL_TIMEZONE, 'UTC', ...supported])].sort()
})()

/*
 * `assignableGroupsFor` lived here and drove a picker per seat — which Blessing this Paladin holds,
 * which totem this Shaman drops. It went on 2026-09-12 with the exclusivity capping that made the
 * choice necessary; there is nothing to assign when nothing is capped. See `buffCoverage.sectionFor`.
 */

/**
 * What one seated player brings, revealed on hover or keyboard focus.
 *
 * The group row underneath each party shows **party-scoped buffs only**, which is correct and is the
 * whole point of the layout — but it means a Druid's Faerie Fire is invisible there, because a debuff
 * on the boss is not something group 1 "receives". That reads as a missing buff exactly when you are
 * checking whether your Druid brought it.
 *
 * So the per-seat answer lives on the seat. Split by reach rather than merged, so the distinction the
 * planner is built on survives being answered.
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
 * What one buff actually is, on hover or keyboard focus.
 *
 * The row under each group was a wall of unlabelled icons with the name in a `title` — which is the
 * browser's tooltip, appears after a delay, cannot be reached by keyboard, and says the name and
 * nothing else. "Which of these is the one I care about" was unanswerable without knowing the
 * artwork already.
 *
 * The effect is **derived from the same fields the stat totals read**, not written again here, so the
 * card cannot describe something the planner is not applying. A buff whose value this app cannot
 * express as a stat change says so in its own words instead — 15 of the 33 are like that, and
 * Bloodlust reading "not modelled" is more use than Bloodlust reading nothing.
 */
function BuffCard({ buff }: { buff: Buff }) {
  /*
   * Flat stats only, and that is not an omission. The one buff in TBC whose whole value is a
   * *multiplier* — Greater Blessing of Kings, +10% to every attribute — is raid-scoped, so it never
   * appears in this row: the row shows what a **party** receives. A percentage describer was written
   * here first and could not fire, which is the "module nothing renders" this repo has shipped three
   * times before.
   *
   * A test asserts no party-scoped buff carries `statMultipliers`, so if that ever changes the gap
   * fails rather than quietly showing a buff with no effect line.
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

/** Wowhead shows granted buffs as a row of icons; hovering one says what it is. */
function BuffIcons({ buffs, emptyLabel }: { buffs: readonly Buff[]; emptyLabel: string }) {
  if (buffs.length === 0) return <span className="raidcomp-group-buffs-none">{emptyLabel}</span>

  return (
    <ul className="raidcomp-buff-icons">
      {buffs.map((buff) => (
        /*
         * `tabIndex` so the card is reachable without a mouse: the CSS reveals it on `:focus-within`
         * exactly as the seat card does, and an icon row nobody can tab through is a row of secrets.
         */
        <li key={buff.id} tabIndex={0} data-testid={`raidcomp-buff-${buff.id}`}>
          <img src={iconUrl(getBuffIcon(buff.id))} alt={buff.name} loading="lazy" decoding="async" />
          <BuffCard buff={buff} />
        </li>
      ))}
    </ul>
  )
}

/**
 * The checklist: every buff and debuff in the game, with how many seats bring it.
 *
 * Modelled on Wowhead's own layout — a dense multi-column list where the *count* leads, because the
 * question a raid leader is scanning for is "have I got one, and how many". Covered entries carry
 * their provider count in class colour; missing ones are dimmed with a zero, so absence reads as a
 * gap in a list rather than as a separate section you have to cross-reference.
 *
 * The earlier version split covered and missing into two stacks per category, which meant checking
 * one buff involved finding which of six lists it was in.
 */
function BuffChecklist<T extends Buff | TargetDebuff>({
  section,
  label,
}: {
  section: CoverageSection<T>
  label: string
}) {
  const total = section.covered.length + section.missing.length
  const testLabel = label.toLowerCase().replace(/[^a-z]+/g, '-')

  /* One list, sorted so what you have comes first and what you are missing is not buried. */
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
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RaidCompositionPanel() {
  const [roster, setRoster] = useState<Roster>(() => loadRoster() ?? emptyRoster(25))
  const [selectedGroup, setSelectedGroup] = useState(0)
  /** The seat currently being dragged. Held in state so the drop target can style itself. */
  const [dragging, setDragging] = useState<SeatRef | undefined>()
  /**
   * The seat picked up by the **Move** button, waiting for somewhere to go.
   *
   * **Drag is not enough, and on a phone it is nothing at all.** HTML5 drag-and-drop is driven by
   * mouse events; touch browsers do not synthesise them, so `dragstart` never fires from a finger and
   * a seated player could not be moved on a phone. The keyboard had the same problem for the same
   * reason — nothing here was reachable without a pointer, which is WCAG 2.1.1 outright.
   *
   * So moving is a two-step *pick up, then place* instead: one press arms this, the next press on any
   * seat lands the player there. A tap, a click and Enter all do it, and the existing drag is left in
   * place for the mouse users who already reach for it.
   */
  const [moving, setMoving] = useState<SeatRef | undefined>()
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

  /*
   * Escape puts the player back down. Bound to the window rather than to the seats, because arming a
   * move moves focus onto the destination buttons and there is no one element that is reliably
   * focused when a raid leader changes their mind.
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
  const targetGroup = roster.groups[selectedGroup]?.includes(undefined) ? selectedGroup : firstGroupWithRoom

  const title = `${roster.size}-player raid`

  const place = (build: RaidBuild) => {
    if (targetGroup === -1) return
    setRoster((current) =>
      addToGroup(current, targetGroup, { className: build.className, spec: build.spec, buildId: build.id }),
    )
  }

  const sameSeat = (a: SeatRef | undefined, b: SeatRef) =>
    a !== undefined && a.groupIndex === b.groupIndex && a.seatIndex === b.seatIndex

  /*
   * The player in the air, read back out of the roster rather than copied into state — so that
   * renaming or resizing under an armed move cannot leave the labels describing an older version of
   * the seat. It also reads `undefined` if the held seat stopped existing, which is what the resize
   * button relies on.
   */
  const movingSlot = moving ? seatAt(roster, moving) : undefined

  const placeInto = (destination: SeatRef) => {
    if (moving) setRoster((current) => moveSeat(current, moving, destination))
    setMoving(undefined)
  }

  return (
    <div className="panel raidcomp" data-testid="raidcomp-panel">
      <header className="panel-head">
        <h2>Raid Composition</h2>
        <p className="panel-copy">
          Seat a raid and see what each group receives. <strong>24 of the 33 raid buffs are party-scoped
          in TBC</strong> — totems, auras and shouts reach only the caster's group of five — so where
          someone sits matters as much as whether they are in the raid.{' '}
          <strong>To move a player, press Move on their seat and then the seat you want them in</strong>
          {' '}— or drag them there. Click a name to label the seat.
        </p>
        {/*
          **The counts say who can cast a buff, not what will be up, and that has to be on the screen.**

          This screen follows Wowhead's raid-composition model by request, and Wowhead counts a lone
          Holy Paladin as providing all six Greater Blessings. In the game they hold one. Saying so
          costs a sentence and stops the tool quietly telling a thin roster it is covered — which is
          this project's whole standard for anything it cannot model exactly.
        */}
        <p className="panel-copy raidcomp-caveat" data-testid="raidcomp-counting-note">
          Counts are <strong>who could cast it</strong>, not what will be up at once. One Paladin lights
          up every Greater Blessing here and holds one in the game; the same goes for a Shaman's totems
          and a Warrior's shouts.
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
              onClick={() => {
                // A 25 → 10 resize can delete the seat a move is holding, so put the player down first.
                setMoving(undefined)
                setRoster((current) => resizeRoster(current, option))
              }}
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
            // Async now: the seat icons are loaded before anything is drawn, because drawImage
            // silently draws nothing for an image that has not finished loading.
            onClick={() => void downloadRosterImage(roster, title)}
            data-testid="raidcomp-export"
          >
            Export image
          </button>
          {report.filled > 0 && (
            <button
              type="button"
              className="raidcomp-clear"
              onClick={() => {
                setMoving(undefined)
                setRoster(emptyRoster(roster.size))
                clearStoredRoster()
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/*
        Everything here is optional and free text. A raid leader wants "SSC — Tuesday" and an invite
        time on the chart they paste into Discord; nobody wants a required form between them and a
        PNG. The field sizes mirror the exported image's type scale — title largest, when it is next,
        description smallest — so what you type looks like what you get.
      */}
      <section className="raidcomp-meta" aria-label="Raid details">
        <input
          className="raidcomp-meta-title"
          value={roster.meta?.title ?? ''}
          placeholder={`${roster.size}-player raid`}
          aria-label="Raid title"
          data-testid="raidcomp-meta-title"
          onChange={(event) => setRoster((current) => setRosterMeta(current, 'title', event.target.value))}
        />
        {/*
          Real pickers rather than free text. Every browser draws its own calendar and clock for these,
          which is both more familiar than anything built here and correct on a phone without any
          extra work.
        */}
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
          {/*
            A start time is ambiguous the moment the chart leaves the room, which is what exporting a
            PNG is for. Defaulted to the reader's own zone rather than asked for — right nearly always,
            and visibly wrong when it is not.
          */}
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

      <section className="raidcomp-roles" aria-label="Role balance">
        {ROLE_ORDER.map((role) => (
          <div key={role} className="raidcomp-role" data-testid={`raidcomp-role-${role.replace(/\s+/g, '-').toLowerCase()}`}>
            <span className="raidcomp-role-count">{report.roleCounts[role]}</span>
            <span className="raidcomp-role-label">{role}</span>
          </div>
        ))}
      </section>

      <section className="raidcomp-picker" aria-label="Add a spec">
        <h3>
          Add to <span className="raidcomp-target">Group {targetGroup === -1 ? '—' : targetGroup + 1}</span>
        </h3>
        {/*
          Grouped by class rather than one flat grid of 27. Scanning "which Druid do I want" is the
          actual question, and a single alphabetical wall made you read every entry to answer it. The
          class name carries Blizzard's own colour for the same reason — it is what a raid leader
          already recognises.
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
                    onClick={() => place(build)}
                    title={build.note}
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

      {/*
        Says what is in the air and how to put it down, for everyone at once: a phone user who cannot
        see a drag cursor, and a screen reader, which hears it because the region is live. Rendered
        only while a move is armed, so it is never a standing instruction nobody needs.
      */}
      {movingSlot && (
        <p className="raidcomp-moving" role="status" data-testid="raidcomp-moving">
          Moving <strong>{describeSeat(movingSlot)}</strong> — choose their seat, or press Escape to
          leave them where they are.
        </p>
      )}

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
                      className={`raidcomp-seat${slot ? ' is-filled' : ''}${sameSeat(dragging, ref) ? ' is-dragging' : ''}${sameSeat(moving, ref) ? ' is-moving' : ''}`}
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
                      {/*
                        While a move is armed every other seat becomes one button covering the whole
                        row, rather than an overlay on top of the controls that are already there.
                        The seat's own name and remove buttons sit 8px apart — the reason the phone
                        pass grew them in place instead of extending them — and a target laid over
                        that pair would take taps meant for either of them. One button per seat also
                        means one 44px target per seat for free, and no nested interactive elements.
                      */}
                      {movingSlot && !sameSeat(moving, ref) ? (
                        <button
                          type="button"
                          className="raidcomp-seat-place"
                          onClick={() => placeInto(ref)}
                          aria-label={
                            slot
                              ? `Swap ${describeSeat(movingSlot)} with ${describeSeat(slot)} in group ${groupCoverage.groupIndex + 1}, seat ${seatIndex + 1}`
                              : `Move ${describeSeat(movingSlot)} to group ${groupCoverage.groupIndex + 1}, seat ${seatIndex + 1}`
                          }
                          data-testid={`raidcomp-place-${groupCoverage.groupIndex + 1}-${seatIndex + 1}`}
                          data-role={slot ? buildForSlot(slot)?.role : undefined}
                        >
                          {slot ? (
                            <>
                              <img
                                className="raidcomp-seat-icon"
                                src={iconUrl(buildForSlot(slot)?.icon)}
                                alt=""
                                loading="lazy"
                              />
                              <span className="raidcomp-seat-text raidcomp-seat-ident">
                                <SeatIdentity slot={slot} />
                              </span>
                            </>
                          ) : (
                            <span className="raidcomp-seat-empty">—</span>
                          )}
                        </button>
                      ) : slot ? (
                        <div
                          className="raidcomp-seat-body"
                          draggable
                          onDragStart={() => setDragging(ref)}
                          onDragEnd={() => setDragging(undefined)}
                          data-role={buildForSlot(slot)?.role}
                        >
                          <img
                            className="raidcomp-seat-icon"
                            src={iconUrl(buildForSlot(slot)?.icon)}
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
                                <SeatIdentity slot={slot} />
                              </button>
                            )}

                          </span>

                          {/*
                            The word rather than an arrow glyph, and it changes to "Cancel" when armed
                            rather than staying put with a different `aria-label`. The panel copy tells
                            a raid leader to press "Move", so that word has to be on the screen — and
                            a button whose accessible name says Cancel while it reads Move breaks
                            WCAG 2.5.3 for anyone driving it by voice.
                          */}
                          <button
                            type="button"
                            className="raidcomp-seat-move"
                            aria-pressed={sameSeat(moving, ref)}
                            onClick={() => setMoving(sameSeat(moving, ref) ? undefined : ref)}
                            aria-label={
                              sameSeat(moving, ref)
                                ? `Cancel moving ${describeSeat(slot)}`
                                : `Move ${describeSeat(slot)} out of group ${groupCoverage.groupIndex + 1}`
                            }
                            data-testid={`raidcomp-move-${groupCoverage.groupIndex + 1}-${seatIndex + 1}`}
                          >
                            {sameSeat(moving, ref) ? 'Cancel' : 'Move'}
                          </button>

                          <button
                            type="button"
                            className="raidcomp-seat-remove"
                            onClick={() => {
                              /*
                               * `moving` is a seat address, not a copy of the player, and the held
                               * seat keeps its × — so removing that player has to put the move down
                               * with them. Otherwise the address outlives them and the next person
                               * to land in that seat is picked up silently, filling the chart with
                               * destinations for somebody nobody chose.
                               */
                              setMoving(undefined)
                              setRoster((current) => clearSeat(current, ref.groupIndex, ref.seatIndex))
                            }}
                            aria-label={`Remove ${slot.spec} ${slot.className}`}
                          >
                            ×
                          </button>

                          {/* Revealed by CSS on hover and on keyboard focus within the seat. */}
                          <SeatContributionCard slot={slot} />
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
        <BuffChecklist section={report.raidWide} label="Raid-wide" />
        <BuffChecklist section={report.partyScoped} label="Party buffs" />
        <BuffChecklist section={report.debuffs} label="Debuffs" />
      </div>

    </div>
  )
}
