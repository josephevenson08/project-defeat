import { Panel } from '../../components/layout/Panel'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getTalentData } from '../../domain/talents/sampleTalents'
import {
  POINTS_PER_ROW,
  TALENT_POINTS_AT_70,
  canRemovePoint,
  pointsInTree,
  pointsSpent,
  whyBlocked,
  type Talent,
  type TalentPoints,
  type TalentTree,
} from '../../domain/talents/talentTypes'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/characterData'

type TalentsPanelProps = {
  character: CharacterProfile
  points: TalentPoints
  onChange: (points: TalentPoints) => void
}

/**
 * Highest row index in a TBC tree. Nine rows, 0-indexed, so the deepest is 8 — that is the 41-point
 * tier holding Endless Rage, Rampage and Devastate. Set to 7 at first, which silently dropped the
 * one talent per tree that a build is usually named after.
 */
const DEEPEST_ROW = 8

/**
 * The three talent trees, filled by clicking.
 *
 * Laid out as the game does — a 4-wide grid per tree, one row unlocked per 5 points spent in that
 * tree — because that geometry *is* the information: how deep a build goes is a vertical distance,
 * and comparing two builds means comparing two shapes.
 *
 * Left-click adds a point, right-click removes one. Removal is refused where the game would refuse
 * it: not out from under a prerequisite, and not if it would drop the tree below a row a deeper
 * talent is standing on.
 */
export function TalentsPanel({ character, points, onChange }: TalentsPanelProps) {
  const data = getTalentData(character.className)
  const role = getRoleForSpec(character.className, character.spec)
  const accent = getRoleAccentColor(role)

  if (!data) {
    return (
      <Panel title="Talents" eyebrow="Specialisation" accentColor={accent}>
        <p className="panel-copy" data-testid="talents-unavailable">
          Talent trees are ingested for {['Warrior'].join(', ')} so far. {character.className} is not in yet — one class
          was built end to end first to prove the shape, rather than nine half-done at once. Nothing is invented in the
          meantime.
        </p>
      </Panel>
    )
  }

  const spent = pointsSpent(data.trees, points)
  const remaining = TALENT_POINTS_AT_70 - spent

  function addPoint(tree: TalentTree, talent: Talent) {
    if (whyBlocked(data!.trees, tree, talent, points)) return
    onChange({ ...points, [talent.id]: (points[talent.id] ?? 0) + 1 })
  }

  function removePoint(tree: TalentTree, talent: Talent) {
    if (!canRemovePoint(tree, talent, points)) return
    onChange({ ...points, [talent.id]: (points[talent.id] ?? 0) - 1 })
  }

  return (
    <Panel title="Talents" eyebrow="Specialisation" accentColor={accent}>
      <div className="talents-summary">
        <p className="panel-copy">
          <strong data-testid="talent-points-remaining">{remaining}</strong> of {TALENT_POINTS_AT_70} points left.
          Left-click to add, right-click to remove.
        </p>
        <button type="button" className="talents-reset" onClick={() => onChange({})} disabled={spent === 0} data-testid="talents-reset">
          Reset
        </button>
      </div>

      <div className="talent-trees">
        {data.trees.map((tree) => {
          const inTree = pointsInTree(tree, points)

          return (
            <section className="talent-tree" key={tree.id} aria-label={`${tree.spec} talents`} style={{ '--tree-accent': accent } as React.CSSProperties}>
              <header className="talent-tree-head">
                <h3>{tree.spec}</h3>
                <span className="talent-tree-count" data-testid={`talent-tree-points-${tree.spec.toLowerCase()}`}>
                  {inTree}
                </span>
              </header>

              <div className="talent-grid">
                {Array.from({ length: DEEPEST_ROW + 1 }, (_, row) => {
                  const unlocked = inTree >= row * POINTS_PER_ROW
                  return Array.from({ length: 4 }, (_, column) => {
                    const talent = tree.talents.find((entry) => entry.row === row && entry.column === column)
                    if (!talent) return <span className="talent-empty" key={`${row}-${column}`} aria-hidden="true" />

                    const rank = points[talent.id] ?? 0
                    const blocked = whyBlocked(data.trees, tree, talent, points)
                    const description = talent.rankDescriptions[Math.max(0, rank - 1)] ?? talent.rankDescriptions[0]

                    return (
                      <button
                        type="button"
                        key={talent.id}
                        className={`talent ${rank > 0 ? 'talent-filled' : ''} ${rank >= talent.maxRank ? 'talent-maxed' : ''} ${!unlocked ? 'talent-locked' : ''}`.trim()}
                        onClick={() => addPoint(tree, talent)}
                        onContextMenu={(event) => {
                          event.preventDefault()
                          removePoint(tree, talent)
                        }}
                        data-testid={`talent-${talent.id}`}
                        aria-label={`${talent.name}, ${rank} of ${talent.maxRank}`}
                        // The reason a talent cannot be taken is the thing calculators usually hide.
                        title={`${talent.name} ${rank}/${talent.maxRank}\n\n${description}${blocked ? `\n\n${blocked}` : ''}`}
                      >
                        {/* The icon is decorative here: the button's aria-label already names the
                            talent and its rank, and the name is rendered as text right below it. */}
                        <img
                          className="talent-icon"
                          src={`${import.meta.env.BASE_URL}icons/${talent.icon}.jpg`}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="talent-name">{talent.name}</span>
                        <span className="talent-rank">
                          {rank}/{talent.maxRank}
                        </span>
                      </button>
                    )
                  })
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Panel>
  )
}
