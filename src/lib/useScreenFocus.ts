import { useEffect, type RefObject } from 'react'

/**
 * Whether the app has already shown a screen in this page load.
 *
 * Module scope rather than state: the point is to tell the *first* screen a visitor sees from every
 * screen after it, and those are different components mounting one after another, so no component can
 * hold the answer. A fresh page load starts a fresh module.
 */
let aScreenHasBeenShown = false

/**
 * Moves focus into a screen when the app swaps one whole screen for another.
 *
 * The app replaces the entire view three times — the front page hands over to the shell or to
 * character creation, and creation hands back to the shell — and each time the control that was
 * pressed stops existing, so focus falls to the page body. Two participants in the 2026-09-21
 * usability study hit exactly that: the screen reader user pressed Enter on a section and heard
 * silence, having no way to know anything had happened, and the keyboard-only user had to start
 * tabbing from the top again after every transition.
 *
 * **Only on a swap, never on arrival.** Focusing something on first paint would drag a visitor off the
 * top of the document and fight the browser's own scroll and focus restoration on a reload.
 *
 * **Not on tab changes.** Those keep the tab strip mounted, so the button that was pressed keeps
 * focus, which is where a keyboard user wants to be — pulling focus into the panel would cost them
 * their place in the strip.
 *
 * **`preventScroll`, because focus and scroll are different questions.** A plain `focus()` scrolls its
 * target into view, and on a phone the main pane starts below the rail: finishing character creation
 * scrolled 385px down, putting the rail's own heading and its "Start over" link off the top of the
 * screen. Where the page should sit after a screen change is already decided in `App`, which scrolls
 * to the top; this only has to say what the keyboard and the screen reader are pointed at.
 */
export function useScreenFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!aScreenHasBeenShown) {
      aScreenHasBeenShown = true
      return
    }
    ref.current?.focus({ preventScroll: true })
  }, [ref])
}
