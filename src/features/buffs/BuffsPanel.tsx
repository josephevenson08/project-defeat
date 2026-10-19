import { useMemo, useState, type CSSProperties } from 'react'
import { Panel } from '../../components/layout/Panel'
import { FloatingTip } from '../../components/ui/FloatingTip'
import { SpecIcon } from '../../components/ui/SpecIcon'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { describeProvider } from '../../domain/buffs/buffTypes'
import {
  allBuffEntries,
  assignBlessings,
  BLESSING_IDS,
  exclusiveGroupFor,
  giveBlessing,
  isBlessing,
  raidBuffIds,
  raidCoverage,
  raidPaladins,
  reachOf,
  seatIn,
  seatKey,
  seatsWithYou,
  type BuffEntry,
  type RaidCoverage,
  type RaidSeat,
} from '../../domain/buffs/raidBuffs'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getClassColor } from '../../domain/character/classColors'
import type { CharacterRole } from '../../domain/character/characterTypes'
import type { Consumable, ConsumableCategory } from '../../domain/consumables/consumableTypes'
import { getConsumablesForRole } from '../../domain/consumables/sampleConsumables'
import { describeNeed, filledSlots, getBuffIcon, getRaidBuild, raidBuilds, type Roster, type RosterSlot, type SeatRef } from '../../domain/raidcomp'
import { exampleRaid } from '../../domain/raids'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/characterData'
import { loadRoster } from '../raidcomp/rosterStorage'
import { BUFF_SOURCES, type BuffSource, type BuffsSession } from './buffsSession'
import { consumableEffects, entryEffects, REACH_WORDS } from './buffWords'

type BuffsPanelProps = {
  character: CharacterProfile
  activeBuffIds: readonly string[]
  activeConsumableIds: readonly string[]
  activeTargetDebuffIds: readonly string[]
  onSetBuffs: (buffIds: readonly string[], debuffIds: readonly string[]) => void
  onSetConsumables: (consumableIds: readonly string[]) => void
  session: BuffsSession
  onSession: (session: BuffsSession) => void
}

const CATEGORIES: readonly ConsumableCategory[] = ['Flask', 'Battle Elixir', 'Guardian Elixir', 'Food']
const ELIXIRS: readonly ConsumableCategory[] = ['Battle Elixir', 'Guardian Elixir']
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const names = (list: readonly string[]) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : (list[0] ?? ''))
const nameOf = (id: string) => allBuffEntries.find((item) => item.entry.id === id)?.entry.name ?? id
const fitsRole = (item: BuffEntry, role: CharacterRole) => item.kind === 'debuff' || !item.entry.roles || item.entry.roles.includes(role)

/** "you", or "Thrallson, Enhancement Shaman, group 2". */
function seatLabel(seat: RaidSeat) {
  if (seat.you) return 'you'
  const build = seat.slot.buildId ? getRaidBuild(seat.slot.buildId) : undefined
  return `${seat.slot.playerName ? `${seat.slot.playerName}, ` : ''}${build?.label ?? seat.slot.spec} ${seat.slot.className}, group ${seat.ref.groupIndex + 1}`
}

/** "from you", "from Enhancement Shaman, group 2 and 1 more". */
const fromText = (coverage: RaidCoverage) =>
  coverage.by.length ? `from ${seatLabel(coverage.by[0])}${coverage.by.length > 1 ? ` and ${coverage.by.length - 1} more` : ''}` : ''

/** Why a buff does not reach you. */
function missingText(coverage: RaidCoverage) {
  if (coverage.noPaladin === 'unassigned') return 'no Paladin is assigned it'
  if (coverage.noPaladin === 'none') return 'no Paladin in the raid'
  if (coverage.givingInstead?.length) return `whoever could give it is already giving ${names(coverage.givingInstead.map(nameOf))}`
  return coverage.needs?.endsWith('in your group') ? `needs ${coverage.needs}` : `nobody in the raid brings it: needs ${coverage.needs}`
}

