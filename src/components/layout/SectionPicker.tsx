import { useEffect, useState } from 'react'

export type SectionId = 'planner' | 'raidcomp' | 'tierlists' | 'raids' | 'professions'

type SectionDefinition = {
  id: SectionId
  label: string
  /** Two or three words. This is the promise the card makes about what is behind it. */
  tagline: string
  blurb: string
  /** Accent for this section, carried through to its border and its rule. */
  accent: string
}

/**
 * The four things this app does, offered as a deliberate choice rather than a tab bar you land in
 * the middle of.
 *
 * The tab bar still exists once you are inside — this is a way *in*, not a replacement for moving
 * between sections afterwards.
 *
 * Each section owns a hue here. That is a deliberate loosening of the near-monochrome policy, which
 * exists so item quality reads first — a rule that only binds where item quality is on screen. It is
 * not, here. Nothing on this page competes with a purple.
 */
const SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'planner',
    label: 'Character Planner',
    tagline: 'Gear, gems and talents',
    blurb: 'Build a character from faction to spec, fill every slot against real Phase 2 rankings, and see what the stats come to.',
    accent: '#9c7346',
  },
  {
    id: 'raidcomp',
    label: 'Raid Composition',
    tagline: 'Buff coverage',
    blurb: 'Plan a 10 or 25-player roster and see which raid buffs and target debuffs it actually brings — and what one more seat would buy you.',
    accent: '#9c6a6a',
  },
  {
    id: 'tierlists',
    label: 'Spec Tier Lists',
    tagline: 'Where specs stand',
    blurb: 'Wowhead’s Phase 2 rankings for damage, healing and tanking — all three lists on one page.',
    accent: '#856a9c',
  },
  {
    id: 'raids',
    label: 'Raids',
    tagline: 'Loot tables',
    blurb: 'What drops where across Serpentshrine Cavern, Tempest Keep and the Phase 1 raids still worth running.',
    accent: '#6a7fa8',
  },
  {
    id: 'professions',
    label: 'Professions',
    tagline: 'Levelling and payoffs',
    blurb: 'How to take a profession to 375 without wasting materials, and what each one is actually worth at 70.',
    accent: '#6f8f6a',
  },
]

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

      <nav className="section-picker-grid" aria-label="Choose a section">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className="section-card"
            style={{ '--section-accent': section.accent } as React.CSSProperties}
            onClick={() => onSelect(section.id)}
            data-testid={`section-${section.id}`}
          >
            <span className="section-card-tagline">{section.tagline}</span>
            <span className="section-card-label">{section.label}</span>
            <span className="section-card-blurb">{section.blurb}</span>
          </button>
        ))}
      </nav>

      {/*
        **Arriving as yourself, before there is a character to overwrite.**

        Below the cards rather than among them: the six are places to go, and this is a way to turn
        up already geared. It has to be here and not only on the planner's Build tab, because
        pasting the string *is* character creation — sending someone through four creation steps to
        build a character they are about to replace is backwards for anyone who already plays one.
      */}
      <div className="section-picker-import">
        {!importing ? (
          <button
            type="button"
            className="section-picker-import-open"
            onClick={() => setImporting(true)}
            data-testid="front-import-open"
          >
            Already playing? Import your character from the game
          </button>
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
  )
}
