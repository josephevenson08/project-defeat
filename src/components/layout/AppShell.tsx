import type { ReactNode } from 'react'
import { TabNav, type TabDefinition } from './TabNav'

type AppShellProps<T extends string> = {
  children: ReactNode
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}

export function AppShell<T extends string>({ children, tabs, activeTab, onTabChange }: AppShellProps<T>) {
  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Local MVP</p>
          <h1>Project Defeat</h1>
          <p>A local simulator and planning prototype for MMO-style character builds.</p>
        </div>
        <div className="hero-badge">
          <span>Prototype</span>
          <strong>Combat Lab</strong>
        </div>
      </header>
      <TabNav tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      <div className="dashboard-grid">{children}</div>
    </main>
  )
}
