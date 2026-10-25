import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { FloatingTip } from '../../components/ui/FloatingTip'
import { SHEET_BELOW, useHoverTip } from '../../components/ui/useHoverTip'
import { sumGearStats } from '../../domain/gear/gearStats'
import { getSpecIcon } from '../../domain/raidcomp'
import { hitCapWords, hitStanding, type HitCap } from '../../domain/simulation/hitCap'
import { getTalentData } from '../../domain/talents/sampleTalents'
import {
  POINTS_PER_ROW,
  TALENT_POINTS_AT_70,
  pointsInTree,
  pointsSpent,
  type Talent,
  type TalentPoints,
  type TalentTree,
} from '../../domain/talents/talentTypes'
import {
  brokenTalents,
  findTalent,
  hintStillLive,
  hintedTalents,
  learnPoint,
  raiseTalent,
  talentCell,
  talentPresetFor,
  talentProblems,
  talentSplit,
  unlearnPoint,
  type TalentHint,
  type TalentProblem,
} from '../../domain/talents/talentWindow'
import type { CharacterProfile } from '../character/characterTypes'
import type { EquippedGear } from '../gear/gearTypes'
import { talentSimStatus } from './talentWords'
import type { TalentsSession } from './talentsSession'
import { cue } from '../../lib/motion'

type TalentsPanelProps = {
  character: CharacterProfile
  points: TalentPoints
  onChange: (points: TalentPoints) => void
  /** The hit rating the gear has to bring, which Precision and its kin lower; nothing for a healer. */
  hitCap?: HitCap
  gear: EquippedGear
  session: TalentsSession
  onSession: (session: TalentsSession) => void
}

/** Nine rows, 0-indexed in the data: the deepest is the 41-point talent a build is usually named after. */
const ROWS = 9

/*
 * Each tree's colour, for the glow at the top of its dark ground: the prototype's three Warrior
 * colours (Arms leather, Fury blood, Protection steel), and one in the same spirit for every other tree.
 */
const TREE_RGB: Record<string, string> = {
  'Druid|Balance': '110, 120, 220',
  'Druid|Feral': '210, 130, 50',
  'Druid|Restoration': '80, 180, 90',
  'Hunter|Beast Mastery': '190, 90, 60',
  'Hunter|Marksmanship': '70, 160, 150',
  'Hunter|Survival': '140, 150, 60',
  'Mage|Arcane': '160, 90, 220',
  'Mage|Fire': '230, 100, 40',
  'Mage|Frost': '90, 170, 230',
  'Paladin|Holy': '230, 190, 80',
  'Paladin|Protection': '80, 130, 205',
  'Paladin|Retribution': '210, 90, 50',
  'Priest|Discipline': '220, 200, 140',
  'Priest|Holy': '240, 210, 120',
  'Priest|Shadow': '130, 70, 190',
  'Rogue|Assassination': '90, 170, 70',
  'Rogue|Combat': '200, 70, 50',
  'Rogue|Subtlety': '90, 80, 170',
  'Shaman|Elemental': '70, 130, 220',
  'Shaman|Enhancement': '210, 150, 60',
  'Shaman|Restoration': '60, 170, 190',
  'Warlock|Affliction': '120, 170, 60',
  'Warlock|Demonology': '150, 70, 170',
  'Warlock|Destruction': '220, 80, 40',
  'Warrior|Arms': '176, 124, 64',
  'Warrior|Fury': '205, 64, 44',
  'Warrior|Protection': '80, 130, 205',
}

const iconUrl = (icon: string | undefined) => (icon ? `${import.meta.env.BASE_URL}icons/${icon}.jpg` : undefined)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const byPlace = (a: Talent, b: Talent) => a.row - b.row || a.column - b.column

/** One piece of a prerequisite's arrow, placed on the tree's grid: down a column, or across a row. */
type ArrowPiece = { key: string; column: string; row: string; shape: string }

/*
 * Most prerequisites sit straight above the talent they open; seven sit beside it in the same row
 * (Improved Holy Shield, Dual Wield Specialization), and Serrated Blades sits up and to the left of
 * Hemorrhage, which the game draws as an elbow: across its own row, then down.
 */
