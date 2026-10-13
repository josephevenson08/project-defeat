import type { CSSProperties } from 'react'
import { SpecIcon } from '../../components/ui/SpecIcon'
import { getClassColor } from '../../domain/character/classColors'
import type { SpecStanding, SpecContribution } from '../../domain/tierlists/specStanding'
import { specTierLists } from '../../domain/tierlists'
import { LOGS_READ_ON, formatDps, ordinal, plural, specName } from './tierFormat'

/**
 * A tier letter in its box. Rank reads through the box's weight and the letter's ink, never through
 * item-quality colour: `depth` 0 is the boldest and the bottom tiers are dashed and faint.
 */
export function TierLetter({ label, depth, title }: { label: string; depth?: number; title?: string }) {
  return (
    <span className="tier-letter" data-depth={depth} title={title}>
      {label}
    </span>
  )
}

function Contribution({ thing, named }: { thing: SpecContribution; named: boolean }) {
  const reach = thing.scope === 'party' ? 'its group' : thing.scope === 'raid' ? 'whole raid' : 'boss debuff'
  return (
    <span className="spec-brings-item" title={`${thing.name} (${reach})`}>
      {thing.icon && <img src={`${import.meta.env.BASE_URL}icons/${thing.icon}.jpg`} alt="" width={22} height={22} loading="lazy" />}
      <span className={named ? undefined : 'visually-hidden'}>{thing.name}</span>
    </span>
  )
}

export function SpecContributions({ standing, named = true }: { standing: SpecStanding; named?: boolean }) {
  if (standing.brings.length === 0) return <span className="spec-card-none">Nothing the app counts yet</span>
  return (
    <span className="spec-brings">
      {standing.brings.map((thing) => (
        <Contribution key={thing.id} thing={thing} named={named} />
      ))}
    </span>
  )
}

type SpecCardProps = {
  standing: SpecStanding
  isYours: boolean
  /** How many seats in the saved Raid Composition roster play this spec, when there is a roster. */
  inYourRaid?: number
}

/**
 * Everything the app knows about one spec's standing: its place on each of Wowhead's lists, what
 * the logs say, what it brings to a raid and its signature ability. Design A's card, also opened
 * from a row of "Against the logs".
 */
export function SpecCard({ standing, isYours, inYourRaid }: SpecCardProps) {
  const { logs } = standing
  const firstList = specTierLists.find((list) => list.role === standing.places[0]?.role) ?? specTierLists[0]

  return (
    <div className="spec-card" style={{ '--spec-class': getClassColor(standing.className) } as CSSProperties} data-testid="spec-card">
      <div className="spec-card-head">
        <SpecIcon className={standing.className} spec={standing.spec} size={48} />
        <div>
          <h3>{specName(standing)}</h3>
          <p>
            {standing.role}
            {standing.ability && (
              <>
                {' '}
                · signature ability <b>{standing.ability}</b>
              </>
            )}
            {isYours && (
              <>
                {' '}
                · <span className="tier-you">Your spec</span>
              </>
            )}
          </p>
        </div>
      </div>

      <dl className="spec-card-facts">
        {specTierLists.map((list) => {
          const place = standing.places.find((candidate) => candidate.role === list.role)
          return (
            <div key={list.role}>
              <dt>Wowhead · {list.role}</dt>
              <dd>
                {place ? (
                  <>
                    <TierLetter label={place.label} depth={place.depth} /> of {place.labels.join(' ')}
                  </>
                ) : (
                  <span className="spec-card-none">Not on this list</span>
                )}
              </dd>
            </div>
          )
        })}
        <div>
          <dt>The logs · archon.gg</dt>
          <dd>
            {logs ? (
              <>
                <b>{formatDps(logs.dps)}</b> DPS average, {ordinal(logs.rank)} of {logs.of} · archon's tier{' '}
                <TierLetter label={logs.tier} />
              </>
            ) : (
              <span className="spec-card-none">
                No log numbers in the app for {standing.role === 'Tank' ? 'tanks' : 'healers'}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="spec-card-label">What it brings to a raid</p>
      <SpecContributions standing={standing} />

      {inYourRaid !== undefined && (
        <p className="spec-card-raid">
          {inYourRaid === 0 ? 'None in your raid' : `${plural(inYourRaid, 'player')} in your raid`} (from Raid Composition)
        </p>
      )}

      <p className="spec-card-source">
        Tiers:{' '}
        <a href={firstList.sourceUrl} target="_blank" rel="noreferrer noopener">
          Wowhead's reasoning
        </a>{' '}
        (their words stay on their page){logs && LOGS_READ_ON ? ` · logs: archon.gg, read ${LOGS_READ_ON}` : ''}
      </p>
    </div>
  )
}
