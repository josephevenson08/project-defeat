import { useCallback, useEffect, useState, type FocusEvent, type PointerEvent } from 'react'
import type { SpecRef } from '../../domain/tierlists/specStanding'

export type SpecTipTarget = { ref: SpecRef; anchor: HTMLElement }

/** Below this width the tip is a sheet along the bottom of the screen rather than a bubble. */
export const SHEET_BELOW = 700

/**
 * The spec tooltip's state: shown on hover with a mouse or pen, and on keyboard focus (which a tap
 * also gives), hidden by Escape, by moving away, and on a wide screen by scrolling, since a bubble
 * left behind by a scroll points at nothing.
 */
export function useSpecTip() {
  const [target, setTarget] = useState<SpecTipTarget>()
  const hide = useCallback(() => setTarget(undefined), [])

  useEffect(() => {
    if (!target) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    const onScroll = () => {
      if (window.innerWidth >= SHEET_BELOW) hide()
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!target.anchor.contains(event.target as Node)) hide()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [target, hide])

  const bind = useCallback(
    (ref: SpecRef) => ({
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') setTarget({ ref, anchor: event.currentTarget })
      },
      onPointerLeave: (event: PointerEvent<HTMLElement>) => {
        if (document.activeElement !== event.currentTarget) hide()
      },
      onFocus: (event: FocusEvent<HTMLElement>) => setTarget({ ref, anchor: event.currentTarget }),
      onBlur: hide,
    }),
    [hide],
  )

  return { target, bind, hide }
}