function arrowPieces(parent: Talent, child: Talent): Omit<ArrowPiece, 'key'>[] {
  if (parent.column === child.column) return [{ column: `${child.column + 1}`, row: `${parent.row + 1} / ${child.row + 2}`, shape: 'is-down' }]
  const across = child.column > parent.column ? 'is-right' : 'is-left'
  const columns = `${Math.min(parent.column, child.column) + 1} / ${Math.max(parent.column, child.column) + 2}`
  if (parent.row === child.row) return [{ column: columns, row: `${child.row + 1}`, shape: across }]
  return [
    { column: columns, row: `${parent.row + 1}`, shape: `${across} is-elbow` },
    { column: `${child.column + 1}`, row: `${parent.row + 1} / ${child.row + 2}`, shape: 'is-down' },
  ]
}

/** The talent the window shows under the frame until one is chosen: a broken prerequisite first. */
function defaultSelection(problems: readonly TalentProblem[], tree: TalentTree, points: TalentPoints): number {
  const missing = problems.find((problem) => problem.kind === 'prerequisite')
  if (missing) return missing.talentIds[0]
  const ordered = [...tree.talents].sort(byPlace)
  const taken = ordered.filter((talent) => (points[talent.id] ?? 0) > 0)
  return (taken.length ? taken[taken.length - 1] : ordered[0]).id
}

/**
 * A talent's game-style tooltip, in our own words: its name and rank, what it still needs in red,
 * this rank's text in gold and the next rank's, then what the simulator reads from it.
 */
function TalentTip({ className, tree, talent, points, hint }: { className: CharacterProfile['className']; tree: TalentTree; talent: Talent; points: TalentPoints; hint?: boolean }) {
  const rank = points[talent.id] ?? 0
  const needed = talent.row * POINTS_PER_ROW
  const status = talentSimStatus(className, talent, rank)
  return (
    <span className="item-tip talent-tip">
      <b className="item-tip-name">{talent.name}</b>
      <span className="talent-tip-rank">
        Rank {rank}/{talent.maxRank}
      </span>
      {pointsInTree(tree, points) < needed && (
        <span className="talent-tip-red">
          Requires {needed} points in {tree.spec} Talents
        </span>
      )}
      {talent.requires.map((requirement) => {
        const prerequisite = tree.talents.find((entry) => entry.id === requirement.id)
        if (!prerequisite || (points[requirement.id] ?? 0) >= requirement.rank) return null
        return (
          <span key={requirement.id} className="talent-tip-red">
            Requires {plural(requirement.rank, 'point')} in {prerequisite.name}
          </span>
        )
      })}
      <span className="talent-tip-desc">{talent.rankDescriptions[Math.max(0, rank - 1)]}</span>
      {rank > 0 && rank < talent.maxRank && (
        <>
          <span className="talent-tip-next">Next rank:</span>
          <span className="talent-tip-desc">{talent.rankDescriptions[rank]}</span>
        </>
      )}
      <span className={`talent-tip-sim is-${status.kind}`}>{status.text}</span>
      {hint && <span className="talent-tip-hint">Click to learn · right-click to unlearn</span>}
    </span>
  )
}

/**
 * The Character Planner's Talents tab (port step 6, 2026-10-22): design A, the game's talent window,
 * with design C's "What's off". Three trees side by side (one at a time on a phone, with tree tabs),
 * each on a dark ground with the spec's icon behind it; the talents as their icons with their rank,
 * gold when full, green when they hold or can take a point, grey when locked, and an arrow from each
 * prerequisite. Click learns a point and right-click unlearns one, refused where the game would refuse
 * with the reason said; hovering or focusing shows the tooltip, and the chosen talent's tooltip sits
 * under the frame with − and + for touch and keyboard. Each tree is one tab stop, moved around with
 * the arrow keys.
 *
 * **It opens untalented, as the app starts clean** (the owner's call, 2026-10-19): the prototype
 * opened on the wowsims Fury preset. "Load the <spec> preset" puts wowsims' preset in where it has one
 * (17 builds), as stored, so "What's off" lists the rules it breaks; the other specs say there is none.
 */
