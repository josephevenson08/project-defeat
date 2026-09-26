import { useRef, type ReactNode } from 'react'
import { useScreenFocus } from '../../lib/useScreenFocus'
import { TabNav, type TabDefinition } from './TabNav'

type AppShellProps<T extends string> = {
  children: ReactNode
  /**
   * Persistent left-rail content — the stat readout. Omitted on sections where there is no character
   * in play: a raid loot table and a profession guide have no stats to keep glancing at, and a rail
   * of numbers belonging to nothing is worse than no rail.
   */
  rail?: ReactNode
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}

/**
 * Discord's skeleton: a persistent left rail that never navigates away, one main pane that swaps
 * content, and detail shown beside what it belongs to rather than as modes you travel between.
 *
 * The rail holds the stat readout deliberately — totals are the thing you keep glancing at while
 * changing gear, so they must not be a tab you have to leave the gear behind to reach.
 */
export function AppShell<T extends string>({ children, rail, tabs, activeTab, onTabChange }: AppShellProps<T>) {
  const mainRef = useRef<HTMLElement>(null)
  // Arriving here from the front page or from character creation moves focus into the main pane; see
  // `useScreenFocus` for why that is a mount-time question rather than a tab-change one.
  useScreenFocus(mainRef)

  return (
    <div className={`app-shell${rail ? '' : ' app-shell-no-rail'}`}>
      {/*
        The first thing a keyboard reaches, and the reason it exists: the rail holds twenty-odd
        controls — four selects, ten profession toggles, the stat list — and it comes before the
        section tabs in the source. The keyboard-only participant spent an entire session's worth of
        presses inside it and never reached the tab he came for. Two keystrokes now clear it.
      */}
      <a className="skip-link" href="#app-main">
        Skip to the main content
      </a>
      {rail && (
        <aside className="rail" aria-label="Character summary">
          <div className="rail-brand">
            <h1>Project Defeat</h1>
            <p className="rail-brand-sub">TBC Classic · Phase 2</p>
          </div>
          {rail}
        </aside>
      )}
      {/* `tabIndex={-1}` so the skip link and the focus effect above can land on it, not to put it in
          the tab order. */}
      <main className="app-main" id="app-main" ref={mainRef} tabIndex={-1}>
        <header className="topbar">
          <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
