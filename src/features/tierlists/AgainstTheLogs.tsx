import { useState, type CSSProperties, type ReactNode } from 'react'
import { Panel } from '../../components/layout/Panel'
import { SpecIcon } from '../../components/ui/SpecIcon'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import { getClassColor } from '../../domain/character/classColors'
import type { DpsReference } from '../../domain/simulation/dpsReference'
import { getTierList } from '../../domain/tierlists'
import {
  byWowheadTier,
  compareWithLogs,
  describeGap,
  getSpecStanding,
  logsOrder,
  sameSpec,
  specKey,
  tierGap,
  TIER_ORDER,
  wowheadDpsTier,
  type SpecRef,
} from '../../domain/tierlists/specStanding'
import { SpecCard, TierLetter } from './SpecCard'
import { SpecTip } from './SpecTip'
import { LOGS_READ_ON, formatDps, ordinal, plural, specName } from './tierFormat'

type Sort = 'by-logs' | 'by-wowhead'

type AgainstTheLogsProps = {
  yours?: SpecRef
  raidCount?: (spec: SpecRef) => number
}

const comparison = compareWithLogs()
const topDps = logsOrder[0]?.dps ?? 1

/**
 * Design B, merged into the tab as its second view: Wowhead's tiers against what players actually
 * parse. The 20 damage specs by archon.gg's observed average DPS, each with both letters and the
 * disagreements spelled out; sort by either opinion, or show only where they disagree. Healers and
 * tanks have only Wowhead's lists in the app, and say so.
 */
export function AgainstTheLogs({ yours, raidCount }: AgainstTheLogsProps) {
  const [sort, setSort] = useState<Sort>('by-logs')
  const [onlyDisagreements, setOnlyDisagreements] = useState(false)
  const [open, setOpen] = useState<string>()
  const tip = useHoverTip<SpecRef>()
  const dpsList = getTierList('DPS')

  const ordered = sort === 'by-logs' ? logsOrder : byWowheadTier()
  const rows = onlyDisagreements ? ordered.filter((entry) => tierGap(entry) !== 0) : ordered
  const yoursLogs = yours ? logsOrder.find((entry) => sameSpec(entry, yours)) : undefined

  const card = (spec: SpecRef) => (
    <SpecCard standing={getSpecStanding(spec)} isYours={sameSpec(yours, spec)} inYourRaid={raidCount?.(spec)} />
  )
  const toggle = (spec: SpecRef) => {
    tip.hide()
    setOpen((current) => (current === specKey(spec) ? undefined : specKey(spec)))
  }

  return (
    <div className="tier-logs">
      <Panel title="Two opinions" eyebrow="20 damage specs" className="tier-logs-summary">
        <ul className="tier-facts">
          <li>
            <b>Agree</b>
            {comparison.agree} of {logsOrder.length}
          </li>
          <li>
            <b>Logs higher</b>
            {comparison.logsHigher}
          </li>
          <li>
            <b>Wowhead higher</b>
            {comparison.wowheadHigher}
          </li>
          <li>
            <b>Wowhead D, archon C</b>
            {comparison.wowheadD}
          </li>
        </ul>
        <ul className="tier-notes">
          {comparison.underrated && (
            <li>
              <b>{specName(comparison.underrated.ref)}</b> averages the {ordinal(comparison.underrated.rank)}-highest DPS of{' '}
              {logsOrder.length}, yet sits in Wowhead's {comparison.underrated.wowhead} tier.
            </li>
          )}
          {comparison.notDpsOrder && (
            <li>
              <b>{specName(comparison.notDpsOrder.ref)}</b> is only {ordinal(comparison.notDpsOrder.rank)} by DPS, but archon puts it
              in {comparison.notDpsOrder.archon}: archon's tiers are not DPS order alone.
            </li>
          )}
          {yours && yoursLogs && (
            <li>
              <b>{specName(yours)}</b>, your spec: Wowhead {wowheadDpsTier(yours)}, archon {yoursLogs.tier},{' '}
              {ordinal(logsOrder.indexOf(yoursLogs) + 1)} by DPS at {formatDps(yoursLogs.dps)}.
            </li>
          )}
        </ul>
        <p className="tier-logs-about">
          Wowhead's tiers are their guide writers' judgement ({dpsList?.title.replace(/ - Wowhead$/, '')}). archon.gg averages uploaded
          Warcraft Logs parses for Serpentshrine Cavern and Tempest Keep, all bosses{LOGS_READ_ON ? `, read ${LOGS_READ_ON}` : ''}; its
          tier letters are its own.
        </p>
      </Panel>

      <Panel
        title={`Damage, by ${sort === 'by-logs' ? 'what the logs say' : "Wowhead's tier"}`}
        eyebrow={onlyDisagreements ? plural(rows.length, 'disagreement') : 'Bars: observed average DPS'}
        className="tier-logs-chart"
      >
        <div className="tier-logs-controls">
          <ViewSwitch
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { id: 'by-logs', label: 'By the logs' },
              { id: 'by-wowhead', label: "By Wowhead's tier" },
            ]}
          />
          <label className="tier-logs-only">
            <input type="checkbox" checked={onlyDisagreements} onChange={(event) => setOnlyDisagreements(event.target.checked)} />
            Only where they disagree
          </label>
          <span className="tier-logs-legend">W Wowhead · A archon.gg · the number is the DPS rank</span>
        </div>

        <ol className="tier-chart" data-testid="tier-chart">
          {rows.map((entry) => (
            <ChartRow
              key={specKey(entry)}
              entry={entry}
              isYours={sameSpec(yours, entry)}
              isOpen={open === specKey(entry)}
              onToggle={() => toggle(entry)}
              card={card}
              bindTip={tip.bind}
            />
          ))}
        </ol>
      </Panel>

      <div className="tier-board-pair">
        {(['Healer', 'Tank'] as const).map((role) => {
          const list = getTierList(role)
          if (!list) return null
          const openHere = list.tiers.flatMap((tier) => tier.placements).find((placement) => specKey(placement) === open)
          return (
            <Panel key={role} title={`${role} tier list`} eyebrow="Wowhead only" className="tier-plain">
              <ul className="tier-plain-rows">
                {list.tiers.map((tier, depth) => (
                  <li key={tier.label}>
                    <TierLetter label={tier.label} depth={depth} />
                    {tier.placements.map((placement) => (
                      <button
                        key={placement.slug}
                        type="button"
                        className="tier-plain-spec"
                        aria-expanded={open === specKey(placement)}
                        style={{ '--spec-class': getClassColor(placement.className) } as CSSProperties}
                        onClick={() => toggle(placement)}
                        {...tip.bind({ className: placement.className, spec: placement.spec })}
                      >
                        <SpecIcon className={placement.className} spec={placement.spec} size={28} />
                        {specName(placement)}
                      </button>
                    ))}
                  </li>
                ))}
              </ul>
              {openHere && <div className="tier-plain-open">{card(openHere)}</div>}
              <p className="tier-source">
                The app has no log numbers for {role === 'Healer' ? 'healers' : 'tanks'}, so this is Wowhead's opinion alone.{' '}
                <a href={list.sourceUrl} target="_blank" rel="noreferrer noopener">
                  Wowhead's reasoning
                </a>
              </p>
            </Panel>
          )
        })}
      </div>

      <SpecTip target={tip.target} yours={yours} />
    </div>
  )
}

