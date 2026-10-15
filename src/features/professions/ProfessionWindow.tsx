import { useEffect, useRef } from 'react'
import {
  RECIPE_COLOR_WORD,
  allProfessions,
  craftingPathFor,
  craftingPathModel,
  formatCopper,
  gathererOf,
  getProfessionProfile,
  guideFor,
  materialsForRange,
  payoffFor,
  recipeColorAt,
  stepIndexAt,
  trainingMilestones,
  withTrainerStops,
} from '../../domain/professions'
import type {
  CraftingStep,
  GatheringRange,
  PayoffKind,
  Profession,
  ProfessionCategory,
  TrainingMilestone,
} from '../../domain/professions'
import { professionSlug } from './professionsSession'
import { ZoneRoutes } from './ZoneRoutes'

const CATEGORIES: readonly ProfessionCategory[] = ['Gathering', 'Crafting', 'Secondary']
const MAX_SKILL = 375

const KIND_WORD: Record<PayoffKind, string> = {
  stat: 'stat bonus',
  gear: 'own gear',
  utility: 'utility',
  feeds: 'feeds others',
}

const iconSrc = (icon: string | undefined) => (icon ? `${import.meta.env.BASE_URL}icons/${icon}.jpg` : undefined)

export function ProfessionIcon({ icon, size }: { icon?: string; size: number }) {
  const src = iconSrc(icon)
  return src ? (
    <img className="pw-icon" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" />
  ) : (
    <span className="pw-icon pw-icon-blank" style={{ width: size, height: size }} />
  )
}

export function KindTag({ kind, phase }: { kind: PayoffKind; phase?: number }) {
  return (
    <span className={`pw-kind pw-kind-${kind}`}>
      {KIND_WORD[kind]}
      {phase && phase > 2 ? ` · phase ${phase}` : ''}
    </span>
  )
}

type ProfessionWindowProps = {
  profession: Profession
  skill: number
  /** The recipe or range picked in the list; absent means the one your skill is on. */
  pick?: number
  onProfession: (profession: Profession) => void
  onSkill: (skill: number) => void
  onPick: (index: number) => void
}

/**
 * The profession window: like the game's own (port step 3, the owner's pick of the Professions designs).
 *
 * **Pick a profession by its icon, set your skill on the bar, and every recipe on the path to 375 takes
 * its colour at that skill** — orange, yellow, green or grey, from each recipe's own thresholds — with
 * the trainer stops in the list where the bar stops moving. A recipe opens its reagents (who gathers
 * them, what a vendor charges), what it makes and its colours. A gathering profession lists its ranges
 * instead, each with its zones, guidance and the computed loop on the zone's TBC map.
 *
 * It replaced a grid of thirteen cards that opened one page per profession, with the payoff, two
 * progressions and two summary tables stacked on it: the same information, in the shape of a window
 * you change by touching it rather than a document you scroll.
 */
