export type TabDefinition<T extends string> = {
  id: T
  label: string
}

type TabNavProps<T extends string> = {
  tabs: readonly TabDefinition<T>[]
  activeTab: T
  onChange: (tab: T) => void
}

export function TabNav<T extends string>({ tabs, activeTab, onChange }: TabNavProps<T>) {
  return (
    <nav className="tab-nav" aria-label="Main sections">
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
