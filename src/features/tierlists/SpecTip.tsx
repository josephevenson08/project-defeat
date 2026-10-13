import { FloatingTip } from '../../components/ui/FloatingTip'
import type { HoverTipTarget } from '../../components/ui/useHoverTip'
import { getClassColor } from '../../domain/character/classColors'
import { getSpecStanding, sameSpec, type SpecRef } from '../../domain/tierlists/specStanding'
import { SpecContributions } from './SpecCard'
import { formatDps, ordinal, placesText, specName } from './tierFormat'

/**
 * A spec's standing in a few lines, over whatever spec you point at or move to: name, role and
 * ability, its places on Wowhead's lists, what the logs say and what it brings. The prototypes'
 * spec tooltip; the full card is a press away.
 */
export function SpecTip({ target, yours }: { target: HoverTipTarget<SpecRef> | undefined; yours: SpecRef | undefined }) {
  if (!target) return null
  const standing = getSpecStanding(target.data)

  return (
    <FloatingTip anchor={target.anchor} placement="above" className="spec-tip" testId="spec-tip">
      <b className="spec-tip-name" style={{ color: getClassColor(standing.className) }}>
        {specName(standing)}
        {sameSpec(yours, target.data) ? ' · your spec' : ''}
      </b>
      <span className="spec-tip-grey">
        {standing.role}
        {standing.ability ? ` · ${standing.ability}` : ''}
      </span>
      <span>{placesText(standing)} on Wowhead's lists</span>
      {standing.logs && (
        <span className="spec-tip-logs">
          {formatDps(standing.logs.dps)} DPS in the logs · archon {standing.logs.tier} · {ordinal(standing.logs.rank)} of{' '}
          {standing.logs.of}
        </span>
      )}
      {standing.brings.length > 0 && <SpecContributions standing={standing} named={false} />}
    </FloatingTip>
  )
}
