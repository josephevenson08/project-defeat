import { useCallback, useEffect, useState, type FocusEvent, type PointerEvent } from 'react'

export type HoverTipTarget<T> = { data: T; anchor: HTMLElement }

/** Below this width a tip is a sheet along the bottom of the screen rather than a bubble beside its anchor. */
export const SHEET_BELOW = 700

/**
 * A tooltip's state: shown on hover with a mouse or pen, and on keyboard focus (which a tap also
 * gives), hidden by Escape, by moving away, by a tap elsewhere, and on a wide screen by scrolling,
 * since a bubble left behind by a scroll points at nothing. Shared by the spec tooltip (Spec Tier
 * Lists) and the game-style item tooltip (Raids, and the planner tabs as they are ported).
 */
export function useHoverTip<T>() {
  const [target, setTarget] = useState<HoverTipTarget<T>>()
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
    (data: T) => ({
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') setTarget({ data, anchor: event.currentTarget })
      },
      onPointerLeave: (event: PointerEvent<HTMLElement>) => {
        if (document.activeElement !== event.currentTarget) hide()
      },
      onFocus: (event: FocusEvent<HTMLElement>) => setTarget({ data, anchor: event.currentTarget }),
      onBlur: hide,
    }),
    [hide],
  )

  return { target, bind, hide }
}
