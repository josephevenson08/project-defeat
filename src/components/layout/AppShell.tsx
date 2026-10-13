import { useRef, type ReactNode } from 'react'
import { useScreenFocus } from '../../lib/useScreenFocus'
import { PhaseChip } from '../ui/PhaseChip'
import { TabNav, type TabDefinition } from './TabNav'

type AppShellProps<T extends string> = {
  children: ReactNode
  /**
   * Persistent left-rail content. Only Raids has one now — the list of other raids, which is the
   * thing you keep returning to while reading one. A raid loot table and a profession guide have no
   * stats to keep glancing at, and a rail of numbers belonging to nothing is worse than no rail.
   */
  rail?: ReactNode
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  /** The wordmark goes back to the front door, as the prototypes' does. */
  onHome: () => void
  /** Where this screen's numbers come from (a `Provenance`), on the line under the sections. */
  provenance?: ReactNode
}

/**
 * Discord's skeleton: a persistent left rail that never navigates away, one main pane that swaps
 * content, and detail shown beside what it belongs to rather than as modes you travel between.
 *
 * The top bar is the prototypes' header (2026-10-12, `docs/design/PORT-PLAN.md` step 0): the
 * wordmark, the sections, and under them the line every screen carries — the game and phase every
 * number is for, and, once a tab is ported, where its numbers come from.
 */
export function AppShell<T extends string>({ children, rail, tabs, activeTab, onTabChange, onHome, provenance }: AppShellProps<T>) {
  const mainRef = useRef<HTMLElement>(null)
  // Arriving here from the front page or from character creation moves focus into the main pane; see
  // `useScreenFocus` for why that is a mount-time question rather than a tab-change one.
  useScreenFocus(mainRef)

  return (
    <div className={`app-shell${rail ? '' : ' app-shell-no-rail'}`}>
      {/*
        The first thing a keyboard reaches. The Raids rail comes before the section tabs in the
        source, and the keyboard-only participant in the usability study spent a session's worth of
        presses inside a rail and never reached the tab he came for. Two keystrokes clear it.
      */}
      <a className="skip-link" href="#app-main">
        Skip to the main content
      </a>
      {rail && (
        <aside className="rail" aria-label="Character summary">
          {rail}
        </aside>
      )}
      {/* `tabIndex={-1}` so the skip link and the focus effect above can land on it, not to put it in
          the tab order. */}
      <main className="app-main" id="app-main" ref={mainRef} tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-bar">
            {/* Named by its words with where it goes added after them, so the name a sighted user
                would say ("Project Defeat") still starts the name a screen reader hears. */}
            <button
              type="button"
              className="brand"
              onClick={onHome}
              aria-label="Project Defeat, back to the front page"
              data-testid="brand-home"
            >
              Project <span>Defeat</span>
            </button>
            <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
          </div>
        </header>
        {/* Under the bar rather than in it, as in the prototypes: the bar stays on screen as you
            scroll, and a line of sources stuck to the top of a phone would cost a third of it. */}
        <div className="topbar-line">
          <PhaseChip />
          {provenance}
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
