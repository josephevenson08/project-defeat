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
 * **61**, and it read 41 until 2026-08-19 — a real bug that made every build in the app unbuildable.
 *
 * The old comment gave the right derivation and the wrong answer: "one per level from 10 to 70" is
 * 61 levels, not 41. 41 is the number of points needed to reach the *bottom* of a single tree, which
 * is a different quantity that happens to appear near talent trees constantly.
 *
 * The formula is one point per level starting at 10, so `level - 9`. Anchored on a verified data
 * point rather than recall: Wowhead's level-60 Classic talent guides publish builds as 17/34/0,
 * 20/31/0, 31/20/0 — every one summing to **51**, and 60 - 9 = 51. At 70 the same formula gives 61,
 * which is why TBC builds are written 17/44/0 and 33/28/0.
 *
 * Worth knowing: that Classic page was reached through a `/tbc/` URL. Wowhead redirected it, and its
 * title says "WoW Classic" with 71 `/classic/` links and no `/tbc/` ones — the same wrong-expansion
 * trap this repo already records for the enchant guides. The 51 is correct *for level 60*; taking it
 * as TBC's figure would have replaced one wrong number with another.
 */
export const TALENT_POINTS_AT_70 = 61

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
 * Points spent in the rows *above* a row, in one tree.
 *
 * Learning a point is gated on the whole tree (the game's "Requires 25 points in Fury Talents"), but a
 * build is only legal if every spent talent has its row's worth of points **above** it: the deep point
 * cannot count towards its own gate. The two agree for any build put together a point at a time, and
 * part ways the moment a point is taken back out from above a deep talent.
 */
export function pointsAboveRow(tree: TalentTree, row: number, points: TalentPoints): number {
  return tree.talents.reduce((total, talent) => total + (talent.row < row ? points[talent.id] ?? 0 : 0), 0)
}

/**
 * Whether a point can be removed. Taking one out from under a talent that depends on it — either by
 * prerequisite or by leaving a deeper talent without its row's worth of points above it — has to be
 * refused, or the tree ends up in a state the game would never allow.
 *
 * **Refused only when the removal breaks something that holds now.** A build that already breaks a
 * rule (every stored wowsims preset does, see `ruleBreaks`) would otherwise refuse every removal above
 * the broken talent, and the only way out would be Reset.
 */
export function canRemovePoint(tree: TalentTree, talent: Talent, points: TalentPoints): boolean {
  const current = points[talent.id] ?? 0
  if (current <= 0) return false

  const next: Record<number, number> = { ...points, [talent.id]: current - 1 }

  // Nothing may still be relying on this talent as a prerequisite.
  for (const other of tree.talents) {
    if ((next[other.id] ?? 0) === 0) continue
    const requirement = other.requires.find((entry) => entry.id === talent.id)
    if (requirement && current >= requirement.rank && next[talent.id] < requirement.rank) return false
  }

  /*
   * And no deeper talent may be left short of the points above its row.
   *
   * Until 2026-10-09 this counted every point in the tree after the removal, which counts the deep
   * talent towards its own gate. With exactly 40 points in Fury's first eight rows and Rampage in the
   * ninth, it let a Cruelty point out — 39 above Rampage, one short — where the game's calculators
   * refuse. The old comment here noted the guard "cannot currently fire" for exactly that reason.
   */
  return !tree.talents.some((other) => {
    if (other.row <= talent.row || (next[other.id] ?? 0) === 0) return false
    const gate = other.row * POINTS_PER_ROW
    return pointsAboveRow(tree, other.row, points) >= gate && pointsAboveRow(tree, other.row, next) < gate
  })
}

/** One rule a build breaks: a prerequisite below its rank, or a talent short of the points above its row. */
export type TalentRuleBreak =
  | { kind: 'prerequisite'; tree: string; talent: string; needs: string; rank: number; max: number; has: number }
  | { kind: 'row'; tree: string; talent: string; row: number; needs: number; has: number }

/**
 * Every rule a set of points breaks, in tree and row order. Empty for any build put together a point
 * at a time through `whyBlocked` and `canRemovePoint`.
 *
 * It exists for the stored wowsims presets: they list only the talents wowsims' simulator reads, so
 * each leaves out the filler points that open its deeper rows (and Fury leaves out Enrage, which Flurry
 * needs). They are kept as they are and their breaks recorded, not filled in — filling them would mean
 * choosing talents upstream never chose.
 */
export function ruleBreaks(trees: readonly TalentTree[], points: TalentPoints): TalentRuleBreak[] {
  const breaks: TalentRuleBreak[] = []
  for (const tree of trees) {
    for (const talent of [...tree.talents].sort((a, b) => a.row - b.row || a.column - b.column)) {
      if ((points[talent.id] ?? 0) === 0) continue
      for (const requirement of talent.requires) {
        const prerequisite = tree.talents.find((entry) => entry.id === requirement.id)
        const has = points[requirement.id] ?? 0
        if (prerequisite && has < requirement.rank) {
          breaks.push({ kind: 'prerequisite', tree: tree.spec, talent: talent.name, needs: prerequisite.name, rank: requirement.rank, max: prerequisite.maxRank, has })
        }
      }
      const above = pointsAboveRow(tree, talent.row, points)
      if (above < talent.row * POINTS_PER_ROW) {
        breaks.push({ kind: 'row', tree: tree.spec, talent: talent.name, row: talent.row + 1, needs: talent.row * POINTS_PER_ROW, has: above })
      }
    }
  }
  return breaks
}
