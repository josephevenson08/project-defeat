import talentBuilds from './talentBuilds.json' with { type: 'json' }
import {
  TALENT_POINTS_AT_70,
  pointsInTree,
  pointsSpent,
  ruleBreaks,
  whyBlocked,
  whyCannotRemove,
  type Talent,
  type TalentPoints,
  type TalentTree,
} from './talentTypes'

/**
 * The rules behind the Character Planner's Talents tab (port step 6, 2026-10-22): the prototype's
 * `talent-common.js` over any class's trees. A talent's state in the window, learning and unlearning
 * a point with the reason when the game would refuse, "What's off" (a stored build's broken rules,
 * grouped for reading, each with its fix), the talents "Show where" lights, and wowsims' preset for a
 * spec where it has one.
 */

/** Gold when full, green when it holds points or can take one, grey when locked. */
export type TalentCellState = 'max' | 'part' | 'open' | 'locked'

/** A talent holding points against a rule: a prerequisite below its rank wins over a row short of points. */
export type TalentBreakKind = 'prerequisite' | 'row'

export type TalentCell = {
  rank: number
  state: TalentCellState
  broken?: TalentBreakKind
  /** Why it can't take a point, when it is locked. */
  locked?: string
}

export function findTalent(trees: readonly TalentTree[], id: number): { tree: TalentTree; talent: Talent } | undefined {
  for (const tree of trees) {
    const talent = tree.talents.find((entry) => entry.id === id)
    if (talent) return { tree, talent }
  }
  return undefined
}

/** "9 / 39 / 0": the points in each tree, in the trees' order. */
export function talentSplit(trees: readonly TalentTree[], points: TalentPoints): string {
  return trees.map((tree) => pointsInTree(tree, points)).join(' / ')
}

export function pointsLeft(trees: readonly TalentTree[], points: TalentPoints): number {
  return TALENT_POINTS_AT_70 - pointsSpent(trees, points)
}

/** Every talent holding points against a rule, and which rule. */
export function brokenTalents(trees: readonly TalentTree[], points: TalentPoints): Map<number, TalentBreakKind> {
  const broken = new Map<number, TalentBreakKind>()
  for (const brk of ruleBreaks(trees, points)) {
    if (broken.get(brk.talentId) !== 'prerequisite') broken.set(brk.talentId, brk.kind)
  }
  return broken
}

export function talentCell(
  trees: readonly TalentTree[],
  tree: TalentTree,
  talent: Talent,
  points: TalentPoints,
  broken: ReadonlyMap<number, TalentBreakKind>,
): TalentCell {
  const rank = points[talent.id] ?? 0
  const blocked = rank < talent.maxRank ? whyBlocked(trees, tree, talent, points) : undefined
  const state: TalentCellState = rank >= talent.maxRank ? 'max' : rank > 0 ? 'part' : blocked ? 'locked' : 'open'
  return { rank, state, broken: broken.get(talent.id), locked: state === 'locked' ? blocked : undefined }
}

/** A point learned or unlearned, or the points unchanged with the reason the game would give. */
export type TalentChange = { points: TalentPoints; why?: string }

export function learnPoint(trees: readonly TalentTree[], id: number, points: TalentPoints): TalentChange {
  const found = findTalent(trees, id)
  if (!found) return { points, why: 'Unknown talent.' }
  const why = whyBlocked(trees, found.tree, found.talent, points)
  if (why) return { points, why }
  return { points: { ...points, [id]: (points[id] ?? 0) + 1 } }
}

export function unlearnPoint(trees: readonly TalentTree[], id: number, points: TalentPoints): TalentChange {
  const found = findTalent(trees, id)
  if (!found) return { points, why: 'Unknown talent.' }
  const why = whyCannotRemove(found.tree, found.talent, points)
  if (why) return { points, why }
  const next: Record<number, number> = { ...points, [id]: (points[id] ?? 0) - 1 }
  if (next[id] === 0) delete next[id]
  return { points: next }
}

/** A talent raised towards a rank one legal point at a time (a fix), stopping at the first rule that says no. */
export function raiseTalent(trees: readonly TalentTree[], id: number, rank: number, points: TalentPoints) {
  let current = points
  let why: string | undefined
  while ((current[id] ?? 0) < rank) {
    const change = learnPoint(trees, id, current)
    if (change.why) {
      why = change.why
      break
    }
    current = change.points
  }
  return { points: current, added: (current[id] ?? 0) - (points[id] ?? 0), why }
}

