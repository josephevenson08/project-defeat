import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
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
      <div className="dashboard-grid">{children}</div>
    </main>
  )
}
