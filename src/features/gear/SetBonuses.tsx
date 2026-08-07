import type { ActiveSet } from '../../domain/gear/itemSets'

type SetBonusesProps = {
  /** Sets the equipped gear has pieces of. Surfaced precisely because none of them reach the stat totals. */
  activeSets: readonly ActiveSet[]
}

/**
 * Tier set bonuses for the equipped gear.
 *
 * This used to live in the simulator panel, which meant hiding the simulator hid it too — but a set
 * bonus is a fact about what you are wearing, not a simulation output, so it belongs here.
 *
 * Of sixteen Tier 5 set bonuses, not one is a flat stat addition: they attach to a named ability, a
 * resource cost, or the party. Folding them into the stat totals would invent value rather than
 * estimate it, so they are listed and explicitly marked unscored. That caveat is the point of the
 * component — without it the panel implies tier pieces are being valued when they are not.
 */
export function SetBonuses({ activeSets }: SetBonusesProps) {
  if (activeSets.length === 0) return null

  return (
    <div className="set-bonus-list" data-testid="set-bonuses">
      <h3 className="set-bonus-heading">Tier set pieces equipped</h3>
      <p className="set-bonus-caveat">
        None of these bonuses are included in the stat totals. Almost every TBC set bonus attaches to a named
        ability, a resource cost, or the party rather than to stats, so counting them as stats would invent value
        rather than estimate it. They are listed so the gap stays visible: any ranking built from itemised stats
        alone <strong>undervalues tier pieces</strong>.
      </p>
      {activeSets.map(({ set, equippedPieces, activeBonuses }) => (
        <div className="set-bonus-entry" key={set.id}>
          <span className="set-bonus-name">
            {set.name} ({equippedPieces}/{set.totalPieces})
          </span>
          {set.bonuses.map((bonus) => {
            const live = activeBonuses.includes(bonus)
            return (
              <small className={live ? 'set-bonus-active' : 'set-bonus-inactive'} key={bonus.pieces}>
                ({bonus.pieces}) {bonus.description}
                {live ? ' — active, not counted' : ''}
              </small>
            )
          })}
        </div>
      ))}
    </div>
  )
}