/**
 * One line of "What's off": a prerequisite below its rank, with the fix that raises it, or a tree whose
 * upper rows are short of points, with the row the short talents start on (`upTo`, 0-indexed) so
 * "Show where" can light the talents above it.
 */
export type TalentProblem =
  | { kind: 'prerequisite'; talentIds: readonly number[]; text: string; fix: { talentId: number; rank: number; label: string } }
  | { kind: 'rows'; tree: string; short: number; upTo: number; talentIds: readonly number[]; text: string }

const andList = (names: readonly string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0])

/**
 * The rules a build breaks, grouped for reading: one line per missing prerequisite, then one per tree
 * whose upper rows are short. A build put together a point at a time breaks none; a stored one can
 * (every wowsims preset leaves out the filler points that open its deeper rows), and it is shown as
 * stored rather than filled in.
 */
export function talentProblems(trees: readonly TalentTree[], points: TalentPoints): TalentProblem[] {
  const breaks = ruleBreaks(trees, points)
  const problems: TalentProblem[] = []
  for (const brk of breaks) {
    if (brk.kind !== 'prerequisite') continue
    problems.push({
      kind: 'prerequisite',
      talentIds: [brk.talentId],
      text: `${brk.talent} needs ${brk.needs} at ${brk.rank}/${brk.max}; it has ${brk.has}.`,
      fix: { talentId: brk.needsId, rank: brk.rank, label: `Add ${brk.needs} to ${brk.rank}/${brk.max}` },
    })
  }
  for (const tree of trees) {
    const rows = breaks.filter((brk) => brk.kind === 'row' && brk.tree === tree.spec)
    if (rows.length === 0) continue
    // `row` is the game's row, 1 to 9.
    const first = Math.min(...rows.map((brk) => (brk.kind === 'row' ? brk.row : 0)))
    const last = Math.max(...rows.map((brk) => (brk.kind === 'row' ? brk.row : 0)))
    const short = Math.max(...rows.map((brk) => (brk.kind === 'row' ? brk.needs - brk.has : 0)))
    const names = [...new Set(rows.map((brk) => brk.talent))]
    const above = first - 1 > 1 ? `rows 1–${first - 1}` : 'row 1'
    const sit = last > first ? `rows ${first}–${last}, which need` : `row ${first}, which needs`
    problems.push({
      kind: 'rows',
      tree: tree.spec,
      short,
      upTo: first - 1,
      talentIds: rows.map((brk) => brk.talentId),
      text: `${tree.spec} is ${short} point${short > 1 ? 's' : ''} short in ${above}: ${andList(names)} ${names.length > 1 ? 'sit' : 'sits'} in ${sit} more points above.`,
    })
  }
  return problems
}

/** What "Show where" lights: the talents above a tree's short rows that can take a point now. */
export type TalentHint = { tree: string; upTo: number }

export function hintedTalents(trees: readonly TalentTree[], points: TalentPoints, hint: TalentHint | undefined): Set<number> {
  const tree = hint && trees.find((entry) => entry.spec === hint.tree)
  if (!hint || !tree) return new Set()
  return new Set(
    tree.talents
      .filter((talent) => talent.row < hint.upTo && (points[talent.id] ?? 0) < talent.maxRank && !whyBlocked(trees, tree, talent, points))
      .map((talent) => talent.id),
  )
}

/** A hint stays on while its tree is still short of points; once the rows are filled it has nothing to show. */
export function hintStillLive(trees: readonly TalentTree[], points: TalentPoints, hint: TalentHint | undefined): boolean {
  return !!hint && talentProblems(trees, points).some((problem) => problem.kind === 'rows' && problem.tree === hint.tree)
}

/*
 * wowsims' presets for 17 builds, as stored: wowsims lists only the talents its simulator reads, so
 * each leaves out the filler points that open its deeper rows, and the window shows what that breaks.
 * Cast at the boundary, as `bestCase.ts` does: TypeScript otherwise infers every build's own keys.
 */
type StoredBuild = { className: string; spec: string; source: string; points: Record<string, number> }
const storedBuilds = talentBuilds.builds as unknown as readonly StoredBuild[]

export type TalentPreset = { className: string; spec: string; source: string; points: TalentPoints }

export function talentPresetFor(className: string, spec: string): TalentPreset | undefined {
  const build = storedBuilds.find((entry) => entry.className === className && entry.spec === spec)
  if (!build) return undefined
  return {
    className,
    spec,
    source: build.source,
    points: Object.fromEntries(Object.entries(build.points).map(([id, rank]) => [Number(id), rank])),
  }
}

export const talentPresetCount = storedBuilds.length
export const talentPresetUpstream = talentBuilds.upstream
