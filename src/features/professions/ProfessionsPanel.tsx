import { useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { allProfessions, getProfessionProfile } from '../../domain/professions'
import type { Profession, ProfessionProfile } from '../../domain/professions'

/**
 * What each card says under the name, computed from the profile rather than written.
 *
 * A gathering profession is described by where you farm it, a crafting one by how many recipe steps
 * its path has. Quoting "13 tiers" for all of them would be true, identical for every card, and
 * therefore useless.
 */
function describeProfession(profile: ProfessionProfile): string {
  if (profile.materialFarming?.length) {
    return `${profile.materialFarming.length} farm ${profile.materialFarming.length === 1 ? 'spot' : 'spots'}`
  }
  if (profile.levelingPath?.length) {
    return `${profile.levelingPath.length} recipe ${profile.levelingPath.length === 1 ? 'step' : 'steps'}`
  }
  return `${profile.tiers.length} skill tiers`
}

export function ProfessionsPanel() {
  const [selected, setSelected] = useState<Profession>('Mining')
  const profile = getProfessionProfile(selected)

  return (
    <Panel title="Professions" eyebrow="Leveling & farming" className="professions-panel-shell">
      <p className="panel-copy">
        Skill tiers, trainer level requirements, and raw material farm spots for every TBC profession. Approximate or
        unconfirmed details are flagged &quot;needs verification&quot; rather than stated as fact.
      </p>

      {/*
        A card grid rather than rows of text buttons, following the raid picker: this is the same kind
        of choice — thirteen things, pick the one you came for — and it was the one screen in the app
        with no artwork on it at all.

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
              className={`profession-card ${profession === selected ? 'profession-card-selected' : ''}`.trim()}
              data-category={entry.category}
              aria-pressed={profession === selected}
              onClick={() => setSelected(profession)}
              data-testid={`profession-pick-${profession.toLowerCase().replaceAll(' ', '-')}`}
            >
              <img className="profession-card-icon" src={`${import.meta.env.BASE_URL}icons/${entry.icon}.jpg`} alt="" loading="lazy" />
              <span className="profession-card-name">{profession}</span>
              <span className="profession-card-meta">
                {entry.category} · {describeProfession(entry)}
              </span>
            </button>
          )
        })}
      </div>

      {profile ? (
        <div className="profession-detail" data-testid="profession-detail">
          <div className="profession-detail-header">
            <h3>{profile.profession}</h3>
            <span>{profile.category}</span>
          </div>
          {profile.notes && <p className="panel-copy">{profile.notes}</p>}

          {/*
            Linked rather than reproduced. wow-professions.com's routes and recipe orders are their
            work; copying them here would be taking it, and it would go stale the moment they fixed
            something. This app carries the parts it can source and cite — tiers, trainers, farm
            spots — and sends you there for the step-by-step.
          */}
          <div className="profession-guides">
            <a className="profession-guide-link" href={profile.guideUrl} target="_blank" rel="noopener noreferrer">
              Leveling guide on wow-professions.com
            </a>
            {profile.specializationUrl && (
              <a className="profession-guide-link" href={profile.specializationUrl} target="_blank" rel="noopener noreferrer">
                Specializations
              </a>
            )}
          </div>

          <h4>Skill Tiers (cap {profile.skillCap})</h4>
          <div className="profession-tier-list">
            {profile.tiers.map((tier) => (
              <div className="profession-tier-row" key={tier.tier}>
                <div>
                  <strong>{tier.tier}</strong>
                  <span>
                    Skill {tier.skillRange[0]}-{tier.skillRange[1]} · Level {tier.requiredCharacterLevel}+
                  </span>
                </div>
                <p>{tier.trainedFrom}</p>
                {tier.needsVerification && <small className="needs-verification">{tier.notes ?? 'Needs source verification.'}</small>}
              </div>
            ))}
          </div>

          {profile.materialFarming && profile.materialFarming.length > 0 && (
            <>
              <h4>Raw Material Farming</h4>
              <div className="profession-material-list">
                {profile.materialFarming.map((spot) => (
                  <div className="profession-material-row" key={spot.material}>
                    <div>
                      <strong>{spot.material}</strong>
                      <span>
                        Skill {spot.skillRange[0]}-{spot.skillRange[1]} · Level {spot.recommendedCharacterLevel}
                      </span>
                    </div>
                    <p>{spot.zones.join(', ')}</p>
                    {spot.needsVerification && <small className="needs-verification">{spot.notes ?? 'Needs source verification.'}</small>}
                  </div>
                ))}
              </div>
            </>
          )}

          {profile.levelingPath && profile.levelingPath.length > 0 && (
            <>
              <h4>Leveling Path</h4>
              <div className="profession-material-list">
                {profile.levelingPath.map((step) => (
                  <div className="profession-material-row" key={`${step.skillRange[0]}-${step.skillRange[1]}-${step.recipeOrItem}`}>
                    <div>
                      <strong>{step.recipeOrItem}</strong>
                      <span>
                        Skill {step.skillRange[0]}-{step.skillRange[1]}
                      </span>
                    </div>
                    <p>
                      {step.recipeSource}
                      {step.keyMaterials && step.keyMaterials.length > 0 ? ` · Materials: ${step.keyMaterials.join(', ')}` : ''}
                    </p>
                    {step.needsVerification && <small className="needs-verification">{step.notes ?? 'Needs source verification.'}</small>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="professions-empty">No profession selected.</div>
      )}
    </Panel>
  )
}
