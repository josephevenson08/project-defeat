import { useEffect, useState } from 'react'
import { getBisListForSpec, bisLists } from '../../domain/bis'
import { modelledBuffs } from '../../domain/buffs/sampleBuffs'
import { getItemById } from '../../domain/gear/itemCatalogue'
import { getIconName } from '../../domain/icons/icons'
import { allProfessions, professionIconNames } from '../../domain/professions/sampleProfessions'
import { getBuffIcon, getSpecIcon } from '../../domain/raidcomp'
import { sampleRaidBosses } from '../../domain/raids/sampleRaidBosses'
import { sampleRaids } from '../../domain/raids/sampleRaids'
import { dpsReference } from '../../domain/simulation/dpsReference'
import { getTierList } from '../../domain/tierlists'

export type SectionId = 'planner' | 'simulation' | 'raidcomp' | 'tierlists' | 'raids' | 'professions'

type SectionDefinition = {
  id: SectionId
  label: string
  /** Two or three words. This is the promise the card makes about what is behind it. */
  tagline: string
  blurb: string
  /**
   * The same door said as the job a visitor came to do. The usability study found the goal chose the
   * first click — the five who arrived with one went straight to the matching card — so each card
   * says its job in those words as well as its name.
   */
  goal: string
  /** Accent for this section, carried through to its border and its rule. */
  accent: string
}

/**
 * The things this app does, offered as a deliberate choice rather than a tab bar you land in the
 * middle of.
 *
 * The tab bar still exists once you are inside — this is a way *in*, not a replacement for moving
 * between sections afterwards.
 *
 * Each section owns a hue here. That is a deliberate loosening of the near-monochrome policy, which
 * exists so item quality reads first — a rule that only binds where item quality is on screen. The
 * glimpses below show item icons, but each one keeps its own quality-free frame, so nothing here
 * competes with a purple.
 *
 * **Simulation has a door of its own** since 2026-10-11. The usability study's theorycrafter came for
 * the simulator and found nothing on the front page that mentioned it; it was reachable only from
 * inside, as a tab.
 */
const SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'planner',
    label: 'Character Planner',
    tagline: 'Gear, gems and talents',
    blurb: 'Build a character from faction to spec, fill every slot against real Phase 2 rankings, and see what the stats come to.',
    goal: 'Gear my character',
    accent: '#9c7346',
  },
  {
    id: 'simulation',
    label: 'Simulation',
    tagline: 'Estimated DPS',
    blurb: 'Run the model on your character: your stat priority, your best upgrades, and the estimate against what players average.',
    goal: 'Simulate my DPS',
    accent: '#a8924f',
  },
  {
    id: 'raidcomp',
    label: 'Raid Composition',
    tagline: 'Buff coverage',
    blurb: 'Plan a 10 or 25-player roster and see which raid buffs and target debuffs it actually brings — and what one more seat would buy you.',
    goal: 'Plan a raid',
    accent: '#9c6a6a',
  },
  {
    id: 'tierlists',
    label: 'Spec Tier Lists',
    tagline: 'Where specs stand',
    blurb: 'Wowhead’s Phase 2 rankings for damage, healing and tanking — all three lists on one page.',
    goal: 'See where my spec stands',
    accent: '#856a9c',
  },
  {
    id: 'raids',
    label: 'Raids',
    tagline: 'Loot tables',
    blurb: 'What drops where across Serpentshrine Cavern, Tempest Keep and the Phase 1 raids still worth running.',
    goal: 'Find what drops where',
    accent: '#6a7fa8',
  },
  {
    id: 'professions',
    label: 'Professions',
    tagline: 'Levelling and payoffs',
    blurb: 'How to take a profession to 375 without wasting materials, and what each one is actually worth at 70.',
    goal: 'Level a profession',
    accent: '#6f8f6a',
  },
]

const iconSrc = (name: string) => `${import.meta.env.BASE_URL}icons/${name}.jpg`

/**
 * **A glimpse of what is behind each door, from the data the section itself reads.**
 *
 * Not decoration: the study found the cards work because they say what they do, and a glimpse says it
 * faster than a sentence — the gear the planner ranks, the buffs a roster is checked for, the specs at
 * the top of the list, the raids themselves. Computed once, at load, from the same modules the
 * sections use, so a glimpse cannot drift from what the section shows.
 */
const plannerIcons = (getBisListForSpec('Warrior', 'Fury')?.entries ?? [])
  .filter((entry) => entry.rank === 1)
  .map((entry) => getIconName(getItemById(entry.itemId)?.wowItemId))
  .filter((name): name is string => Boolean(name))
const buffIcons = modelledBuffs.map((buff) => getBuffIcon(buff.id)).filter((name): name is string => Boolean(name))
const dpsList = getTierList('DPS')
const topTier = dpsList?.tiers[0]
const topSpecs = (topTier?.placements ?? [])
  .map((placement) => ({ name: `${placement.spec} ${placement.className}`, icon: getSpecIcon(placement.className, placement.spec) }))
  .filter((entry): entry is { name: string; icon: string } => Boolean(entry.icon))
