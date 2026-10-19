import type { CSSProperties, ReactNode } from 'react'
import {
  equipBest,
  raidShortName,
  raidsInOrder,
  whereFrom,
  whereText,
  withGuideEnchant,
  withGuideGems,
  type ChecklistTotals,
  type RankedWhere,
  type SlotCheck,
} from '../../domain/bis'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { hitStanding, type HitCap } from '../../domain/simulation/hitCap'
import type { CharacterProfile } from '../character/characterTypes'
import { enchantLine } from './fittedItemTip'
import type { GearGroup, GearSession } from './gearSession'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { slotGlyph } from './slotGlyphs'

type WhatsLeftProps = {
  character: CharacterProfile
  gear: EquippedGear
  checks: readonly SlotCheck[]
  totals: ChecklistTotals
  hitCap?: HitCap
  gearHit: number
  session: GearSession
  onSession: (session: GearSession) => void
  display: (slot: GearSlot) => string
  /** A one-press fix: the slot as it should be, and what to say about it. */
  onFix: (slot: GearSlot, equipped: EquippedSlot, message: string) => void
  openSlot?: GearSlot
  onOpen: (slot: GearSlot) => void
  /** Each row's Change button, so closing the pane can hand focus back to it. */
  changeRef: (slot: GearSlot, node: HTMLButtonElement | null) => void
  onlyRef: (node: HTMLButtonElement | null) => void
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/** The item a slot is working towards: its upgrade, or what it holds when that is already the best. */
const targetOf = (check: SlotCheck): { item: GearItem; where: RankedWhere; have: boolean } | undefined => {
  if (check.upgrade) return { item: check.upgrade.item, where: whereFrom(check.upgrade.entry, check.upgrade.item), have: false }
  if (check.best && check.item) return { item: check.item, where: whereFrom(check.entry, check.item), have: true }
  return undefined
}

/**
 * "What's left" (design C, the second view of the Gear tab): a summary of where the gear stands, then
 * every slot marked done or with what it still needs (its best item and where it drops, the guide's
 * enchant, empty sockets, a socket bonus off), each with a one-press fix. "Where it drops" regroups
 * the same targets by raid and boss in kill order, for planning raid nights. Change opens the slot
 * pane beside the list, as on the sheet.
 */
export function WhatsLeft({
  character,
  gear,
  checks,
  totals,
  hitCap,
  gearHit,
  session,
  onSession,
  display,
  onFix,
  openSlot,
  onOpen,
  changeRef,
  onlyRef,
}: WhatsLeftProps) {
  const shown = session.onlyLeft ? checks.filter((check) => check.todo) : checks
  const standing = hitCap ? hitStanding(gearHit, hitCap) : undefined

  const tile = (testId: string, ok: boolean, n: number, of: number | string, label: string) => (
    <div className={`gear-tile ${ok ? 'is-ok' : 'is-todo'}`} data-testid={testId}>
      <b>
        {n}
        <small> / {of}</small>
      </b>
      <span>{label}</span>
    </div>
  )

  const equip = (check: SlotCheck, item: GearItem) => {
    const fitted = equipBest(character, check, gear)
    if (fitted) onFix(check.slot, fitted, `${display(check.slot)}: equipped ${item.name}.`)
  }

  const flags = (check: SlotCheck): ReactNode[] => {
    const out: ReactNode[] = []
    const name = display(check.slot)
    const up = check.upgrade
    if (!check.item) {
      if (up) {
        out.push(
          <button key="equip" type="button" className="gear-flag is-up" data-testid={`gear-fix-equip-${check.slot}`} onClick={() => equip(check, up.item)}>
            <FlagIcon item={up.item} slot={check.slot} />
            Empty · <span className="gear-flag-act">equip {up.item.name}</span>
          </button>,
        )
      } else {
        out.push(
          <span key="none" className="gear-flag">
            {check.heldByTwoHander ? 'Held by your two-hander' : "Empty · the guide ranks nothing here"}
          </span>,
        )
      }
      return out
    }
    if (check.best) out.push(<span key="best" className="gear-flag is-ok">✓ Best in slot</span>)
    else if (up) {
      out.push(
        <button
          key="equip"
          type="button"
          className="gear-flag is-up"
          data-testid={`gear-fix-equip-${check.slot}`}
          aria-label={`Equip ${up.item.name} in ${name}, from ${whereText(whereFrom(up.entry, up.item))}`}
          onClick={() => equip(check, up.item)}
        >
          <FlagIcon item={up.item} slot={check.slot} />↑ {up.item.name} · {whereText(whereFrom(up.entry, up.item))}
        </button>,
      )
    } else if (!check.ranked) {
      out.push(
        <span key="unranked" className="gear-flag">
          {check.heldByTwoHander ? 'Held by your two-hander' : 'The guide ranks nothing here'}
        </span>,
      )
    }
    const enchant = check.missingEnchant ? withGuideEnchant(check, gear) : undefined
    if (enchant && check.guideEnchant) {
      const line = enchantLine(check.guideEnchant.name)
      out.push(
        <button
          key="enchant"
          type="button"
          className="gear-flag is-warn"
          data-testid={`gear-fix-enchant-${check.slot}`}
          onClick={() => onFix(check.slot, enchant, `${name}: enchanted with ${line}.`)}
        >
          No enchant · <span className="gear-flag-act">add {line}</span>
        </button>,
      )
    }
    const gems = check.emptySockets > 0 || check.socketBonusFixable ? withGuideGems(character, check, gear) : undefined
    if (check.emptySockets > 0) {
      const text = `${plural(check.emptySockets, 'empty socket')}`
      out.push(
        gems ? (
          <button
            key="sockets"
            type="button"
            className="gear-flag is-warn"
            data-testid={`gear-fix-gems-${check.slot}`}
            onClick={() => onFix(check.slot, gems, `${name}: sockets filled with the guide's gems for their colours.`)}
          >
            {text} · <span className="gear-flag-act">fill</span>
          </button>
        ) : (
          <span key="sockets" className="gear-flag is-warn">
            {text}
          </span>
        ),
      )
    } else if (check.socketBonusFixable && gems) {
      out.push(
        <button
          key="bonus"
          type="button"
          className="gear-flag is-warn"
          data-testid={`gear-fix-gems-${check.slot}`}
          onClick={() => onFix(check.slot, gems, `${name}: gems matched to their sockets; the socket bonus is on.`)}
        >
          Socket bonus off · <span className="gear-flag-act">match gems</span>
        </button>,
      )
    } else if (check.socketBonusOff) {
      out.push(
        <span key="bonus" className="gear-flag">
          Socket bonus off, as the guide gems it
        </span>,
      )
    }
    return out
  }

  const bySlot = () => (
    <ol className="gear-checklist">
      {shown.map((check) => {
        const item = check.item
        const where = item ? whereText(whereFrom(check.entry, item)) : ''
        const name = display(check.slot)
        return (
          <li key={check.slot} className={`gear-check ${check.todo ? 'is-todo' : 'is-done'}`} data-testid={`gear-check-${check.slot}`}>
            <span className="gear-check-state" aria-label={check.todo ? 'To do' : 'Done'}>
              {check.todo ? '!' : '✓'}
            </span>
            <span className="gear-check-icon" style={item ? ({ '--q': getQualityColor(item.quality) } as CSSProperties) : undefined} aria-hidden="true">
              <ItemIcon wowItemId={item?.wowItemId} fallback={slotGlyph(check.slot)} />
            </span>
            <span className="gear-check-item">
              <span className="gear-check-slot">{name}</span>
              {item ? (
                <>
                  <b style={{ color: getQualityColor(item.quality) }}>{item.name}</b>
                  <small>
                    {check.entry && check.list ? `Rank ${check.entry.rank} of ${check.list.entries.length}` : 'Not on the list'} · {where}
                  </small>
                </>
              ) : (
                <>
                  <b className="gear-row-empty">Empty</b>
                  <small>Nothing equipped</small>
                </>
              )}
            </span>
            <span className="gear-check-flags">{flags(check)}</span>
            <button
              type="button"
              className="gear-check-change"
              aria-label={`Change ${name}`}
              aria-expanded={openSlot === check.slot}
              ref={(node) => changeRef(check.slot, node)}
              onClick={() => onOpen(check.slot)}
            >
              Change
            </button>
          </li>
        )
      })}
    </ol>
  )

  const byWhere = () => {
    const rows = checks
      .map((check) => ({ check, target: targetOf(check) }))
      .filter((row): row is { check: SlotCheck; target: NonNullable<ReturnType<typeof targetOf>> } => !!row.target)
      .filter(({ target }) => !session.onlyLeft || !target.have)
    if (!rows.length) return <p className="gear-allgood">Nothing left to get: every slot holds the best item on the list.</p>

    const row = ({ check, target }: (typeof rows)[number], withWhere: boolean) => (
      <li key={check.slot} className={`gear-loot${target.have ? ' is-have' : ''}`} data-testid={`gear-loot-${check.slot}`}>
        <span className="gear-check-icon" style={{ '--q': getQualityColor(target.item.quality) } as CSSProperties} aria-hidden="true">
          <ItemIcon wowItemId={target.item.wowItemId} fallback={slotGlyph(check.slot)} />
        </span>
        <span className="gear-check-item">
          <b style={{ color: getQualityColor(target.item.quality) }}>{target.item.name}</b>
          <small>
            {display(check.slot)}
            {withWhere ? ` · ${whereText(target.where)}` : ''}
            {target.have ? '' : check.item ? ` · replaces ${check.item.name}${check.entry ? ` (rank ${check.entry.rank})` : ''}` : ' · slot is empty'}
          </small>
        </span>
        {target.have ? (
          <span className="gear-flag is-ok">✓ equipped</span>
        ) : (
          <button
            type="button"
            className="gear-flag is-up"
            aria-label={`Got it: equip ${target.item.name} in ${display(check.slot)}`}
            onClick={() => equip(check, target.item)}
          >
            Got it · equip
          </button>
        )}
      </li>
    )

    const heading = (title: string, group: typeof rows) => {
      const left = group.filter(({ target }) => !target.have).length
      return (
        <h4>
          {title} <small>{left ? `${plural(left, 'upgrade')} still to get` : 'everything here is equipped'}</small>
        </h4>
      )
    }

    const others: [kind: RankedWhere['kind'], title: string][] = [
      ['world', 'World bosses'],
      ['craft', 'Crafted'],
      ['other', 'Everything else'],
    ]

    return (
      <div className="gear-where">
        {raidsInOrder.map((raid) => {
          const group = rows.filter(({ target }) => target.where.kind === 'raid' && target.where.raid.id === raid.id)
          if (!group.length) return null
          const bossOf = (target: (typeof rows)[number]['target']) => (target.where.kind === 'raid' ? target.where.boss : undefined)
          const bosses = [...new Map(group.flatMap(({ target }) => (bossOf(target) ? [[bossOf(target)!.id, bossOf(target)!] as const] : []))).values()].sort(
            (a, b) => (a.encounterOrder ?? 99) - (b.encounterOrder ?? 99),
          )
          const loose = group.filter(({ target }) => !bossOf(target))
          return (
            <section key={raid.id} className="gear-where-group" aria-label={raidShortName(raid)} data-testid={`gear-where-${raid.id}`}>
              {heading(raidShortName(raid), group)}
              {bosses.map((boss) => (
                <div key={boss.id} className="gear-where-boss">
                  <h5>{boss.name}</h5>
                  <ul>{group.filter(({ target }) => bossOf(target)?.id === boss.id).map((entry) => row(entry, false))}</ul>
                </div>
              ))}
              {loose.length > 0 && (
                <div className="gear-where-boss">
                  <h5>Trash, or a boss the loot tables don't record</h5>
                  <ul>{loose.map((entry) => row(entry, false))}</ul>
                </div>
              )}
            </section>
          )
        })}
        {others.map(([kind, title]) => {
          const group = rows.filter(({ target }) => target.where.kind === kind)
          if (!group.length) return null
          return (
            <section key={kind} className="gear-where-group" aria-label={title} data-testid={`gear-where-${kind}`}>
              {heading(title, group)}
              <ul>{group.map((entry) => row(entry, true))}</ul>
            </section>
          )
        })}
      </div>
    )
  }

  const segment = (label: string, options: readonly [id: string, text: string, pressed: boolean, act: () => void, testId: string][], ref?: (node: HTMLButtonElement | null) => void) => (
    <span className="gear-seg-wrap">
      <span className="gear-seg-label">{label}</span>
      <span className="gear-seg" role="group" aria-label={label}>
        {options.map(([id, text, pressed, act, testId], index) => (
          <button key={id} type="button" aria-pressed={pressed} onClick={act} data-testid={testId} ref={index === 1 ? ref : undefined}>
            {text}
          </button>
        ))}
      </span>
    </span>
  )
  const group = (value: GearGroup) => () => onSession({ ...session, group: value })

  return (
    <div className="gear-list gear-left" data-testid="gear-left">
      <div className="gear-tiles" role="group" aria-label="Where this gear stands">
        {tile('gear-tile-best', totals.best === totals.ranked, totals.best, totals.ranked, 'slots best on the list')}
        {tile('gear-tile-enchants', totals.enchanted === totals.enchantable, totals.enchanted, totals.enchantable, 'enchants on')}
        {tile('gear-tile-sockets', totals.filled === totals.sockets, totals.filled, totals.sockets, 'sockets filled')}
        {tile('gear-tile-bonuses', totals.bonusesLeft === 0, totals.bonusesOn, totals.withBonus, 'socket bonuses on')}
        {hitCap && standing && tile('gear-tile-hit', standing.state !== 'under', gearHit, hitCap.cap, `hit rating, ${standing.text}`)}
      </div>

      <div className="gear-left-ctrl">
        {segment(
          'Show',
          [
            ['all', 'Every slot', !session.onlyLeft, () => onSession({ ...session, onlyLeft: false }), 'gear-show-all'],
            ['left', `Only what's left (${totals.left})`, session.onlyLeft, () => onSession({ ...session, onlyLeft: true }), 'gear-show-left'],
          ],
          onlyRef,
        )}
        {segment('Group by', [
          ['slot', 'Slot', session.group === 'slot', group('slot'), 'gear-group-slot'],
          ['where', 'Where it drops', session.group === 'where', group('where'), 'gear-group-where'],
        ])}
      </div>

      {session.group === 'slot' ? (
        shown.length ? (
          bySlot()
        ) : (
          <p className="gear-allgood">Nothing left to do: every slot is best on the list, enchanted and fully gemmed.</p>
        )
      ) : (
        byWhere()
      )}

      <p className="gear-left-note">
        "Best" is rank 1 on Wowhead's {character.spec} {character.className} Phase 2 list for the slot (for the second ring and trinket, the
        best one the first leaves free). Enchants and gems are the guide's; bosses are from the app's raid loot tables, tier pieces from their
        tokens.
      </p>
    </div>
  )
}

function FlagIcon({ item, slot }: { item: GearItem; slot: GearSlot }) {
  return (
    <span className="gear-flag-icon" aria-hidden="true">
      <ItemIcon wowItemId={item.wowItemId} fallback={slotGlyph(slot)} />
    </span>
  )
}
