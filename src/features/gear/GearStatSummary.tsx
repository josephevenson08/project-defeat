import { relevantStats } from '../../domain/stats/statRelevance'
import { statLabels, type StatBlock } from '../../domain/stats/statTypes'
import type { CharacterRole, TbcClass, TbcSpec } from '../../domain/character/characterTypes'

/**
 * The handful of totals worth having beside the slot you are changing.
 *
 * **This is the middle of the paperdoll, and it replaced a drawing.** The figure that was there made
 * the arrangement read as a body, which was worth something — but the thing a player is actually
 * doing on this page is moving a number, and the number lived in the rail on the far side of the
 * screen. Putting it between the two columns of slots means the effect of a swap is next to its
 * cause.
 *
 * **Not a second stat panel.** The rail still carries all twenty-six and stays the source of truth;
 * this is six, chosen per role, and it says so. Duplicating the rail here would be two things to
 * keep in sync and two places to read the same number wrong.
 */

const HEADLINE_BY_ROLE: Record<CharacterRole, ReadonlyArray<keyof StatBlock>> = {
  'Physical DPS': ['attackPower', 'hitRating', 'critRating', 'hasteRating', 'expertiseRating', 'armorPenetration'],
  'Caster DPS': ['spellPower', 'spellHitRating', 'spellCritRating', 'spellHasteRating', 'intellect', 'mp5'],
  Healer: ['healingPower', 'spellCritRating', 'spellHasteRating', 'mp5', 'intellect', 'spirit'],
  Tank: ['armor', 'stamina', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating'],
}

const LABEL_BY_KEY = new Map(statLabels)

export function GearStatSummary({
  stats,
  role,
  className,
  spec,
}: {
  stats: StatBlock
  role: CharacterRole
  className: TbcClass
  spec: TbcSpec
}) {
  /*
   * Filtered through the same relevance rules the rail uses rather than trusted as written. A
   * headline list is a per-role guess; `statRelevance` knows the per-*spec* exceptions, and a Feral
   * Druid seeing Expertise it cannot use would be the same class of wrong row the rail already
   * learned to hide.
   */
  const keys = relevantStats(HEADLINE_BY_ROLE[role], role, className, spec)
  if (keys.length === 0) return null

  return (
    <aside className="gear-summary" aria-label="Key totals" data-testid="gear-stat-summary">
      <p className="gear-summary-title">Key totals</p>

      <dl className="gear-summary-list">
        {keys.map((key) => (
          <div className="gear-summary-row" key={key}>
            <dt>{LABEL_BY_KEY.get(key) ?? key}</dt>
            {/*
              Tabular figures so the column of numbers lines up as you swap items and the digits
              change width — the whole point of putting them here is watching one move.
            */}
            <dd>{Math.round(stats[key]).toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      {/*
        Said rather than implied: showing a handful of stats is a deliberate edit, and a reader who
        cannot see Spirit here should know where it went rather than wonder whether the app forgot it.

        It used to read "The rail carries all twenty-six." Five of twelve participants in the
        2026-09-21 usability study stopped on it. "Rail" is this project's name for the sidebar, which
        no visitor knows, and the count would have gone stale the first time a stat was added. The
        sidebar's own heading is "Stats", on a phone as on a desktop, so that is the word to point at.
      */}
      <p className="gear-summary-note">The full list is under Stats.</p>
    </aside>
  )
}
