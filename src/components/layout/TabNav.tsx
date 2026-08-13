export type TabDefinition<T extends string> = {
  id: T
  label: string
}

type TabNavProps<T extends string> = {
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onChange: (tab: T) => void
  /**
   * Distinguishes this bar from the others for assistive tech. Two nav landmarks both announcing
   * "Main sections" is worse than one, which is what happened when the planner grew a second level.
   */
  ariaLabel?: string
  /** Lets a nested bar be styled as subordinate to the one above it without a second component. */
  className?: string
}

export function TabNav<T extends string>({ tabs, activeTab, onChange, ariaLabel = 'Main sections', className = 'tab-nav' }: TabNavProps<T>) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav-button ${tab.id === activeTab ? 'tab-nav-button-active' : ''}`.trim()}
          aria-current={tab.id === activeTab ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