type ChartRowProps = {
  entry: DpsReference
  isYours: boolean
  isOpen: boolean
  onToggle: () => void
  card: (spec: SpecRef) => ReactNode
  bindTip: ReturnType<typeof useHoverTip<SpecRef>>['bind']
}

function ChartRow({ entry, isYours, isOpen, onToggle, card, bindTip }: ChartRowProps) {
  const wowhead = wowheadDpsTier(entry)
  const gap = tierGap(entry)
  const disagreement = describeGap(entry)
  const rank = logsOrder.indexOf(entry) + 1

  return (
    <li className={`tier-chart-row${isYours ? ' tier-chart-row-yours' : ''}`} data-testid={`tier-chart-${specKey(entry)}`}>
      <button
        type="button"
        className="tier-chart-button"
        aria-expanded={isOpen}
        style={{ '--spec-class': getClassColor(entry.className) } as CSSProperties}
        onClick={onToggle}
        {...bindTip({ className: entry.className, spec: entry.spec })}
      >
        <span className="tier-chart-rank">{rank}</span>
        <span className="tier-chart-who">
          <SpecIcon className={entry.className} spec={entry.spec} size={30} />
          <span>
            <b>
              {entry.spec}
              {isYours && <span className="tier-you">You</span>}
            </b>
            <small>{entry.className}</small>
          </span>
        </span>
        <span className="tier-chart-bar" aria-label={`${formatDps(entry.dps)} DPS observed`}>
          <i style={{ width: `${((entry.dps / topDps) * 100).toFixed(1)}%` }} />
          <span>{formatDps(entry.dps)}</span>
        </span>
        <span className="tier-chart-tiers">
          <small>W</small>
          <TierLetter label={wowhead ?? '?'} depth={TIER_ORDER.indexOf((wowhead ?? 'S') as (typeof TIER_ORDER)[number])} title="Wowhead's tier" />
          <small>A</small>
          <TierLetter label={entry.tier} title="archon.gg's tier" />
        </span>
      </button>
      {disagreement && <p className={`tier-chart-gap${gap > 0 ? ' tier-chart-gap-up' : ''}`}>{disagreement}</p>}
      {isOpen && <div className="tier-chart-open">{card(entry)}</div>}
    </li>
  )
}
