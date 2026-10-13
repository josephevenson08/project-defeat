import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { SHEET_BELOW } from './useHoverTip'

type FloatingTipProps = {
  anchor: HTMLElement
  /** `above` centres the tip over its anchor (a spec chip); `beside` puts it to the right, or left, of a row (an item). */
  placement: 'above' | 'beside'
  className: string
  testId?: string
  children: ReactNode
}

/**
 * The floating box a tooltip draws in: fixed to the viewport, placed after layout so it can use its
 * own measured size, kept inside the screen, and a sheet along the bottom on a phone, where there is
 * no room beside a row for a bubble.
 *
 * Decorative for assistive tech: everything a tip shows is also on the page or one press away, and
 * the anchor's own name already says what it is.
 */
export function FloatingTip({ anchor, placement, className, testId, children }: FloatingTipProps) {
  const tipRef = useRef<HTMLDivElement>(null)
  const sheet = window.innerWidth < SHEET_BELOW

  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!tip) return
    if (sheet) {
      // A sheet is placed by its class; clear any place a wider window gave it.
      tip.style.left = ''
      tip.style.top = ''
      return
    }
    const box = anchor.getBoundingClientRect()
    const { offsetWidth: width, offsetHeight: height } = tip
    let left: number
    let top: number
    if (placement === 'above') {
      left = box.left + box.width / 2 - width / 2
      top = box.top - height - 10
      if (top < 8) top = box.bottom + 10
    } else {
      left = box.right + 12
      top = box.top - 4
      if (left + width > window.innerWidth - 8) left = box.left - width - 12
      if (left < 8) {
        left = Math.max(8, Math.min(window.innerWidth - width - 8, box.left))
        top = box.bottom + 8
        if (top + height > window.innerHeight - 8) top = box.top - height - 8
      }
    }
    left = Math.max(8, Math.min(window.innerWidth - width - 8, left))
    top = Math.max(8, Math.min(window.innerHeight - height - 8, top))
    tip.style.left = `${Math.round(left)}px`
    tip.style.top = `${Math.round(top)}px`
    tip.style.visibility = 'visible'
  }, [anchor, placement, sheet, children])

  return (
    <div
      className={`floating-tip ${className}${sheet ? ' floating-tip-sheet' : ''}`}
      ref={tipRef}
      role="tooltip"
      aria-hidden="true"
      data-testid={testId}
      style={sheet ? undefined : { visibility: 'hidden' }}
    >
      {children}
    </div>
  )
}
