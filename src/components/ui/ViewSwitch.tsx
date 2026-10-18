export type ViewOption<T extends string> = {
  id: T
  label: string
  /** A few words under the label on wider screens ("Wowhead's three lists"); hidden on a phone. */
  hint?: string
  /**
   * A count on the button, kept on a phone ("Where it drops 13"), with what it counts for assistive
   * tech: "13 upgrades left" makes the button "Where it drops, 13 upgrades left". Nothing at zero.
   */
  count?: { n: number; label: string }
}

type ViewSwitchProps<T extends string> = {
  /** Names the group for assistive tech: "Show". */
  label: string
  options: readonly ViewOption<T>[]
  value: T
  onChange: (view: T) => void
}

/**
 * Two or three views of one tab, as one pill with the current view filled.
 *
 * Several decided designs kept a second design behind a switch rather than choosing between them:
 * "The board / Against the logs" on Spec Tier Lists, "For me / For my raid" on Raids, "Level it /
 * Which two" on Professions. Toggle buttons (`aria-pressed`) rather than tabs, as in the prototypes:
 * each press swaps the whole view below, and the buttons are reached in order like any other.
 */
export function ViewSwitch<T extends string>({ label, options, value, onChange }: ViewSwitchProps<T>) {
  return (
    <div className="view-switch" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          data-testid={`view-${option.id}`}
          aria-label={option.count?.n ? `${option.label}, ${option.count.label}` : undefined}
          title={option.count?.n ? option.count.label : undefined}
        >
          {option.label}
          {option.hint && <small>{option.hint}</small>}
          {option.count?.n ? <span className="view-switch-count">{option.count.n}</span> : null}
        </button>
      ))}
    </div>
  )
}