export function TalentsPanel({ character, points, onChange, hitCap, gear, session, onSession }: TalentsPanelProps) {
  const data = getTalentData(character.className)
  const [message, setMessage] = useState('')
  const [hint, setHint] = useState<TalentHint>()
  const tip = useHoverTip<number>()
  const buttons = useRef(new Map<number, HTMLButtonElement>())
  const offRef = useRef<HTMLElement>(null)
  // A fix's talent, focused once the fix button it pressed is gone (the browser would drop focus).
  const focusAfterFix = useRef<number>(undefined)
  const fromGear = useMemo(() => sumGearStats(gear), [gear])

  useEffect(() => {
    const id = focusAfterFix.current
    if (id === undefined) return
    focusAfterFix.current = undefined
    if (!offRef.current?.querySelector('[data-fix]')) buttons.current.get(id)?.focus()
  })

  if (!data) {
    return (
      <section className="panel talents-panel" aria-label="Talents">
        <p className="panel-copy" data-testid="talents-unavailable">
          Talent trees aren't in for {character.className} yet. Nothing is invented in the meantime.
        </p>
      </section>
    )
  }

  const trees = data.trees
  const spent = pointsSpent(trees, points)
  const left = TALENT_POINTS_AT_70 - spent
  const problems = talentProblems(trees, points)
  const broken = brokenTalents(trees, points)
  const liveHint = hintStillLive(trees, points, hint) ? hint : undefined
  const lit = hintedTalents(trees, points, liveHint)
  const ownTree = trees.find((tree) => tree.spec === character.spec) ?? trees[0]
  const shownTree = trees.find((tree) => tree.spec === session.tree) ?? ownTree
  const chosen = session.selected !== undefined ? findTalent(trees, session.selected) : undefined
  const selected = chosen ?? findTalent(trees, defaultSelection(problems, shownTree, points))!
  const preset = talentPresetFor(character.className, character.spec)
  const hit = hitCap ? Math.round(fromGear[hitCap.stat]) : 0
  const standing = hitCap ? hitStanding(hit, hitCap) : undefined

  function select(id: number) {
    const found = findTalent(trees, id)
    if (found && (session.selected !== id || session.tree !== found.tree.spec)) onSession({ tree: found.tree.spec, selected: id })
  }

  function act(id: number, direction: 1 | -1) {
    const found = findTalent(trees, id)
    if (!found) return
    select(id)
    const change = direction > 0 ? learnPoint(trees, id, points) : unlearnPoint(trees, id, points)
    if (change.why) {
      setMessage(`${direction > 0 ? "Can't learn" : "Can't unlearn"} ${found.talent.name}: ${change.why}`)
      return
    }
    onChange(change.points)
    setMessage(
      `${found.talent.name} ${change.points[id] ?? 0}/${found.talent.maxRank}. ${TALENT_POINTS_AT_70 - pointsSpent(trees, change.points)} of ${TALENT_POINTS_AT_70} points left.`,
    )
    // The prototype's motion (port step 7): a learned point pulses, and a tree's 41-point talent swells the scene.
    if (direction > 0) {
      // The icon, not the button: the button's box stays put, so a quick second click lands at once.
      cue({ kind: 'pulse', target: buttons.current.get(id)?.querySelector('.talent-icon') })
      const deepest = Math.max(...found.tree.talents.map((talent) => talent.row))
      if (found.talent.row === deepest && change.points[id] === 1) cue({ kind: 'swell' })
    }
  }

  /* Arrow keys move between a tree's talents by row and column, nearest first; Home and End go to its ends. */
  function onTalentKey(event: KeyboardEvent<HTMLButtonElement>, tree: TalentTree, talent: Talent) {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    const ordered = [...tree.talents].sort(byPlace)
    let to: Talent | undefined
    if (event.key === 'Home') to = ordered[0]
    else if (event.key === 'End') to = ordered[ordered.length - 1]
    else if (moves[event.key]) {
      const [down, across] = moves[event.key]
      const distance = (other: Talent) => Math.abs(other.row - talent.row) * 4 + Math.abs(other.column - talent.column)
      to = ordered
        .filter((other) =>
          down ? Math.sign(other.row - talent.row) === down : other.row === talent.row && Math.sign(other.column - talent.column) === across,
        )
        .sort((a, b) => distance(a) - distance(b))[0]
    } else if (event.key === '-' || event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      act(talent.id, -1)
      return
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      act(talent.id, 1)
      return
    } else return
    event.preventDefault()
    if (to) buttons.current.get(to.id)?.focus()
  }

  function fix(problem: Extract<TalentProblem, { kind: 'prerequisite' }>) {
    const { talentId, rank } = problem.fix
    const found = findTalent(trees, talentId)
    if (!found) return
    const raised = raiseTalent(trees, talentId, rank, points)
    if (!raised.added) {
      setMessage(`Can't add ${found.talent.name}: ${raised.why}`)
      return
    }
    const fixed = problems.length - talentProblems(trees, raised.points).length
    onChange(raised.points)
    onSession({ tree: found.tree.spec, selected: talentId })
    focusAfterFix.current = talentId
    setMessage(
      `Added ${plural(raised.added, 'point')} to ${found.talent.name} (${raised.points[talentId]}/${found.talent.maxRank})` +
        `${fixed > 0 ? `: that fixed ${plural(fixed, 'problem')}` : ''}.${raised.why ? ` Stopped: ${raised.why}` : ''}`,
    )
  }

  function toggleHint(problem: Extract<TalentProblem, { kind: 'rows' }>) {
    if (liveHint?.tree === problem.tree) {
      setHint(undefined)
      setMessage('Highlight off.')
      return
    }
    const next = { tree: problem.tree, upTo: problem.upTo }
    setHint(next)
    if (session.tree !== problem.tree) onSession({ ...session, tree: problem.tree })
    const n = hintedTalents(trees, points, next).size
    setMessage(
      n
        ? `${n} ${problem.tree} talent${n > 1 ? 's' : ''} glowing: each can take a point that counts toward the rows below.`
        : `No ${problem.tree} talent above those rows can take a point right now.`,
    )
  }

  function loadPreset() {
    if (!preset) return
    onChange(preset.points)
    onSession({ tree: character.spec })
    setHint(undefined)
    const n = talentProblems(trees, preset.points).length
    setMessage(
      `Loaded the ${preset.spec} preset as stored: ${talentSplit(trees, preset.points)}, ${pointsSpent(trees, preset.points)} of ${TALENT_POINTS_AT_70} points.` +
        `${n ? ` It breaks ${plural(n, 'rule')}, shown below.` : ''}`,
    )
  }

  function reset() {
    onChange({})
    onSession({ tree: session.tree })
    setHint(undefined)
    setMessage(`Reset: all ${TALENT_POINTS_AT_70} points are free.`)
  }

  function showTree(tree: TalentTree) {
    onSession({ tree: tree.spec, selected: chosen && chosen.tree === tree ? chosen.talent.id : undefined })
    setMessage(`${tree.spec} tree shown.`)
  }

  const summary = problems.length
    ? `This build breaks ${problems.length} of the game's rules${left ? ` and leaves ${plural(left, 'point')} unspent` : ''}.`
    : left
      ? `Every rule holds; ${plural(left, 'point')} ${left === 1 ? 'is' : 'are'} unspent.`
      : `Every rule holds and all ${TALENT_POINTS_AT_70} points are spent.`
  const tipped = tip.target && window.innerWidth >= SHEET_BELOW ? findTalent(trees, tip.target.data) : undefined

  return (
    <section className="panel talents-panel" aria-label="Talents">
      <p className="talents-lead">
        Your talents, laid out like the game's talent window. Click a talent to learn a point; right-click it, or use −, to unlearn one.
        Arrows show what each talent needs first.
      </p>

      <div className="talents-tools">
        <p className="talents-left">
          Points left <b data-testid="talent-points-remaining">{left}</b> · <span data-testid="talent-split">{talentSplit(trees, points)}</span>
        </p>
        {preset && (
          <button type="button" className="talents-tool" data-testid="talents-preset" onClick={loadPreset}>
            Load the {preset.spec} preset
          </button>
        )}
        <button type="button" className="talents-tool" data-testid="talents-reset" onClick={reset} disabled={spent === 0}>
          Reset all points
        </button>
      </div>
      {!preset && (
        <p className="talents-note" data-testid="talents-no-preset">
          wowsims has no preset for {character.spec} {character.className}s, so there is none to load here.
        </p>
      )}
      {hitCap && standing && (
        <p className={`talents-hit is-${standing.state}`} data-testid="talents-hit-line">
          <b>
            Hit {hit} / {hitCap.cap}
          </b>
          , {standing.text}. <small>{hitCapWords(hitCap)}</small>
        </p>
      )}
      <p className="talents-msg" role="status" data-testid="talents-message">
        {message}
      </p>

      <div className="talent-tree-tabs" role="group" aria-label="Talent tree">
        {trees.map((tree) => (
          <button
            type="button"
            key={tree.id}
            aria-pressed={tree === shownTree}
            data-testid={`talent-tree-tab-${tree.spec.toLowerCase()}`}
            onClick={() => showTree(tree)}
          >
            <img src={iconUrl(getSpecIcon(character.className, tree.spec as CharacterProfile['spec']))} alt="" width={26} height={26} />
            {tree.spec} <b>{pointsInTree(tree, points)}</b>
          </button>
        ))}
      </div>

      <div className="talents-frame">
        {trees.map((tree) => {
          const inTree = pointsInTree(tree, points)
          const icon = iconUrl(getSpecIcon(character.className, tree.spec as CharacterProfile['spec']))
          const roving = selected.tree === tree ? selected.talent.id : [...tree.talents].sort(byPlace)[0]?.id
          const look = {
            '--tree-rgb': TREE_RGB[`${character.className}|${tree.spec}`] ?? '120, 140, 170',
            '--tree-icon': icon ? `url("${icon}")` : 'none',
          } as CSSProperties
          const arrows: ArrowPiece[] = tree.talents.flatMap((talent) =>
            talent.requires.flatMap((requirement) => {
              const parent = tree.talents.find((entry) => entry.id === requirement.id)
              if (!parent) return []
              const met = (points[parent.id] ?? 0) >= requirement.rank
              const state = met ? ' is-met' : (points[talent.id] ?? 0) > 0 ? ' is-bad' : ''
              return arrowPieces(parent, talent).map((piece, index) => ({ ...piece, shape: piece.shape + state, key: `${parent.id}-${talent.id}-${index}` }))
            }),
          )

          return (
            <section key={tree.id} className={`talent-tree${tree === shownTree ? ' is-on' : ''}`} aria-label={`${tree.spec} talents`} style={look}>
              <header className="talent-tree-head">
                {icon && <img className="talent-tree-icon" src={icon} alt="" width={30} height={30} />}
                <h3>{tree.spec}</h3>
                <span className="talent-tree-count" data-testid={`talent-tree-points-${tree.spec.toLowerCase()}`}>
                  {inTree}
                </span>
              </header>

              <div className="talent-grid" style={{ gridTemplateRows: `repeat(${ROWS}, var(--cell))` }}>
                {arrows.map((piece) => (
                  <i key={piece.key} className={`talent-arrow ${piece.shape}`} style={{ gridColumn: piece.column, gridRow: piece.row }} aria-hidden="true" />
                ))}
                {tree.talents.map((talent) => {
                  const cell = talentCell(trees, tree, talent, points, broken)
                  const tipEvents = tip.bind(talent.id)
                  const label =
                    `${talent.name}, ${cell.rank} of ${talent.maxRank}` +
                    (cell.broken === 'prerequisite' ? ', missing its prerequisite' : cell.broken === 'row' ? ', row not opened' : '') +
                    (cell.locked ? `, locked: ${cell.locked}` : '')
                  return (
                    <button
                      type="button"
                      key={talent.id}
                      ref={(node) => {
                        if (node) buttons.current.set(talent.id, node)
                        else buttons.current.delete(talent.id)
                      }}
                      className={`talent is-${cell.state}${cell.broken ? ` is-broken is-broken-${cell.broken}` : ''}${lit.has(talent.id) ? ' is-hint' : ''}`}
                      style={{ gridColumn: talent.column + 1, gridRow: talent.row + 1 }}
                      data-testid={`talent-${talent.id}`}
                      aria-label={label}
                      aria-current={selected.talent === talent ? 'true' : undefined}
                      tabIndex={talent.id === roving ? 0 : -1}
                      onClick={() => act(talent.id, 1)}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        act(talent.id, -1)
                      }}
                      onKeyDown={(event) => onTalentKey(event, tree, talent)}
                      onPointerEnter={tipEvents.onPointerEnter}
                      onPointerLeave={tipEvents.onPointerLeave}
                      onFocus={(event) => {
                        tipEvents.onFocus(event)
                        select(talent.id)
                      }}
                      onBlur={tipEvents.onBlur}
                    >
                      {/* Decorative: the button's name says the talent and its rank. */}
                      <img className="talent-icon" src={iconUrl(talent.icon)} alt="" loading="lazy" decoding="async" />
                      <span className="talent-rank" aria-hidden="true">
                        {cell.rank}/{talent.maxRank}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="talents-selected">
        <div className="item-tip-box talents-tipbox" data-testid="talent-selected">
          <TalentTip className={character.className} tree={selected.tree} talent={selected.talent} points={points} />
        </div>
        <div className="talents-step">
          <span className="talents-stepper">
            <button
              type="button"
              className="talents-tool"
              aria-label={`Unlearn a point of ${selected.talent.name}`}
              data-testid="talent-step-down"
              disabled={!(points[selected.talent.id] ?? 0)}
              onClick={() => act(selected.talent.id, -1)}
            >
              −
            </button>
            <span className="talents-step-rank">
              {points[selected.talent.id] ?? 0}/{selected.talent.maxRank}
            </span>
            <button
              type="button"
              className="talents-tool"
              aria-label={`Learn a point of ${selected.talent.name}`}
              data-testid="talent-step-up"
              disabled={(points[selected.talent.id] ?? 0) >= selected.talent.maxRank}
              onClick={() => act(selected.talent.id, 1)}
            >
              +
            </button>
          </span>
          <small>Right-click a talent to unlearn, or use − here. Arrow keys move around a tree.</small>
        </div>
      </div>

      <section className="talents-off" aria-labelledby="talents-off-heading" data-testid="talents-off" ref={offRef}>
        <h3 id="talents-off-heading">What's off</h3>
        <p className="talents-off-sum">{summary}</p>
        {problems.length || left ? (
          <ul className="talents-off-list">
            {problems.map((problem) =>
              problem.kind === 'prerequisite' ? (
                <li key={`req-${problem.talentIds[0]}-${problem.fix.talentId}`}>
                  <span className="talents-off-k is-prerequisite" aria-hidden="true">
                    !
                  </span>
                  <span>{problem.text}</span>
                  <button type="button" className="talents-tool" data-fix onClick={() => fix(problem)}>
                    {problem.fix.label}
                  </button>
                </li>
              ) : (
                <li key={`rows-${problem.tree}`}>
                  <span className="talents-off-k is-rows" aria-hidden="true">
                    !
                  </span>
                  <span>
                    {problem.text}
                    <small>A stored build can leave out the filler points that open these rows; where they go is your call.</small>
                  </span>
                  <button
                    type="button"
                    className="talents-tool"
                    data-hint={problem.tree}
                    aria-pressed={liveHint?.tree === problem.tree}
                    onClick={() => toggleHint(problem)}
                  >
                    {liveHint?.tree === problem.tree ? 'Hide' : 'Show where'}
                  </button>
                </li>
              ),
            )}
            {left > 0 && (
              <li>
                <span className="talents-off-k is-left" aria-hidden="true">
                  {left}
                </span>
                <span>
                  {left} of {TALENT_POINTS_AT_70} points unspent.
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="talents-off-ok">✓ Nothing: every rule holds and every point is spent.</p>
        )}
        {problems.length > 0 && (
          <p className="talents-note">
            Builds are shown as stored, not filled in. wowsims' presets list only the talents its simulator reads, so they leave out the filler
            points that open the deeper rows.
          </p>
        )}
      </section>

      {tipped && tip.target && (
        <FloatingTip anchor={tip.target.anchor} placement="beside" className="item-tip-box" testId="talent-tip">
          <TalentTip className={character.className} tree={tipped.tree} talent={tipped.talent} points={points} hint />
        </FloatingTip>
      )}
    </section>
  )
}
