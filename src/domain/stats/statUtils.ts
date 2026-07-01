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
