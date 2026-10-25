import { useRef, type ReactNode } from 'react'
import { useScreenFocus } from '../../lib/useScreenFocus'
import { PhaseChip } from '../ui/PhaseChip'
import { SceneSwitch } from '../../features/scene/SceneSwitch'
import { TabNav, type TabDefinition } from './TabNav'

type AppShellProps<T extends string> = {
  children: ReactNode
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  /** The wordmark goes back to the front door, as the prototypes' does. */
  onHome: () => void
  /** Where this screen's numbers come from (a `Provenance`), on the line under the sections. */
  provenance?: ReactNode
}

/**
 * The page's frame: the top bar and one main pane that swaps content.
 *
 * The top bar is the prototypes' header (2026-10-12, `docs/design/PORT-PLAN.md` step 0): the
 * wordmark, the sections, and under them the line every screen carries — the game and phase every
 * number is for, and, once a tab is ported, where its numbers come from. There used to be a left
 * rail too, last for the list of raids; the ported Raids tab picks its raid from its own header.
 */
export function AppShell<T extends string>({ children, tabs, activeTab, onTabChange, onHome, provenance }: AppShellProps<T>) {
  const mainRef = useRef<HTMLElement>(null)
  // Arriving here from the front page or from character creation moves focus into the main pane; see
  // `useScreenFocus` for why that is a mount-time question rather than a tab-change one.
  useScreenFocus(mainRef)

  return (
    <div className="app-shell app-shell-no-rail">
      {/*
        The first thing a keyboard reaches, landing on the main pane. It was the way past a rail of
        controls in front of the sections (the usability study's keyboard-only participant spent a
        session's worth of presses in one); the rail is gone, and the link stays as the standard
        bypass for anyone whose traversal starts at the top of the document.
      */}
      <a className="skip-link" href="#app-main">
        Skip to the main content
      </a>
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
            {/* The optional 3D scene (port step 7). In the bar rather than on the line under it, where on a
                phone it took a row of its own and pushed the first screen down: here it shares the
                wordmark's row. */}
            <SceneSwitch />
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
