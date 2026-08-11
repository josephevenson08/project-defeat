export type Talent = {
  /** Wowhead's talent id, stable across ranks. */
  id: number
  name: string
  /** Wowhead icon slug. No art in the repo yet, but the slug is what a later icon pass would key on. */
  icon: string
  /** 0-indexed. The game shows these as rows 1-9, and a row is unlocked by 5 points per row above it. */
  row: number
  /** 0-indexed, 0-3 left to right. */
  column: number
  maxRank: number
  /** The spell behind each rank, in order. */
  spellIds: readonly number[]
  /** One description per rank — the numbers change with rank, so a single string would be wrong for all but one. */
  rankDescriptions: readonly string[]
  /** Talents that must be filled first, and to what rank. */
  requires: readonly { id: number; rank: number }[]
}

export type TalentTree = {
  /** Wowhead's tree id. */
  id: number
  /** The spec the tree is named for — Arms, Fury, Protection. */
  spec: string
  talents: readonly Talent[]
}

export type TalentData = {
  className: string
  trees: readonly TalentTree[]
}

/** Points spent per talent, keyed by talent id. Absent means zero. */
export type TalentPoints = Readonly<Record<number, number>>

/**
 * TBC gives 41 points at level 70: one per level from 10 to 70, plus one from the level 10 quest.
 * The deepest row of a tree therefore needs 40 points in that tree to reach.
 */
export const TALENT_POINTS_AT_70 = 41

/** A row is unlocked once this many points are in the tree — 5 per row above it. */
export const POINTS_PER_ROW = 5

export function pointsInTree(tree: TalentTree, points: TalentPoints): number {
  return tree.talents.reduce((total, talent) => total + (points[talent.id] ?? 0), 0)
}

export function pointsSpent(trees: readonly TalentTree[], points: TalentPoints): number {
  return trees.reduce((total, tree) => total + pointsInTree(tree, points), 0)
}

/**
 * Why a talent cannot take another point, or `undefined` when it can.
 *
 * Returned as a reason rather than a boolean because every one of these is worth *saying*: a
 * disabled talent with no explanation is the most common complaint about talent calculators.
 */
export function whyBlocked(
  allTrees: readonly TalentTree[],
  tree: TalentTree,
  talent: Talent,
  points: TalentPoints,
  totalPoints = TALENT_POINTS_AT_70,
): string | undefined {
  const current = points[talent.id] ?? 0
  if (current >= talent.maxRank) return `Already at ${talent.maxRank}/${talent.maxRank}.`

  // The budget is spent across all three trees, not per tree — a Fury build that has put 41 points
  // into Fury and Arms cannot then start Protection.
  if (pointsSpent(allTrees, points) >= totalPoints) return 'No points left.'

  const spentHere = pointsInTree(tree, points)
  const required = talent.row * POINTS_PER_ROW
  if (spentHere < required) return `Needs ${required} points in ${tree.spec} — you have ${spentHere}.`

  for (const requirement of talent.requires) {
    const prerequisite = tree.talents.find((entry) => entry.id === requirement.id)
    if (!prerequisite) continue
    if ((points[requirement.id] ?? 0) < requirement.rank) {
      return `Needs ${prerequisite.name} at ${requirement.rank}/${prerequisite.maxRank} first.`
    }
  }

  return undefined
}

/**
 * Whether a point can be removed. Taking one out from under a talent that depends on it — either by
 * prerequisite or by dropping the tree below a deeper talent's row requirement — has to be refused,
 * or the tree ends up in a state the game would never allow.
 */
export function canRemovePoint(tree: TalentTree, talent: Talent, points: TalentPoints): boolean {
  const current = points[talent.id] ?? 0
  if (current <= 0) return false

  const next: Record<number, number> = { ...points, [talent.id]: current - 1 }

  // Nothing may still be relying on this talent as a prerequisite.
  for (const other of tree.talents) {
    if ((next[other.id] ?? 0) === 0) continue
    const requirement = other.requires.find((entry) => entry.id === talent.id)
    if (requirement && next[talent.id] < requirement.rank) return false
  }

  /*
   * And no spent talent may end up below its row requirement.
   *
   * Kept as a guard, but note it cannot currently fire: a row needs `row * 5` points *in the tree*,
   * counting the deep point itself, so placing one always leaves the total at least one above the
   * requirement — and removing a single point therefore always leaves exactly enough. It would start
   * mattering the moment the requirement counted only points in shallower rows, or if removal ever
   * took more than one point at a time.
   */
  const spentAfter = pointsInTree(tree, next)
  return !tree.talents.some((other) => (next[other.id] ?? 0) > 0 && spentAfter < other.row * POINTS_PER_ROW)
}
