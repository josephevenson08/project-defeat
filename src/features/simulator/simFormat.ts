import type { ProvenanceSource } from '../../components/ui/Provenance'
import { DPS_REFERENCE_READ_ON, DPS_REFERENCE_URL, getDpsReference } from '../../domain/simulation/dpsReference'
import type { TbcClass, TbcSpec } from '../../domain/character/characterTypes'
import { defaultSimulationTarget } from '../../domain/simulation/sampleEncounters'
import type { SimulationResult } from './simulationTypes'

/** 1348.25 → "1,348.3" at one decimal. Grouped, because the numbers on this tab run to five figures. */
export const formatNumber = (n: number, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** "+12.3" or "−4.0", with a real minus sign. */
export const formatSigned = (n: number, decimals = 1) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${formatNumber(Math.abs(n), decimals)}`

/**
 * A breakdown value at the precision its size deserves: 0.42 and 3.25 keep two decimals, 25.4 keeps
 * one, 12,345 none. The breakdown mixes rates, percentages and health pools in one list.
 */
export function formatBreakdownValue(value: number) {
  const fraction = value % 1 !== 0
  const size = Math.abs(value)
  return formatNumber(value, fraction && size < 10 ? 2 : fraction && size < 1000 ? 1 : 0)
}

/** The unit an upgrade's gain is counted in, from what the estimate measures. */
export const metricUnit = (metric: SimulationResult['metricLabel'] | string) =>
  metric === 'Estimated Healing' ? 'HPS' : metric === 'Effective Health' ? 'Effective Health' : 'DPS'

/** "Fury warriors", "Beast Mastery hunters": the people a spec's observed average is made of. */
export const specPlayers = (className: TbcClass, spec: TbcSpec) => `${spec} ${className.toLowerCase()}s`

/**
 * The estimate against what players of this spec average on archon.gg, or nothing for a spec with no
 * reference (healers and tanks) or an estimate of zero.
 */
export function versusObserved(className: TbcClass, spec: TbcSpec, scoreExact: number) {
  const reference = getDpsReference(className, spec)
  if (!reference || scoreExact <= 0) return undefined
  const ratio = reference.dps / scoreExact
  return {
    observed: reference.dps,
    ratio,
    text:
      ratio >= 1
        ? `${ratio.toFixed(2)}× below what ${specPlayers(className, spec)} average`
        : `${(1 / ratio).toFixed(2)}× above what ${specPlayers(className, spec)} average, which the model should never be`,
  }
}

/** Where the Simulation tab's numbers come from, for the line under the top bar. */
export const simulationSources: readonly ProvenanceSource[] = [
  { name: `one fixed encounter, a generic level ${defaultSimulationTarget.level} raid boss` },
  { name: 'coefficients and talent builds from wowsims', href: 'https://github.com/wowsims/tbc', verb: 'ingested' },
  { name: 'archon.gg logs', href: DPS_REFERENCE_URL, readOn: DPS_REFERENCE_READ_ON, verb: 'read' },
]
