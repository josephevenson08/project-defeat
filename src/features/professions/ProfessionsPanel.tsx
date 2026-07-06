import { useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { allProfessions, getProfessionProfile } from '../../domain/professions'
import type { Profession, ProfessionCategory } from '../../domain/professions'

const CATEGORY_ORDER: readonly ProfessionCategory[] = ['Gathering', 'Crafting', 'Secondary']

function categoryOf(profession: Profession) {
  return getProfessionProfile(profession)?.category
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

      <div className="professions-picker">
        {CATEGORY_ORDER.map((category) => (
          <div className="professions-picker-group" key={category}>
            <span className="professions-picker-label">{category}</span>
            <div className="professions-picker-buttons">
              {allProfessions
                .filter((profession) => categoryOf(profession) === category)
                .map((profession) => (
                  <button
                    key={profession}
                    type="button"
                    className={`tab-nav-button ${profession === selected ? 'tab-nav-button-active' : ''}`.trim()}
                    onClick={() => setSelected(profession)}
                  >
                    {profession}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {profile ? (
        <div className="profession-detail" data-testid="profession-detail">
          <div className="profession-detail-header">
            <h3>{profile.profession}</h3>
            <span>{profile.category}</span>
          </div>
          {profile.notes && <p className="panel-copy">{profile.notes}</p>}

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
