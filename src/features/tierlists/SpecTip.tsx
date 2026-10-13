import { useLayoutEffect, useRef } from 'react'
import { getClassColor } from '../../domain/character/classColors'
import { getSpecStanding, sameSpec, type SpecRef } from '../../domain/tierlists/specStanding'
import { SpecContributions } from './SpecCard'
import { formatDps, ordinal, placesText, specName } from './tierFormat'
import { SHEET_BELOW, type SpecTipTarget } from './useSpecTip'

/**
 * A spec's standing in a few lines, over whatever spec you point at or move to: name, role and
 * ability, its places on Wowhead's lists, what the logs say and what it brings. The prototypes'
 * spec tooltip; the full card is a press away.
 *
 * Decorative for assistive tech: everything in it is in the card, and each tile's own name already
 * carries its tier.
 */
export function SpecTip({ target, yours }: { target: SpecTipTarget | undefined; yours: SpecRef | undefined }) {
  const tipRef = useRef<HTMLDivElement>(null)
  // A phone gets a sheet along the bottom; there is no room beside a tile for a bubble.
  const sheet = window.innerWidth < SHEET_BELOW

  // Placed after layout, straight onto the element: it needs the tip's own measured size.
  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!target || !tip || sheet) return
    const anchor = target.anchor.getBoundingClientRect()
    const { offsetWidth: width, offsetHeight: height } = tip
    let left = anchor.left + anchor.width / 2 - width / 2
    let top = anchor.top - height - 10
    if (top < 8) top = anchor.bottom + 10
    left = Math.max(8, Math.min(window.innerWidth - width - 8, left))
    top = Math.max(8, Math.min(window.innerHeight - height - 8, top))
    tip.style.left = `${Math.round(left)}px`
    tip.style.top = `${Math.round(top)}px`
    tip.style.visibility = 'visible'
  }, [target, sheet])

  if (!target) return null
  const standing = getSpecStanding(target.ref)
  const isYours = sameSpec(yours, target.ref)

  return (
    <div
      className={`spec-tip${sheet ? ' spec-tip-sheet' : ''}`}
      ref={tipRef}
      role="tooltip"
      aria-hidden="true"
      data-testid="spec-tip"
      style={sheet ? undefined : { visibility: 'hidden' }}
    >
      <b className="spec-tip-name" style={{ color: getClassColor(standing.className) }}>
        {specName(standing)}
        {isYours ? ' · your spec' : ''}
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
    </div>
  )
}