/**
 * The Character Planner's Buffs tab (port step 6, 2026-10-19): design C, the buffs filled in from who
 * is in your raid, with design A's icons. Pick the raid (the roster on Raid Composition, an example
 * raid, or just you) and your seat in it; each buff then says who brings it or what it needs, sorted
 * by how far it reaches. The raid's Paladins each give the Blessing you assign. Any buff can still be
 * switched by hand, and "By hand" drops the raid altogether.
 */
export function BuffsPanel({
  character,
  activeBuffIds,
  activeConsumableIds,
  activeTargetDebuffIds,
  onSetBuffs,
  onSetConsumables,
  session,
  onSession,
}: BuffsPanelProps) {
  const [message, setMessage] = useState('')
  const tip = useHoverTip<BuffEntry>()
  const role = getRoleForSpec(character.className, character.spec)
  const you: RosterSlot = useMemo(() => {
    const build =
      raidBuilds.find((entry) => entry.className === character.className && entry.spec === character.spec && entry.role === role) ??
      raidBuilds.find((entry) => entry.className === character.className && entry.spec === character.spec)
    return { className: character.className, spec: character.spec, ...(build ? { buildId: build.id } : {}) }
  }, [character.className, character.spec, role])

  // Read when the tab opens: Raid Composition is another tab, so its roster cannot change while this one is on screen.
  const [saved] = useState(() => {
    const roster = loadRoster()
    return roster && filledSlots(roster).length ? roster : undefined
  })

  const rosterFor = (source: BuffSource): Roster | undefined =>
    source === 'mine'
      ? saved
      : source === 'ex25'
        ? exampleRaid(25)
        : source === 'ex10'
          ? exampleRaid(10)
          : source === 'solo'
            ? { size: 10, groups: [Array.from({ length: 5 }, () => undefined)] }
            : undefined

  /** Everything a raid source decides: your seat, everyone with you in it, the Paladins' Blessings, and who gives you what. */
  const raidFor = (source: BuffSource, seatChoice: SeatRef | undefined, kept: Readonly<Record<string, string | null>>) => {
    const roster = rosterFor(source)
    if (!roster) return undefined
    const seat = seatIn(roster, you, seatChoice)
    const seats = seatsWithYou(roster, seat, you)
    const paladins = raidPaladins(seats)
    const blessings = assignBlessings(paladins, role, kept)
    const coverage = raidCoverage(seats, seat, blessings)
    return { roster, seat, seats, paladins, blessings, coverage }
  }
  const raid = raidFor(session.source, session.seat, session.blessings)

  const shown = allBuffEntries.filter((item) => fitsRole(item, role))
  const counted = shown.filter((item) => !item.entry.notModelled)
  const isOn = (item: BuffEntry) => (item.kind === 'buff' ? activeBuffIds : activeTargetDebuffIds).includes(item.entry.id)

  /** Fills the buffs from a raid: the counted ones that reach you, for your role. Consumables are yours, so they stay. */
  const chooseRaid = (source: BuffSource, seatChoice?: SeatRef, kept: Readonly<Record<string, string | null>> = {}) => {
    const next = raidFor(source, seatChoice, kept)
    onSession({ source, ...(next ? { seat: next.seat } : {}), blessings: next?.blessings ?? {} })
    if (!next) {
      setMessage('By hand: no raid, so switch each buff yourself.')
      return
    }
    const ids = raidBuffIds(next.coverage, role)
    onSetBuffs(ids.buffIds, ids.debuffIds)
    const reach = counted.filter((item) => next.coverage[item.entry.id]?.got).length
    const missing = counted.length - reach
    const sourceName = BUFF_SOURCES.find((entry) => entry.id === source)?.label ?? ''
    setMessage(
      `${sourceName}: you're in group ${next.seat.groupIndex + 1}. ${plural(reach, 'counted buff or debuff', 'counted buffs and debuffs')} reach you; ${missing} ${missing === 1 ? 'is' : 'are'} missing.`,
    )
  }

  const toggle = (item: BuffEntry) => {
    const name = item.entry.name
    if (item.entry.notModelled) {
      setMessage(`${name} isn't counted: ${item.entry.notModelled}`)
      return
    }
    if (raid && isBlessing(item.entry.id)) {
      const giver = raid.paladins.find((paladin) => raid.blessings[seatKey(paladin.ref)] === item.entry.id)
      setMessage(`${name}: ${giver ? `given by ${seatLabel(giver)}` : 'no Paladin gives it'}. Choose who gives which Blessing in the Paladin rows.`)
      return
    }
    const on = isOn(item)
    const flip = (list: readonly string[]) => (on ? list.filter((id) => id !== item.entry.id) : [...list, item.entry.id])
    if (item.kind === 'buff') onSetBuffs(flip(activeBuffIds), activeTargetDebuffIds)
    else onSetBuffs(activeBuffIds, flip(activeTargetDebuffIds))
    setMessage(`${name} ${on ? 'off' : 'on'}${raid ? ' by hand. Choose the raid again to undo your changes.' : '.'}`)
  }

  const bless = (paladin: RaidSeat, blessing: string | null) => {
    if (!raid) return
    const key = seatKey(paladin.ref)
    const { blessings, swappedWith } = giveBlessing(raid.blessings, key, blessing)
    onSession({ ...session, blessings })
    // The Blessings follow the Paladins; every other buff keeps whatever you switched by hand.
    const coverage = raidCoverage(raid.seats, raid.seat, blessings)
    const given = raidBuffIds(coverage, role).buffIds.filter(isBlessing)
    onSetBuffs([...activeBuffIds.filter((id) => !isBlessing(id)), ...given], activeTargetDebuffIds)
    const other = swappedWith ? raid.paladins.find((x) => seatKey(x.ref) === swappedWith) : undefined
    setMessage(
      `${capital(seatLabel(paladin))} ${paladin.you ? 'give' : 'gives'} ${blessing ? nameOf(blessing) : 'no Blessing'}${
        other ? `; ${seatLabel(other)} takes ${raid.blessings[key] ? nameOf(raid.blessings[key] ?? '') : 'nothing'} instead` : ''
      }.`,
    )
  }

  const consumables = getConsumablesForRole(role)
  const setConsumable = (category: ConsumableCategory, consumable: Consumable | undefined) => {
    const inCategory = (id: string) => consumables.find((entry) => entry.id === id)?.category
    const clears = consumable
      ? category === 'Flask'
        ? ELIXIRS
        : ELIXIRS.includes(category)
          ? (['Flask'] as const)
          : []
      : []
    const removed = activeConsumableIds.filter((id) => clears.includes(inCategory(id) as ConsumableCategory))
    const kept = activeConsumableIds.filter((id) => inCategory(id) !== category && !removed.includes(id))
    onSetConsumables(consumable ? [...kept, consumable.id] : kept)
    const removedNames = removed.map((id) => consumables.find((entry) => entry.id === id)?.name ?? id)
    setMessage(
      `${category}: ${consumable?.name ?? 'none'}.${
        removedNames.length
          ? ` Took out ${names(removedNames)}: ${category === 'Flask' ? 'a flask takes both elixir slots' : "an elixir can't go with a flask"}.`
          : ''
      }`,
    )
  }

  const got = (item: BuffEntry) => !!raid?.coverage[item.entry.id]?.got

  const tile = (item: BuffEntry) => {
    const id = item.entry.id
    const out = !!item.entry.notModelled
    const blessing = isBlessing(id)
    const on = isOn(item)
    const coverage = raid?.coverage[id]
    const reached = coverage?.got ?? on
    const byHand = !!raid && !out && !blessing && on !== reached
    const switchable = !out && !(raid && blessing)
    const why = coverage ? (coverage.got ? fromText(coverage) : missingText(coverage)) : ''
    const state = out ? 'not counted' : blessing && raid ? (reached ? 'given' : 'not given') : on ? 'on' : 'off'
    const icon = getBuffIcon(id)
    const testId = out
      ? `${item.kind === 'buff' ? 'buff' : 'target-debuff'}-unmodelled-${id}`
      : `${item.kind === 'buff' ? 'buff' : 'target-debuff'}-toggle-${id}`
    return (
      <button
        key={id}
        type="button"
        className={`buff-tile${out ? ' is-out' : ''}${raid && !reached ? ' is-missing' : ''}${(blessing && raid ? reached : on) ? ' is-on' : ''}`}
        aria-pressed={switchable ? on : undefined}
        aria-label={`${item.entry.name}, ${state}${byHand ? ', by hand' : ''}${why ? `: ${why}` : ''}`}
        style={{ '--cc': getClassColor(item.entry.providedByClass) } as CSSProperties}
        data-testid={testId}
        onClick={() => toggle(item)}
        {...tip.bind(item)}
      >
        <span className="buff-tile-frame" aria-hidden="true">
          {icon && <img src={`${import.meta.env.BASE_URL}icons/${icon}.jpg`} alt="" width={46} height={46} loading="lazy" decoding="async" />}
          <i />
        </span>
        <span className="buff-tile-name" aria-hidden="true">
          {item.entry.name.replace('Greater Blessing of ', '')}
        </span>
        {byHand && (
          <span className="buff-tile-badge" aria-hidden="true">
            by hand
          </span>
        )}
      </button>
    )
  }

  const bar = (items: readonly BuffEntry[], empty: string) =>
    items.length ? (
      <div className="buff-bar" role="group">
        {items.map(tile)}
      </div>
    ) : (
      <p className="buffs-none">{empty}</p>
    )

  const party = (item: BuffEntry) => reachOf(item) === 'Party'
  const boss = (item: BuffEntry) => reachOf(item) === 'Boss'
  const missing = raid ? shown.filter((item) => !got(item)) : []

  return (
    <Panel title="Buffs" eyebrow="Your raid, your buffs" accentColor={getRoleAccentColor(role)} className="buffs-panel-shell">
      <div className="buffs-panel" data-testid="buffs-panel">
        <p className="buffs-lead">
          Your buffs, filled in from who is in your raid: pick the raid and your seat, and each buff says who brings it or what&apos;s
          missing. Paladins each give the Blessing you assign. You can still switch any buff by hand.
        </p>
        <div className="buffs-sources" role="group" aria-label="Where your buffs come from">
          {BUFF_SOURCES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={session.source === id}
              disabled={id === 'mine' && !saved}
              title={id === 'mine' ? (saved ? 'The roster you built on the Raid Composition tab' : 'Build a raid on the Raid Composition tab first') : undefined}
              onClick={() => chooseRaid(id)}
              data-testid={`buffs-source-${id}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="buffs-msg" role="status" data-testid="buffs-message">
          {message}
        </p>

        {raid ? (
          <>
            <div className="buffs-roster" role="group" aria-label="Your raid: press a seat to sit there">
              {raid.seats.map((group, groupIndex) => (
                <div key={groupIndex} className={`buffs-group${groupIndex === raid.seat.groupIndex ? ' is-yours' : ''}`}>
                  <h5>
                    <span>Group {groupIndex + 1}</span>
                    {groupIndex === raid.seat.groupIndex && <span>yours</span>}
                  </h5>
                  <div className="buffs-seats">
                    {group.map((seat, seatIndex) => {
                      const ref = { groupIndex, seatIndex }
                      return (
                        <button
                          key={seatIndex}
                          type="button"
                          className={`buffs-seat${seat?.you ? ' is-you' : ''}${seat ? '' : ' is-empty'}`}
                          aria-label={
                            seat?.you
                              ? `You, ${character.spec} ${character.className}`
                              : seat
                                ? `${capital(seatLabel(seat))}. Sit here`
                                : `Empty seat in group ${groupIndex + 1}. Sit here`
                          }
                          title={seat ? capital(seatLabel(seat)) : 'Empty seat'}
                          data-testid={`buffs-seat-${groupIndex}-${seatIndex}`}
                          onClick={() => chooseRaid(session.source, ref, raid.blessings)}
                        >
                          {seat && (
                            <SpecIcon
                              className={seat.slot.className}
                              spec={seat.slot.spec}
                              icon={seat.slot.buildId ? getRaidBuild(seat.slot.buildId)?.icon : undefined}
                              size={32}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="buffs-note">
              {session.source === 'mine'
                ? `From the roster on the Raid Composition tab${raid.roster.example ? `: the example raid${raid.roster.example === 'edited' ? ', edited' : ''}` : ''}.`
                : session.source === 'solo'
                  ? 'Just you: only what you bring yourself.'
                  : 'Real builds, invented seating: an example. Build your own on the Raid Composition tab.'}
            </p>

            <section className="buffs-section" aria-label="Paladin Blessings">
              <h4>Paladin Blessings</h4>
              {raid.paladins.length ? (
                <ul className="buffs-pals">
                  {raid.paladins.map((paladin, index) => {
                    const key = seatKey(paladin.ref)
                    return (
                      <li key={key}>
                        <span className="buffs-pal-name">{capital(seatLabel(paladin))}</span>
                        <span className="buffs-pal-choices" role="group" aria-label={`Blessing ${seatLabel(paladin)} ${paladin.you ? 'give' : 'gives'}`}>
                          {BLESSING_IDS.map((id) => {
                            const icon = getBuffIcon(id)
                            const out = !!allBuffEntries.find((item) => item.entry.id === id)?.entry.notModelled
                            return (
                              <button
                                key={id}
                                type="button"
                                className={`buffs-pal-choice${out ? ' is-out' : ''}`}
                                aria-pressed={raid.blessings[key] === id}
                                aria-label={`${nameOf(id)}${out ? ', not counted' : ''}`}
                                title={`${nameOf(id)}${out ? ' (not counted)' : ''}`}
                                data-testid={`pal-${index}-${id}`}
                                onClick={() => bless(paladin, id)}
                              >
                                {icon && <img src={`${import.meta.env.BASE_URL}icons/${icon}.jpg`} alt="" width={24} height={24} />}
                                <span>{nameOf(id).replace('Greater Blessing of ', '')}</span>
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            className="buffs-pal-choice is-none"
                            aria-pressed={!raid.blessings[key]}
                            aria-label="No Blessing"
                            data-testid={`pal-${index}-none`}
                            onClick={() => bless(paladin, null)}
                          >
                            None
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="buffs-none">No Paladin in this raid, so no Blessings.</p>
              )}
              <p className="buffs-note">
                Each Paladin gives each class one Greater Blessing, so this is the one they put on {character.className}s. The ones the
                planner does not count for you say so.
              </p>
            </section>

            <div className="buffs-boxes">
              <section className="buffs-box" aria-label="From your group">
                <h4>
                  From your group <small>group {raid.seat.groupIndex + 1}</small>
                </h4>
                {bar(shown.filter((item) => party(item) && got(item)), 'Nobody in your group brings a buff.')}
              </section>
              <section className="buffs-box" aria-label="From the raid">
                <h4>From the raid</h4>
                {bar(shown.filter((item) => !party(item) && !boss(item) && got(item)), 'Nothing from the rest of the raid.')}
              </section>
              <section className="buffs-box" aria-label="On the boss">
                <h4>On the boss</h4>
                {bar(shown.filter((item) => boss(item) && got(item)), 'Nobody puts a debuff on the boss.')}
              </section>
              <section className="buffs-box is-missing" aria-label="Missing" data-testid="buffs-missing">
                <h4>Missing</h4>
                {bar(missing, 'Nothing: every buff here reaches you.')}
                {missing.length > 0 && (
                  <ul className="buffs-needs">
                    {missing.map((item) => (
                      <li key={item.entry.id}>
                        <b>{item.entry.name}</b>: <span>{missingText(raid.coverage[item.entry.id])}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        ) : (
          <>
            <p className="buffs-note">No raid: switch each buff yourself, or fill them from a raid above.</p>
            <div className="buffs-boxes">
              <section className="buffs-box" aria-label="Your group">
                <h4>Your group</h4>
                {bar(shown.filter(party), '')}
              </section>
              <section className="buffs-box" aria-label="The raid">
                <h4>The raid</h4>
                {bar(shown.filter((item) => !party(item) && !boss(item)), '')}
              </section>
              <section className="buffs-box" aria-label="On the boss">
                <h4>On the boss</h4>
                {bar(shown.filter(boss), '')}
              </section>
            </div>
          </>
        )}

        <section className="buffs-section" aria-label="Consumables">
          <h4>Consumables</h4>
          <div className="buffs-cons">
            {CATEGORIES.map((category) => {
              const options = consumables.filter((consumable) => consumable.category === category)
              if (!options.length) return null
              const chosen = options.find((consumable) => activeConsumableIds.includes(consumable.id))
              return (
                <div key={category} className="buffs-cat">
                  <span className="buffs-cat-label">{category}</span>
                  <div className="buffs-chips" role="group" aria-label={category}>
                    <button
                      type="button"
                      className="buffs-chip"
                      aria-pressed={!chosen}
                      onClick={() => setConsumable(category, undefined)}
                      data-testid={`consumable-none-${category.toLowerCase().replace(' ', '-')}`}
                    >
                      None
                    </button>
                    {options.map((consumable) => (
                      <button
                        key={consumable.id}
                        type="button"
                        className="buffs-chip"
                        aria-pressed={chosen?.id === consumable.id}
                        onClick={() => setConsumable(category, consumable)}
                        data-testid={`consumable-toggle-${consumable.id}`}
                      >
                        <b>{consumable.name}</b>
                        <small>{consumableEffects(consumable)}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="buffs-note">A flask takes both elixir slots, so picking one empties the other.</p>
        </section>
      </div>

      {tip.target && (
        <FloatingTip anchor={tip.target.anchor} placement="beside" className="item-tip-box" testId="buff-tip">
          <BuffTip item={tip.target.data} on={isOn(tip.target.data)} coverage={raid?.coverage[tip.target.data.entry.id]} />
        </FloatingTip>
      )}
    </Panel>
  )
}

/** A buff as the game's tooltip, in our own words: how far it reaches and from whom, what it does, and whether it reaches you. */
function BuffTip({ item, on, coverage }: { item: BuffEntry; on: boolean; coverage: RaidCoverage | undefined }) {
  const set = exclusiveGroupFor(item.entry.id)
  const who = describeNeed(item.entry).replace(/^any /, 'a ')
  return (
    <span className="item-tip">
      <b className="item-tip-name">{item.entry.name}</b>
      <span className="item-tip-grey">
        {REACH_WORDS[reachOf(item)]} · from {who}
      </span>
      {item.entry.notModelled ? (
        <span className="item-tip-note">Not counted: {item.entry.notModelled}</span>
      ) : (
        entryEffects(item).map((line) => (
          <span key={line} className="buff-tip-effect">
            {line}
          </span>
        ))
      )}
      {set && (
        <span className="item-tip-grey">
          {set.label}: one per {describeProvider(item.entry).split(' ').at(-1)}
          {set.basis === 'raid convention' ? ', by raid custom' : ''}.
        </span>
      )}
      {coverage && (
        <span className={coverage.got ? 'buff-tip-from' : 'buff-tip-need'}>{capital(coverage.got ? fromText(coverage) : missingText(coverage))}</span>
      )}
      {!item.entry.notModelled && !coverage && <span className="item-tip-where">{on ? 'On' : 'Off'} · counted by the simulator</span>}
    </span>
  )
}
