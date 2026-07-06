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

/** Applies a percentage bonus (e.g. 0.1 for +10%) to each named stat, compounding with the stat's current total. */
export function applyStatMultipliers(base: StatBlock, multipliers: Partial<Record<keyof StatBlock, number>> = {}) {
  const next = { ...base }

  Object.entries(multipliers).forEach(([key, value]) => {
    const statKey = key as keyof StatBlock
    next[statKey] = next[statKey] * (1 + (value ?? 0))
  })

  return next
}
