import { Panel } from '../../components/layout/Panel'
import { trainingMilestones } from '../../domain/professions'
import type { ProfessionProfile } from '../../domain/professions'
import { GatheringProgression } from './GatheringProgression'
import { CraftingProgression } from './CraftingProgression'

/**
 * One profession, on its own page.
 *
 * **The skill-tier table is gone and its content is not.** Five rows of Apprentice-through-Master are
 * identical on all thirteen professions and answer the question in the wrong shape: a player does not
 * want a table of brackets, they want telling — at the point they are standing on — that they have
 * to go and train before the next point will land. `trainingMilestones` turns the same data into
 * markers, and the two progression components interleave them with the ranges they gate.
 *
 * Gathering and crafting get different components because they answer different questions. A
 * gatherer asks *where*, and gets zones and a route. A crafter asks *what and how many*, and gets
 * counts and materials. Forcing one layout to serve both is what made the old panel read as a list.
 */
export function ProfessionPage({ profile, onBack }: { profile: ProfessionProfile; onBack: () => void }) {
  const milestones = trainingMilestones(profile.profession)
  const farming = profile.materialFarming ?? []
  const crafting = profile.levelingPath ?? []

  return (
    <Panel
      title={profile.profession}
      eyebrow={`${profile.category} · to ${profile.skillCap}`}
      className={`professions-panel-shell profession-page profession-page-${profile.category.toLowerCase()}`}
    >
      <button type="button" className="profession-back" onClick={onBack} data-testid="profession-back">
        ← All professions
      </button>

      {profile.notes && <p className="panel-copy">{profile.notes}</p>}

      {/*
        Linked rather than reproduced. wow-professions.com's routes and recipe orders are their work;
        copying them here would be taking it, and it would go stale the moment they fixed something.
        This app carries the parts it can source and cite — tiers, trainers, farm spots, and routes
        computed from raw coordinates — and sends you there for the step-by-step.
      */}
      <div className="profession-guides">
        <a className="profession-guide-link" href={profile.guideUrl} target="_blank" rel="noopener noreferrer">
          Levelling guide on wow-professions.com
        </a>
        {profile.specializationUrl && (
          <a className="profession-guide-link" href={profile.specializationUrl} target="_blank" rel="noopener noreferrer">
            Specializations
          </a>
        )}
      </div>

      {farming.length > 0 && <GatheringProgression spots={farming} milestones={milestones} />}
      {crafting.length > 0 && <CraftingProgression steps={crafting} milestones={milestones} />}

      {farming.length === 0 && crafting.length === 0 && (
        <p className="panel-copy professions-empty">
          No levelling path recorded for {profile.profession} yet — the guide above covers it in the
          meantime.
        </p>
      )}
    </Panel>
  )
}
