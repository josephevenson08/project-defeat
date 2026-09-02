import { useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { allProfessions, getProfessionProfile } from '../../domain/professions'
import type { Profession } from '../../domain/professions'
import { ProfessionPage } from './ProfessionPage'

/**
 * The professions tab, as a way in rather than a wall.
 *
 * **It used to be a picker with the whole selected profession printed under it**, which meant the
 * page opened on thirteen cards, a five-row skill-tier table, nineteen farm rows and up to thirty
 * maps — everything about one profession competing with the choice of profession. This splits the
 * two: pick, then read.
 *
 * The cards carry the icon and the name and nothing else. A meta line — "Gathering · 19 farm spots" —
 * is a number about the page behind the card rather than a reason to open it, and thirteen of them
 * is the clutter the split was made to remove.
 */
export function ProfessionsPanel() {
  const [selected, setSelected] = useState<Profession | null>(null)
  const profile = selected ? getProfessionProfile(selected) : undefined

  if (selected && profile) {
    return <ProfessionPage profile={profile} onBack={() => setSelected(null)} />
  }

  return (
    <Panel title="Professions" eyebrow="Levelling & farming" className="professions-panel-shell">
      <p className="panel-copy">
        Every TBC profession, with the route or the recipe list that takes it to 375. Approximate or
        unconfirmed details are flagged &quot;needs verification&quot; rather than stated as fact.
      </p>

      {/*
        Colour comes from the *category* rather than one hue per profession. Three muted accents carry
        a real distinction (what you gather, what you craft, what is secondary); thirteen would be
        decoration, and the palette here deliberately spends colour only where it means something.
      */}
      <div className="profession-picker-grid">
        {allProfessions.map((profession) => {
          const entry = getProfessionProfile(profession)
          if (!entry) return null

          return (
            <button
              key={profession}
              type="button"
              className="profession-card"
              data-category={entry.category}
              onClick={() => setSelected(profession)}
              data-testid={`profession-pick-${profession.toLowerCase().replaceAll(' ', '-')}`}
            >
              <img
                className="profession-card-icon"
                src={`${import.meta.env.BASE_URL}icons/${entry.icon}.jpg`}
                alt=""
                loading="lazy"
              />
              <span className="profession-card-name">{profession}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
