import { emptyStats, type StatBlock } from './statTypes'

export function createEmptyStats(): StatBlock {
  return { ...emptyStats }
}

export function addStats(base: StatBlock, addition: Partial<StatBlock> = {}) {
  const next = { ...base }

  Object.entries(addition).forEach(([key, value]) => {
    next[key as keyof StatBlock] += value ?? 0
  })

  return next
}

/**
 * Scales a partial stat block by a fraction, for a bonus that only applies part of the time — an
 * item proc or on-use averaged over its uptime. Values are left unrounded so that a small average
 * contribution is not quantised away before the simulation differences it.
 */
export function scaleStats(stats: Partial<StatBlock> = {}, factor: number): Partial<StatBlock> {
  const next: Partial<StatBlock> = {}

  Object.entries(stats).forEach(([key, value]) => {
    next[key as keyof StatBlock] = (value ?? 0) * factor
  })

  return next
}

/** Applies a percentage bonus (e.g. 0.1 for +10%) to each named stat, compounding with the stat's current total. */
export function applyStatMultipliers(base: StatBlock, multipliers: Partial<Record<keyof StatBlock, number>> = {}) {
  const next = { ...base }

  Object.entries(multipliers).forEach(([key, value]) => {
    const statKey = key as keyof StatBlock
    next[statKey] = next[statKey] * (1 + (value ?? 0))
  })

  return next
}
