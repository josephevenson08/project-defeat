import { getQualityColor } from '../../domain/gear/qualityColors'
import type { ItemTipModel } from './itemTipModel'

/**
 * A game-style item tooltip: our own markup and wording in the game's layout and colours (quality
 * name, yellow item level, white base stats, the enchant in green, sockets or the gems in them, the
 * socket bonus, green bonuses, the set, a yellow kind line). The icons are the files the app already
 * ships. Drawn inside a `FloatingTip`, or straight on the page where a tab shows items as tooltips
 * (Ranked Gear).
 */
export function ItemTooltip({ tip }: { tip: ItemTipModel }) {
  const base = tip.stats.filter((stat) => stat.base)
  const green = tip.stats.filter((stat) => !stat.base)
  return (
    <span className="item-tip">
      <b className="item-tip-name" style={{ color: tip.quality ? getQualityColor(tip.quality) : undefined }}>
        {tip.name}
      </b>
      {tip.itemLevel !== undefined && <span className="item-tip-ilvl">Item Level {tip.itemLevel}</span>}
      {tip.unique && <span>Unique</span>}
      {(tip.slot || tip.typeLine) && (
        <span className="item-tip-row">
          <span>{tip.slot}</span>
          <span>{tip.typeLine}</span>
        </span>
      )}
      {tip.damage && (
        <span className="item-tip-row">
          <span>
            {tip.damage.min} - {tip.damage.max} Damage
          </span>
          <span>Speed {tip.damage.speed.toFixed(2)}</span>
        </span>
      )}
      {base.map((stat) => (
        <span key={stat.text}>{stat.text}</span>
      ))}
      {tip.enchant && <span className="item-tip-green">{tip.enchant}</span>}
      {tip.sockets?.map((socket, index) => {
        const gem = tip.gems?.[index]
        return gem ? (
          <span key={`${socket}-${index}`} className="item-tip-gem">
            {gem.icon && <img src={`${import.meta.env.BASE_URL}icons/${gem.icon}.jpg`} alt="" width={14} height={14} loading="lazy" />}
            {gem.name}
          </span>
        ) : (
          <span key={`${socket}-${index}`} className={`item-tip-socket item-tip-socket-${socket.toLowerCase()}`}>
            {socket} Socket
          </span>
        )
      })}
      {tip.socketBonus && <span className={tip.socketBonusOn ? 'item-tip-green' : 'item-tip-grey'}>Socket Bonus: {tip.socketBonus}</span>}
      {green.map((stat) => (
        <span key={stat.text} className="item-tip-green">
          {stat.text}
        </span>
      ))}
      {tip.set && (
        <>
          <span className="item-tip-set">{tip.set.name}</span>
          {tip.set.bonuses.map((bonus) => (
            <span key={bonus} className="item-tip-grey">
              {bonus}
            </span>
          ))}
        </>
      )}
      {tip.kind && <span className="item-tip-kind">{tip.kind}</span>}
      {!tip.quality && <span className="item-tip-grey">Not in the item catalogue, so listed by name only.</span>}
      {tip.note && <span className="item-tip-note">{tip.note}</span>}
      {tip.where && <span className="item-tip-where">{tip.where}</span>}
      {tip.ranks && (
        <span className="item-tip-ranks">
          {tip.ranks.yours && (
            <>
              <b>{tip.ranks.yours}</b>
              <br />
            </>
          )}
          On {tip.ranks.total} Wowhead Phase 2 {tip.ranks.total === 1 ? 'list' : 'lists'}
          {tip.ranks.others.length > 0 && `: ${tip.ranks.others.join(', ')}${tip.ranks.more > 0 ? `, and ${tip.ranks.more} more` : ''}`}
        </span>
      )}
      {tip.unranked && <span className="item-tip-grey">On no spec's Wowhead Phase 2 list.</span>}
    </span>
  )
}
