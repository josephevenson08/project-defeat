import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Panel } from '../../components/layout/Panel'
import { SpecIcon } from '../../components/ui/SpecIcon'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { getClassColor } from '../../domain/character/classColors'
import type { TbcClass } from '../../domain/character/characterTypes'
import { tbcClasses } from '../../domain/character/tbcClasses'
import { getTierList, type SpecTierList } from '../../domain/tierlists'
import { getSpecStanding, sameSpec, type SpecRef } from '../../domain/tierlists/specStanding'
import { SpecCard } from './SpecCard'
import { SpecTip } from './SpecTip'
import { plural, specName } from './tierFormat'

type TierBoardProps = {
  /** The character's spec, when one has been made; it is marked on every list it appears on. */
  yours?: SpecRef
  selected?: SpecRef
  onSelect: (spec: SpecRef) => void
  /** Seats per spec in the saved Raid Composition roster, when there is one. */
  raidCount?: (spec: SpecRef) => number
}

/**
 * Design A, the tier board: Wowhead's three lists as the familiar board, S to D rows of spec icons in
 * their class colours, damage on top with healing and tanking side by side. Press any spec for its
 * card. A class filter on the damage board dims every other class.
 *
 * **The letters stay neutral.** Wowhead draws S in legendary orange and A in epic purple; this app
 * spends quality colour on one thing, "this item is epic", so rank reads through the letter box's
 * weight and ink instead. The colour on a spec is its class colour.
 */
export function TierBoard({ yours, selected, onSelect, raidCount }: TierBoardProps) {
  const [classFilter, setClassFilter] = useState<TbcClass>()
  const tip = useHoverTip<SpecRef>()
  const [dps, healer, tank] = (['DPS', 'Healer', 'Tank'] as const).map(getTierList)
  const standing = selected ? getSpecStanding(selected) : undefined

  const board = (list: SpecTierList | undefined) =>
    list && (
      <Board
        list={list}
        yours={yours}
        selected={selected}
        onSelect={(spec) => {
          tip.hide()
          onSelect(spec)
        }}
        classFilter={classFilter}
        onClassFilter={list.role === 'DPS' ? setClassFilter : undefined}
        bindTip={tip.bind}
      />
    )

  return (
    <div className="tier-board-layout">
      <div className="tier-boards">
        {board(dps)}
        <div className="tier-board-pair">
          {board(healer)}
          {board(tank)}
        </div>
      </div>

      <aside className="panel tier-card-pane" aria-label={standing ? specName(standing) : 'Spec card'} aria-live="polite">
        {standing ? (
          <SpecCard standing={standing} isYours={sameSpec(yours, standing)} inYourRaid={raidCount?.(standing)} />
        ) : (
          <p className="tier-card-empty" data-testid="spec-card-empty">
            Press any spec for its card: its place on every list, what the logs say, what it brings to a raid and the ability
            it is built around.
          </p>
        )}
      </aside>

      <SpecTip target={tip.target} yours={yours} />
    </div>
  )
}

type BoardProps = {
  list: SpecTierList
  yours?: SpecRef
  selected?: SpecRef
  onSelect: (spec: SpecRef) => void
  classFilter?: TbcClass
  onClassFilter?: (className: TbcClass | undefined) => void
  bindTip: ReturnType<typeof useHoverTip<SpecRef>>['bind']
}

function Board({ list, yours, selected, onSelect, classFilter, onClassFilter, bindTip }: BoardProps) {
  const count = list.tiers.reduce((total, tier) => total + tier.placements.length, 0)
  const yoursHere = yours && list.tiers.some((tier) => tier.placements.some((placement) => sameSpec(placement, yours)))

  /* Arrow keys move through one board's tiles, in reading order. */
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key]
    const current = (event.target as HTMLElement).closest<HTMLButtonElement>('.tier-tile')
    if (!step || !current) return
    const tiles = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('.tier-tile')]
    const next = tiles[tiles.indexOf(current) + step]
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }

  return (
    <Panel title={`${list.role} tier list`} eyebrow={`${plural(list.tiers.length, 'tier')} · ${plural(count, 'spec')}`} className="tier-board">
      {onClassFilter && (
        <div className="tier-filter" role="group" aria-label="Show a class">
          <button type="button" aria-pressed={classFilter === undefined} onClick={() => onClassFilter(undefined)}>
            All
          </button>
          {tbcClasses.map(({ className }) => (
            <button
              key={className}
              type="button"
              aria-pressed={classFilter === className}
              onClick={() => onClassFilter(className)}
              style={{ '--spec-class': getClassColor(className) } as CSSProperties}
            >
              {className}
            </button>
          ))}
        </div>
      )}

      <ul className="tier-rows" onKeyDown={onKeyDown}>
        {list.tiers.map((tier, depth) => (
          <li key={tier.label} className="tier-row" data-depth={depth} data-testid={`tier-row-${list.role}-${tier.label}`}>
            <span className="tier-letter tier-row-letter" data-depth={depth} aria-label={`Tier ${tier.label}`}>
              {tier.label}
            </span>
            <ul className="tier-tiles">
              {tier.placements.map((placement) => {
                const isYours = sameSpec(yours, placement)
                const dimmed = classFilter !== undefined && placement.className !== classFilter
                return (
                  <li key={placement.slug}>
                    <button
                      type="button"
                      className={`tier-tile${dimmed ? ' tier-tile-dim' : ''}`}
                      aria-pressed={sameSpec(selected, placement)}
                      aria-label={`${specName(placement)}, tier ${tier.label}${isYours ? ', your spec' : ''}`}
                      data-current={isYours || undefined}
                      data-testid={`tier-spec-${list.role}-${placement.slug}`}
                      style={{ '--spec-class': getClassColor(placement.className) } as CSSProperties}
                      onClick={() => onSelect({ className: placement.className, spec: placement.spec })}
                      {...bindTip({ className: placement.className, spec: placement.spec })}
                    >
                      {isYours && <span className="tier-you">You</span>}
                      <SpecIcon className={placement.className} spec={placement.spec} size={40} />
                      <b>{placement.spec}</b>
                      <small>{placement.className}</small>
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      {yours && !yoursHere && list.role !== 'DPS' && (
        <p className="tier-cross">
          {specName(yours)} is not on this list: it ranks only {list.role === 'Healer' ? 'healers' : 'tanks'}.
        </p>
      )}

      <p className="tier-source">
        <span className="tier-source-badge">Wowhead · Phase {list.phase}</span>
        <a href={list.sourceUrl} target="_blank" rel="noreferrer noopener">
          {list.title.replace(/ - Wowhead$/, '')}
        </a>{' '}
        · tier letters and placements only
      </p>
    </Panel>
  )
}
