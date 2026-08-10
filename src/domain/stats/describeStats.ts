import { statLabels, type StatBlock } from './statTypes'

const LABEL_BY_KEY = new Map<string, string>(statLabels)

/** A negative contribution is real — Fel Strength Elixir costs 10 Stamina — and must not read "+-10". */
function signed(value: number) {
  return value < 0 ? String(value) : `+${value}`
}

/**
 * A partial stat block as readable text: `+12 Strength, +4 Crit Rating`.
 *
 * Rounded, because the percentage-derived values are stored as the rating that buys them at level 70
 * and carry decimals — Moonkin Aura's 5% is 110.5 spell crit rating, which is a true total and a
 * terrible readout. The unrounded value is what reaches the stat totals; this is only the label.
 *
 * Zero-valued keys are dropped. A gem that lists "+0 Spirit" is describing an absence, and the
 * absence of a line says it better.
 */
export function describeStats(stats: Partial<StatBlock> | undefined): string {
  if (!stats) return ''

  return Object.entries(stats)
    .filter(([, value]) => Math.round(value ?? 0) !== 0)
    .map(([key, value]) => `${signed(Math.round(value ?? 0))} ${LABEL_BY_KEY.get(key) ?? key}`)
    .join(', ')
}
