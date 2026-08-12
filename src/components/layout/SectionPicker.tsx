export type SectionId = 'planner' | 'tierlists' | 'raids' | 'professions'

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
}

export function SectionPicker({ onSelect }: SectionPickerProps) {
  return (
    <div className="section-picker">
      <div className="section-picker-head">
        <h1>Project Defeat</h1>
        <p className="section-picker-sub">TBC Classic · Phase 2</p>
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
    </div>
  )
}