export function ProfessionWindow({ profession, skill, pick, onProfession, onSkill, onPick }: ProfessionWindowProps) {
  const profile = getProfessionProfile(profession)
  const craft = craftingPathFor(profession)
  const guide = guideFor(profession)
  const payoff = payoffFor(profession)
  const milestones = trainingMilestones(profession)
  const steps: readonly { skillRange: readonly [number, number] }[] = craft.length > 0 ? craft : (guide?.ranges ?? [])
  const here = stepIndexAt(steps, skill)
  const selected = pick !== undefined && pick < steps.length ? pick : here
  const rows = withTrainerStops(steps, milestones)
  const listRef = useRef<HTMLOListElement>(null)

  // Keeps the step you are on in view inside the list, without moving the page.
  useEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!list || !current) return
    const listBox = list.getBoundingClientRect()
    const rowBox = current.getBoundingClientRect()
    if (rowBox.top < listBox.top || rowBox.bottom > listBox.bottom) {
      list.scrollTop += rowBox.top - listBox.top - listBox.height / 3
    }
  }, [profession, selected])

  if (!profile) return null
  const kinds = payoff ? [...new Set(payoff.perks.map((perk) => perk.kind))] : []

  return (
    <div className="pw">
      <nav className="pw-tabs" aria-label="Professions">
        {CATEGORIES.map((category) => (
          <div key={category} className="pw-group">
            <span>{category}</span>
            <ul>
              {allProfessions
                .filter((name) => getProfessionProfile(name)?.category === category)
                .map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className={`pw-pick pw-cat-${category.toLowerCase()}`}
                      aria-pressed={name === profession}
                      aria-label={name}
                      title={name}
                      onClick={() => onProfession(name)}
                      data-testid={`profession-pick-${professionSlug(name)}`}
                    >
                      <ProfessionIcon icon={getProfessionProfile(name)?.icon} size={36} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      <section
        className={`pw-window pw-cat-${profile.category.toLowerCase()}`}
        aria-labelledby="pw-heading"
        data-testid="profession-window"
      >
        <header className="pw-head">
          <ProfessionIcon icon={profile.icon} size={44} />
          <div>
            <h2 id="pw-heading">{profession}</h2>
            <small>
              {profile.category} · to {profile.skillCap}
              {craft.length > 0
                ? ` · ${craft.length} recipes on the path`
                : guide
                  ? ` · ${guide.ranges.length} ranges`
                  : ''}
            </small>
          </div>
          {/*
            Linked rather than reproduced: wow-professions.com's routes and recipe orders are their
            work. This window carries what it can source and compute, and sends you there for theirs.
          */}
          <span className="pw-links">
            <a href={profile.guideUrl} target="_blank" rel="noopener noreferrer">
              Step-by-step on wow-professions.com
            </a>
            {profile.specializationUrl && (
              <a href={profile.specializationUrl} target="_blank" rel="noopener noreferrer">
                Specializations
              </a>
            )}
          </span>
        </header>

        {payoff && (
          <div className="pw-verdict" data-testid="profession-verdict">
            <p>
              <b>Worth at 70:</b> {payoff.verdict}
            </p>
            <span className="pw-kinds">
              {kinds.map((kind) => (
                <KindTag key={kind} kind={kind} />
              ))}
            </span>
            <details className="pw-more" data-testid="profession-payoff">
              <summary>What you get, in full</summary>
              <ul className="pw-perks">
                {payoff.perks.map((perk) => (
                  <li key={perk.name}>
                    <b>{perk.name}</b>
                    {perk.requiresSkill ? ` (skill ${perk.requiresSkill})` : ''}
                    {perk.phase ? ` · phase ${perk.phase}` : ''}: {perk.detail}
                    {perk.needsVerification ? <em> (needs verification)</em> : null}
                  </li>
                ))}
              </ul>
              <small>From {payoff.sources.join(', ')}.</small>
            </details>
          </div>
        )}

        <SkillBar profession={profession} skill={skill} milestones={milestones} onSkill={onSkill} />

        {steps.length > 0 ? (
          <div className="pw-body">
            <ol className="pw-list" ref={listRef} aria-label={craft.length > 0 ? 'Recipes on the path' : 'Ranges'}>
              {rows.map((row) =>
                row.kind === 'train' ? (
                  <TrainerRow key={`train-${row.milestone.tier}`} milestone={row.milestone} />
                ) : craft.length > 0 ? (
                  <RecipeRow
                    key={row.index}
                    step={craft[row.index]}
                    index={row.index}
                    skill={skill}
                    current={row.index === selected}
                    yours={row.index === here && skill < MAX_SKILL}
                    onPick={onPick}
                  />
                ) : (
                  <RangeRow
                    key={row.index}
                    profession={profession}
                    range={guide!.ranges[row.index]}
                    index={row.index}
                    skill={skill}
                    last={row.index === steps.length - 1}
                    current={row.index === selected}
                    onPick={onPick}
                  />
                ),
              )}
            </ol>
            <div className="pw-detail" aria-live="polite" data-testid="profession-detail">
              {craft.length > 0 ? (
                <RecipeDetail step={craft[selected]} skill={skill} />
              ) : (
                <RangeDetail key={`${profession}-${selected}`} profession={profession} range={guide!.ranges[selected]} />
              )}
            </div>
          </div>
        ) : (
          <p className="pw-note">No path recorded for {profession}; the guide above covers it.</p>
        )}

        {craft.length > 0 && <p className="pw-model">{craftingPathModel}</p>}
      </section>
    </div>
  )
}

/**
 * Your skill, as the game draws it: a bar to 375 with each trainer stop marked where the bar stops
 * moving, and a slider and a number to set it. The number commits on Enter or on leaving the field,
 * so typing "125" does not jump the list to 1 and then 12 on the way.
 */
function SkillBar({
  profession,
  skill,
  milestones,
  onSkill,
}: {
  profession: Profession
  skill: number
  milestones: readonly TrainingMilestone[]
  onSkill: (skill: number) => void
}) {
  const commit = (value: number) => {
    if (Number.isFinite(value)) onSkill(Math.max(1, Math.min(MAX_SKILL, Math.round(value))))
  }
  return (
    <div className="pw-bar">
      <div className="pw-track" role="img" aria-label={`Skill ${skill} of ${MAX_SKILL}`}>
        <span className="pw-fill" style={{ width: `${((skill / MAX_SKILL) * 100).toFixed(1)}%` }} />
        {milestones.map((stop) => (
          <span
            key={stop.tier}
            className="pw-stop"
            style={{ left: `${((stop.atSkill / MAX_SKILL) * 100).toFixed(1)}%` }}
            title={`Train ${stop.tier} at ${stop.atSkill}: level ${stop.requiredCharacterLevel}, ${stop.trainedFrom}`}
          >
            <span>{stop.tier[0]}</span>
          </span>
        ))}
        <b>
          {skill} / {MAX_SKILL}
        </b>
      </div>
      <div className="pw-skill">
        <label htmlFor="pw-skill">Your skill</label>
        <input
          type="range"
          min={1}
          max={MAX_SKILL}
          value={skill}
          aria-label="Your skill, slider"
          onChange={(event) => commit(Number(event.target.value))}
          data-testid="profession-skill-slider"
        />
        <input
          key={`${profession}-${skill}`}
          id="pw-skill"
          type="number"
          min={1}
          max={MAX_SKILL}
          defaultValue={skill}
          onBlur={(event) => commit(Number(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit(Number(event.currentTarget.value))
          }}
          data-testid="profession-skill"
        />
      </div>
    </div>
  )
}

function TrainerRow({ milestone }: { milestone: TrainingMilestone }) {
  return (
    <li className="pw-train" title={milestone.trainedFrom} data-testid="training-marker">
      Train {milestone.tier} at {milestone.atSkill} · level {milestone.requiredCharacterLevel}
    </li>
  )
}

function RecipeRow({
  step,
  index,
  skill,
  current,
  yours,
  onPick,
}: {
  step: CraftingStep
  index: number
  skill: number
  current: boolean
  yours: boolean
  onPick: (index: number) => void
}) {
  const color = recipeColorAt(step.colors, skill)
  const shown = color === 'red' ? 'grey' : color
  return (
    <li>
      <button
        type="button"
        className="pw-row"
        aria-current={current}
        onClick={() => onPick(index)}
        title={`${step.name}: ${color === 'red' ? 'not learnable yet' : `${color} at ${skill}, ${RECIPE_COLOR_WORD[color]}`}`}
        data-step={index}
        data-color={color}
        data-testid="profession-row"
      >
        <ProfessionIcon icon={step.createsIcon} size={26} />
        <b className={`pw-c-${shown}`}>
          {step.name}
          {yours && <span className="pw-here">You</span>}
          <span className="visually-hidden"> ({color})</span>
        </b>
        <small>
          {step.skillRange[0]}–{step.skillRange[1]} · ×{step.crafts.toLocaleString('en-US')}
        </small>
      </button>
    </li>
  )
}

const COLOR_HEX = { orange: '#ff8a3d', yellow: '#ffe14d', green: '#4be03c', grey: '#9d9d9d' } as const

function RecipeDetail({ step, skill }: { step: CraftingStep; skill: number }) {
  const color = recipeColorAt(step.colors, skill)
  const [orange, yellow, green, grey] = step.colors
  const span = Math.max(grey + 15, step.skillRange[1]) - orange || 1
  const width = (from: number, to: number) => `${(((to - from) / span) * 100).toFixed(1)}%`
  return (
    <>
      <div className="pw-dh">
        <ProfessionIcon icon={step.createsIcon} size={48} />
        <div>
          <h3 className={`pw-c-${color === 'red' ? 'grey' : color}`}>{step.name}</h3>
          <p>
            Makes {step.creates ?? step.name} · skill {step.skillRange[0]} to {step.skillRange[1]} · about{' '}
            {step.crafts.toLocaleString('en-US')} crafts
          </p>
        </div>
      </div>

      <div className="pw-colors">
        <p className="pw-mini">
          Its colours: learned at {step.learnedAt},{' '}
          {color === 'red' ? 'not learnable yet' : <span className={`pw-c-${color}`}>{color}</span>}
          {color === 'red' ? '' : ` at your ${skill}`}
        </p>
        <div
          className="pw-cbar"
          role="img"
          aria-label={`Orange from ${orange}, yellow from ${yellow}, green from ${green}, grey from ${grey}`}
        >
          <i style={{ width: width(orange, yellow), background: COLOR_HEX.orange }} />
          <i style={{ width: width(yellow, green), background: COLOR_HEX.yellow }} />
          <i style={{ width: width(green, grey), background: COLOR_HEX.green }} />
          <i style={{ width: width(grey, orange + span), background: COLOR_HEX.grey }} />
          {skill >= orange && skill <= orange + span && (
            <span className="pw-cmark" style={{ left: `${(((skill - orange) / span) * 100).toFixed(1)}%` }} />
          )}
        </div>
        <div className="pw-cnums">
          <span>{orange}</span>
          <span>yellow {yellow}</span>
          <span>green {green}</span>
          <span>grey {grey}</span>
        </div>
      </div>

      <p className="pw-mini">Reagents for the whole step</p>
      <ul className="pw-mats">
        {step.materials.map((material) => {
          const gatherer = material.vendorOnly ? undefined : gathererOf(material.name)
          const madeFrom = material.craftedFrom ?? []
          return (
            <li
              key={material.name}
              title={
                madeFrom.length
                  ? `${material.name}: or make it from ${madeFrom.map((part) => `${part.quantity} ${part.name}`).join(', ')}`
                  : material.name
              }
            >
              <ProfessionIcon icon={material.icon} size={34} />
              <span>
                <b>{material.name}</b>
                <small>
                  {material.vendorOnly
                    ? `Vendor, ${formatCopper(material.unitCopper ?? 0)} each`
                    : gatherer
                      ? `Farmed: ${gatherer}`
                      : madeFrom.length
                        ? `Or from ${madeFrom.map((part) => part.name).join(', ')}`
                        : 'Farmed or bought'}
                </small>
              </span>
              <span className="pw-q">{material.quantity.toLocaleString('en-US')}</span>
            </li>
          )
        })}
      </ul>
      {(step.vendorCopper ?? 0) > 0 && (
        <p className="pw-note">
          A vendor sells part of it: <b>{formatCopper(step.vendorCopper ?? 0)}</b> for the step.
        </p>
      )}
    </>
  )
}

function RangeRow({
  profession,
  range,
  index,
  skill,
  last,
  current,
  onPick,
}: {
  profession: Profession
  range: GatheringRange
  index: number
  skill: number
  last: boolean
  current: boolean
  onPick: (index: number) => void
}) {
  const [from, to] = range.skillRange
  const inIt = skill >= from && (skill < to || (last && skill <= to))
  const done = skill >= to && !last
  return (
    <li>
      <button
        type="button"
        className="pw-row"
        aria-current={current}
        onClick={() => onPick(index)}
        data-step={index}
        data-testid="profession-row"
      >
        <b className={done ? 'pw-c-grey' : inIt ? 'pw-c-orange' : undefined}>
          {materialsForRange(profession, range).slice(0, 3).join(', ')}
          {inIt && skill < MAX_SKILL && <span className="pw-here">You</span>}
        </b>
        <small>
          {from}–{to}
        </small>
      </button>
    </li>
  )
}

function RangeDetail({ profession, range }: { profession: Profession; range: GatheringRange }) {
  return (
    <div className="pw-range" data-testid="gathering-range">
      <div className="pw-dh">
        <div>
          <h3>{materialsForRange(profession, range).join(', ')}</h3>
          <p>
            Skill {range.skillRange[0]} to {range.skillRange[1]} · character level {range.recommendedCharacterLevel}
          </p>
        </div>
      </div>
      <p className="pw-note">{range.guidance}</p>
      <p className="pw-mini">Where to ride, best first</p>
      <p className="pw-note">{range.zones.join(' · ')}</p>
      <ZoneRoutes profession={profession} range={range} />
      <p className="pw-sources">Checked against {range.sources.join(', ')}.</p>
    </div>
  )
}