const raidsInOrder = ['serpentshrine-cavern', 'tempest-keep', 'karazhan', 'gruuls-lair', 'magtheridons-lair']
  .map((id) => sampleRaids.find((raid) => raid.id === id))
  .filter((raid): raid is NonNullable<typeof raid> => raid !== undefined)
const raidBosses = sampleRaidBosses.filter((boss) => raidsInOrder.some((raid) => raid.id === boss.raidId))
const dropCount = raidBosses.reduce((sum, boss) => sum + boss.loot.length, 0)

/** One line of fact per door, every number counted from the data rather than written down. */
const FACTS: Record<SectionId, string> = {
  planner: `${bisLists.length} specs ranked slot by slot`,
  simulation: `Measured against what players average, for all ${dpsReference.length} DPS specs`,
  raidcomp: `${modelledBuffs.length} raid buffs counted`,
  tierlists: `${dpsList?.tiers.reduce((sum, tier) => sum + tier.placements.length, 0) ?? 0} DPS specs ranked; ${topTier?.label ?? ''} tier shown`,
  raids: `${raidsInOrder.length} raids · ${raidBosses.length} bosses · ${dropCount} drops`,
  professions: `${allProfessions.length} professions, each to 375`,
}

function Glimpse({ id }: { id: SectionId }) {
  if (id === 'planner' || id === 'raidcomp' || id === 'professions') {
    const names = id === 'planner' ? plannerIcons : id === 'raidcomp' ? buffIcons : professionIconNames
    return (
      <span className="section-card-glimpse" aria-hidden="true">
        {names.map((name, index) => (
          <img key={`${name}-${index}`} src={iconSrc(name)} alt="" loading="lazy" decoding="async" />
        ))}
      </span>
    )
  }
  if (id === 'tierlists') {
    return (
      <span className="section-card-specs" aria-hidden="true">
        {topSpecs.map((spec) => (
          <span key={spec.name}>
            <img src={iconSrc(spec.icon)} alt="" loading="lazy" decoding="async" />
            {spec.name}
          </span>
        ))}
      </span>
    )
  }
  if (id === 'raids') {
    return (
      <span className="section-card-art" aria-hidden="true">
        {raidsInOrder.map((raid) => (
          <span
            key={raid.id}
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL}raids/${raid.id}.jpg)` }}
            title={raid.name}
          />
        ))}
      </span>
    )
  }
  return null
}

type SectionPickerProps = {
  onSelect: (section: SectionId) => void
  /**
   * Takes the string the in-game addon writes. Returns an error to show, or nothing on success —
   * on success the app has already moved on to the planner, so this component stops existing.
   */
  onImportCharacter: (raw: string) => string | undefined
}

/**
 * Whether an illustration is actually behind the front door.
 *
 * **The scrim has to know, because the two cases want opposite amounts of it.** The drawn backdrop is
 * already dark and nearly disappears under a scrim sized for a busy illustration; an illustration
 * without one makes every heading unreadable. CSS cannot ask whether a file exists, so this does —
 * it preloads the path and reports what happened.
 *
 * Absent is the normal case and not an error: `public/backdrop.jpg` is optional by design, so the
 * page is built to look finished without one and to take one with no code change.
 */
function useBackdropImage(src: string) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const image = new Image()
    let cancelled = false
    image.onload = () => {
      if (!cancelled) setLoaded(true)
    }
    image.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return loaded
}

const BACKDROP_SRC = `${import.meta.env.BASE_URL}backdrop.jpg`

export function SectionPicker({ onSelect, onImportCharacter }: SectionPickerProps) {
  const [importing, setImporting] = useState(false)
  const [pasted, setPasted] = useState('')
  const [importError, setImportError] = useState<string>()
  const hasImage = useBackdropImage(BACKDROP_SRC)

  /*
   * **A card's accessible name is its title, and only its title.** It used to be the whole button —
   * tagline, title and sentence run together — so the study's screen-reader user heard five
   * paragraph-long names before anything else. The rest is the card's description now, read after
   * the name rather than as part of it.
   */
  const card = (section: SectionDefinition, extra = '') => (
    <button
      key={section.id}
      type="button"
      className={`section-card ${extra}`}
      style={{ '--section-accent': section.accent } as React.CSSProperties}
      onClick={() => onSelect(section.id)}
      data-testid={`section-${section.id}`}
      aria-labelledby={`section-label-${section.id}`}
      aria-describedby={`section-blurb-${section.id} section-goal-${section.id} section-fact-${section.id}`}
    >
      <span className="section-card-tagline">{section.tagline}</span>
      <span className="section-card-label" id={`section-label-${section.id}`}>
        {section.label}
      </span>
      <span className="section-card-blurb" id={`section-blurb-${section.id}`}>
        {section.blurb}
      </span>
      <Glimpse id={section.id} />
      <span className="section-card-foot">
        <span className="section-card-goal" id={`section-goal-${section.id}`}>
          {section.goal}
          <span aria-hidden="true"> →</span>
        </span>
        <span className="section-card-fact" id={`section-fact-${section.id}`}>
          {FACTS[section.id]}
        </span>
      </span>
    </button>
  )

  const byId = (id: SectionId) => SECTIONS.find((section) => section.id === id) as SectionDefinition

  return (
    <div className="section-picker" data-backdrop={hasImage ? 'image' : 'drawn'}>
      {/*
        **The backdrop is a layer, not an image tag.**

        It renders a faction clash drawn in CSS — Alliance blue massing from the left, Horde red from
        the right, meeting in a lit seam down the middle. That is deliberate rather than a
        placeholder: it says "both sides" without depicting anyone, which keeps the front door clear
        of the question of whose characters these are.

        Dropping a file at `public/backdrop.jpg` layers it over the gradient automatically — the rule
        in the stylesheet references it and simply paints nothing while the file is absent. The scrim
        above it is sized for a busy illustration, so text stays legible either way.
      */}
      <div
        className="section-picker-backdrop"
        aria-hidden="true"
        style={hasImage ? { backgroundImage: `url(${BACKDROP_SRC})` } : undefined}
      />

      <div className="section-picker-head">
        <h1>Project Defeat</h1>
        <p className="section-picker-sub">TBC Classic · Phase 2</p>
        {/*
          Both factions named, in their own colours, on the one screen that exists before a character
          does. Everything past this point themes to whichever side you pick; this is the only place
          the app can say it is for both without picking one.
        */}
        <p className="section-picker-sides">
          <span className="side-alliance">For the Alliance</span>
          <span className="side-versus">and</span>
          <span className="side-horde">For the Horde</span>
        </p>
      </div>

      {/*
        **Character Planner is the big door,** because it is the one most visitors take: in the
        usability study everyone without a specific goal took the first card, and it served as the
        site's default way in. Simulation and the import sit beside it — the two other ways of
        arriving as a character.
      */}
      <nav className="section-picker-grid" aria-label="Choose a section">
        {card(byId('planner'), 'section-card-main')}
        <div className="section-picker-side">
          {card(byId('simulation'))}

          {/*
            **Arriving as yourself, before there is a character to overwrite.**

            Beside the planner rather than below the cards, where it used to be easy to miss: it has
            to be here and not only on the planner's Build tab, because pasting the string *is*
            character creation — sending someone through four creation steps to build a character
            they are about to replace is backwards for anyone who already plays one.
          */}
          <div className="section-picker-import">
            {!importing ? (
              <>
                <p className="section-picker-import-lead">
                  <strong>Already playing?</strong> Bring your character in from the game and the planner opens wearing it.
                </p>
                <button
                  type="button"
                  className="section-picker-import-open"
                  onClick={() => setImporting(true)}
                  data-testid="front-import-open"
                >
                  Import your character from the game
                </button>
              </>
            ) : (
              <div className="section-picker-import-form">
                <p>
                  In game, run <code>/pdexport</code>, press Ctrl+C, and paste it here. Nothing is uploaded — the string
                  never leaves your browser, and it carries no character name or realm.
                </p>
                <textarea
                  aria-label="Paste your character export"
                  data-testid="front-import-input"
                  value={pasted}
                  onChange={(event) => {
                    setPasted(event.target.value)
                    setImportError(undefined)
                  }}
                  placeholder="{&quot;format&quot;:&quot;project-defeat-character&quot; …"
                  rows={3}
                />
                {importError && (
                  <p className="section-picker-import-error" role="alert" data-testid="front-import-error">
                    {importError}
                  </p>
                )}
                <div className="section-picker-import-actions">
                  <button
                    type="button"
                    className="section-picker-import-open"
                    onClick={() => {
                      setImporting(false)
                      setPasted('')
                      setImportError(undefined)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="section-picker-import-submit"
                    disabled={pasted.trim().length === 0}
                    onClick={() => setImportError(onImportCharacter(pasted))}
                    data-testid="front-import-submit"
                  >
                    Load my character
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {(['raidcomp', 'tierlists', 'raids', 'professions'] as const).map((id) => card(byId(id)))}
      </nav>

      {/*
        The study's developer looked for an About page, credits or a source link and found none
        anywhere. One line here, on the screen every visit starts from.
      */}
      <p className="section-picker-credit">
        A fan-made planner, local-first: nothing you enter leaves your browser. Data from Wowhead, wowsims and archon.gg.{' '}
        <a href="https://github.com/josephevenson08/project-defeat">Source on GitHub</a>
      </p>
    </div>
  )
}
