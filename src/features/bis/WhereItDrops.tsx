import { useRef, type CSSProperties } from 'react'
import { FloatingTip } from '../../components/ui/FloatingTip'
import { ItemTooltip } from '../../components/ui/ItemTooltip'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { guideFitting, raidShortName, raidsInOrder, slotsWearing, whereText, type RankedItem } from '../../domain/bis'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { RaidBoss } from '../../domain/raids'
import type { CharacterProfile } from '../character/characterTypes'
import type { EquippedGear, GearItem, GearSlot } from '../gear/gearTypes'
import { ItemIcon } from '../gear/ItemIcon'
import { slotGlyph } from '../gear/slotGlyphs'
import { rankedTip } from './rankedTip'

type WhereItDropsProps = {
  character: CharacterProfile
  gear: EquippedGear
  items: readonly RankedItem[]
  onlyUpgrades: boolean
  onOnlyUpgrades: (only: boolean) => void
  display: (slot: GearSlot) => string
  onEquip: (slot: GearSlot, item: GearItem) => void
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
const upgrades = (items: readonly RankedItem[]) => items.filter((item) => item.standing === 'above').length

/** "Head #1 of 3 · Best": every list that ranks it, for a row and its tooltip. */
/** The slot a row's tooltip fits the item for: where you wear it, else where Equip would put it. */
const tipSlot = (item: RankedItem, gear: EquippedGear): GearSlot =>
  item.on.flatMap(({ list }) => slotsWearing(list, item.itemId, gear))[0] ?? item.target ?? item.on[0].list.key

const ranksLine = (item: RankedItem) =>
  item.on.map(({ list, entry }) => `${list.label} #${entry.rank} of ${list.entries.length}${entry.label ? ` · ${entry.label}` : ''}`).join(' · ')

/**
 * "Where it drops" (design C): every item on the spec's list once, grouped by where you get it, for
 * planning a raid night. This tier's raids first with their bosses in kill order, then last tier's,
 * world bosses, crafting and everything else (badges, PvP, quests, dungeons). What you wear is ticked;
 * anything ranked above what you wear in its slot is an upgrade, and "Only upgrades" hides the rest.
 * Raid drops the loot tables don't place on a boss sit at the end of their raid, said as such.
 */
export function WhereItDrops({ character, gear, items, onlyUpgrades, onOnlyUpgrades, display, onEquip }: WhereItDropsProps) {
  const tip = useHoverTip<RankedItem>()
  const onlyRef = useRef<HTMLButtonElement>(null)
  const shown = onlyUpgrades ? items.filter((item) => item.standing === 'above') : items
  const total = upgrades(items)
  const raidUpgrades = raidsInOrder
    .map((raid) => ({ raid, n: upgrades(items.filter((item) => item.where.kind === 'raid' && item.where.raid.id === raid.id)) }))
    .filter(({ n }) => n > 0)

  // The pressed Equip leaves with its row's upgrade; focus goes back to the toggle above the groups.
  const equip = (item: RankedItem) => {
    if (!item.target) return
    onEquip(item.target, item.item)
    onlyRef.current?.focus()
  }

  const row = (item: RankedItem, withWhere: boolean) => (
    <li key={item.itemId} className={`ranked-row is-${item.standing}`} data-testid={`ranked-row-${item.itemId}`}>
      <button type="button" className="ranked-row-item" {...tip.bind(item)}>
        <span className="ranked-row-icon" style={{ '--q': getQualityColor(item.item.quality) } as CSSProperties} aria-hidden="true">
          <ItemIcon wowItemId={item.item.wowItemId} fallback={slotGlyph(item.on[0].list.key)} />
        </span>
        <span className="ranked-row-text">
          <span className="ranked-row-name">
            <b style={{ color: getQualityColor(item.item.quality) }}>{item.item.name}</b>
            {item.where.kind === 'raid' && item.where.token && <span className="ranked-tag is-token">{item.where.token}</span>}
          </span>
          <small>{withWhere ? `${whereText(item.where)} · ${ranksLine(item)}` : ranksLine(item)}</small>
        </span>
      </button>
      <span className="ranked-row-acts">
        {item.standing === 'wearing' && (
          <span className="ranked-tag is-worn">
            <span aria-hidden="true">✓ </span>You wear it
          </span>
        )}
        {item.standing === 'above' && <span className="ranked-tag is-up">Upgrade</span>}
        {item.target && (
          <button type="button" className="ranked-equip" aria-label={`Equip ${item.item.name} in ${display(item.target)}`} onClick={() => equip(item)}>
            Equip
          </button>
        )}
      </span>
    </li>
  )

  const heading = (title: string, sub: string, group: readonly RankedItem[]) => {
    const n = upgrades(group)
    return (
      <h4>
        {title}{' '}
        <small>
          {sub} · {plural(group.length, 'item')}
          {n > 0 && (
            <>
              {' · '}
              <span className="is-up">{plural(n, 'upgrade')}</span>
            </>
          )}
        </small>
      </h4>
    )
  }

  const others: [kind: RankedItem['where']['kind'], title: string, sub: string][] = [
    ['world', 'World bosses', 'Doom Lord Kazzak and Doomwalker'],
    ['craft', 'Crafted', 'Professions'],
    ['other', 'Everything else', 'Badges, PvP, quests, dungeons and world drops'],
  ]

  return (
    <div className="ranked-where-view">
      <p className="ranked-lead">
        Every item on Wowhead's {character.spec} {character.className} Phase 2 list, grouped by where you get it, with raid bosses in kill
        order. What you wear is ticked; anything ranked above what you wear in its slot is an upgrade.
      </p>
      <div className="ranked-sum" data-testid="ranked-summary">
        <b>{total ? `${plural(total, 'upgrade')} left` : 'No upgrades left: you wear the top pick in every slot'}</b>
        {raidUpgrades.length > 0 && (
          <span className="ranked-chips">
            {raidUpgrades.map(({ raid, n }) => (
              <span key={raid.id}>
                {raidShortName(raid)} {n}
              </span>
            ))}
          </span>
        )}
        <button
          type="button"
          className="ranked-toggle"
          aria-pressed={onlyUpgrades}
          ref={onlyRef}
          onClick={() => onOnlyUpgrades(!onlyUpgrades)}
          data-testid="ranked-only-upgrades"
        >
          Only upgrades
        </button>
      </div>

      <div className="ranked-groups">
        {raidsInOrder.map((raid) => {
          const group = shown.filter((item) => item.where.kind === 'raid' && item.where.raid.id === raid.id)
          if (!group.length) return null
          const bosses = [
            ...new Map(
              group.flatMap((item) => (item.where.kind === 'raid' && item.where.boss ? [[item.where.boss.id, item.where.boss] as const] : [])),
            ).values(),
          ].sort((a, b) => (a.encounterOrder ?? 99) - (b.encounterOrder ?? 99))
          const bossOf = (item: RankedItem): RaidBoss | undefined => (item.where.kind === 'raid' ? item.where.boss : undefined)
          const loose = group.filter((item) => !bossOf(item))
          return (
            <section
              key={raid.id}
              className={`ranked-group${raid.phase === 2 ? ' is-wide' : ''}`}
              aria-label={raidShortName(raid)}
              data-testid={`ranked-group-${raid.id}`}
            >
              {heading(raidShortName(raid), raid.phase === 2 ? 'This tier' : 'Last tier', group)}
              {bosses.map((boss) => (
                <div key={boss.id} className="ranked-boss">
                  <h5>
                    {boss.encounterOrder !== undefined && (
                      <span className="ranked-boss-order">
                        <span className="visually-hidden">Boss </span>
                        {boss.encounterOrder}
                      </span>
                    )}
                    {boss.name}
                  </h5>
                  <ul className="ranked-rows">{group.filter((item) => bossOf(item)?.id === boss.id).map((item) => row(item, false))}</ul>
                </div>
              ))}
              {loose.length > 0 && (
                <div className="ranked-boss">
                  <h5>Trash, or a boss the loot tables don't record</h5>
                  <ul className="ranked-rows">{loose.map((item) => row(item, false))}</ul>
                </div>
              )}
            </section>
          )
        })}
        {others.map(([kind, title, sub]) => {
          const group = shown
            .filter((item) => item.where.kind === kind)
            .sort((a, b) => whereText(a.where).localeCompare(whereText(b.where)) || a.item.name.localeCompare(b.item.name))
          if (!group.length) return null
          return (
            <section key={kind} className="ranked-group" aria-label={title} data-testid={`ranked-group-${kind}`}>
              {heading(title, sub, group)}
              <ul className="ranked-rows">{group.map((item) => row(item, true))}</ul>
            </section>
          )
        })}
      </div>
      {!shown.length && <p className="ranked-none">No upgrades left. Turn off "Only upgrades" to see every ranked item.</p>}

      {tip.target && (
        <FloatingTip anchor={tip.target.anchor} placement="beside" className="item-tip-box" testId="item-tip">
          <ItemTooltip
            tip={rankedTip(
              tip.target.data.item,
              guideFitting(character, tipSlot(tip.target.data, gear), tip.target.data.item, gear),
              whereText(tip.target.data.where),
              ranksLine(tip.target.data),
            )}
          />
        </FloatingTip>
      )}
    </div>
  )
}
