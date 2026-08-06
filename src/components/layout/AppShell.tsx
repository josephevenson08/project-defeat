import type { ReactNode } from 'react'
import { TabNav, type TabDefinition } from './TabNav'

type AppShellProps<T extends string> = {
  children: ReactNode
  /** Persistent left-rail content. This is where the stat readout lives. */
  rail: ReactNode
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}

/**
 * Discord's skeleton: a persistent left rail that never navigates away, one main pane that swaps
 * content, and popups layered over the top rather than modes you travel between.
 *
 * The rail holds the stat readout deliberately — totals are the thing you keep glancing at while
 * changing gear, so they must not be a tab you have to leave the gear behind to reach.
 */
export function AppShell<T extends string>({ children, rail, tabs, activeTab, onTabChange }: AppShellProps<T>) {
  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Character summary">
        <div className="rail-brand">
          <h1>Project Defeat</h1>
          <p className="rail-brand-sub">TBC Classic · Phase 2</p>
        </div>
        {rail}
      </aside>
      <main className="app-main">
        <header className="topbar">
          <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
