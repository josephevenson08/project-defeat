import {
  allProfessions,
  craftingPathFor,
  feedShares,
  fedBy,
  getProfessionProfile,
  guideFor,
  payoffFor,
  placesFor,
  specLists,
  suppliesOf,
} from '../../domain/professions'
import type { ListPlace, PayoffKind, Profession, SpecList } from '../../domain/professions'
import { KindTag, ProfessionIcon } from './ProfessionWindow'
import { professionSlug } from './professionsSession'

const KIND_ORDER: Record<PayoffKind, number> = { stat: 0, gear: 1, utility: 2, feeds: 3 }
const specName = (list: SpecList) => `${list.spec} ${list.className}`
const slotName = (slot: string) => slot.replace(/ [12]$/, '')

const primary = allProfessions.filter((name) => getProfessionProfile(name)?.category !== 'Secondary')
const secondary = allProfessions.filter((name) => getProfessionProfile(name)?.category === 'Secondary')

function kindsOf(profession: Profession): PayoffKind[] {
  return [...new Set((payoffFor(profession)?.perks ?? []).map((perk) => perk.kind))]
}

/** Best for your spec first: most places on its list, then the strongest kind of payoff, then by name. */
function forSpecFirst(list: readonly Profession[], spec: SpecList): Profession[] {
  const best = (name: Profession) => Math.min(4, ...kindsOf(name).map((kind) => KIND_ORDER[kind]))
  return [...list].sort(
    (a, b) => placesFor(b, spec).length - placesFor(a, spec).length || best(a) - best(b) || a.localeCompare(b),
  )
}

type WhichTwoProps = {
  spec: SpecList
  onSpec: (key: string) => void
  /** Your two, oldest first. */
  pair: readonly Profession[]
  onToggle: (profession: Profession) => void
  /** Whether the pair is your character's (and the planner reads it) or held for this visit only. */
  heldBy: 'character' | 'visit'
}

/**
 * "Which two": every profession by what it gives a level 70 character, led by what it makes for your
 * spec from Wowhead's Phase 2 list, and a pair to pick (design B, merged into the tab behind the
 * switch).
 *
 * **The pair is your character's two professions** when there is a character, the same two the
 * planner reads for Enchanting's ring enchants, so there is one place they are chosen. The prototype
 * kept a pair of its own for the session; in the app that would be a second answer to "which two do
 * you have". A third pick replaces the oldest, the rule the app's picker has always had: refusing it
 * leaves you to work out which of your two is in the way.
 */
export function WhichTwo({ spec, onSpec, pair, onToggle, heldBy }: WhichTwoProps) {
  return (
    <div className="wt">
      <PairSection spec={spec} onSpec={onSpec} pair={pair} onToggle={onToggle} heldBy={heldBy} />

      <section className="wt-section" aria-labelledby="wt-primary">
        <h2 id="wt-primary">
          Primary professions <small>{primary.length} · best for {specName(spec)} first</small>
        </h2>
        <div className="wt-grid">
          {forSpecFirst(primary, spec).map((name) => (
            <ProfessionCard key={name} profession={name} spec={spec} pair={pair} onToggle={onToggle} />
          ))}
        </div>
      </section>

      <section className="wt-section" aria-labelledby="wt-secondary">
        <h2 id="wt-secondary">
          Secondary professions <small>open to every character, on top of your two</small>
        </h2>
        <div className="wt-grid">
          {secondary.map((name) => (
            <ProfessionCard key={name} profession={name} spec={spec} pair={pair} />
          ))}
        </div>
      </section>
    </div>
  )
}

function PairSection({ spec, onSpec, pair, onToggle, heldBy }: WhichTwoProps) {
  const places = pair.flatMap((name) => placesFor(name, spec))
  const firstPicks = places.filter((place) => place.rank === 1)
  const stat = pair.find((name) => kindsOf(name).includes('stat'))
  const both = pair.length === 2 ? `this pair` : 'it'

  let relation: string | undefined
  if (pair.length === 2) {
    const [a, b] = pair
    const aFeedsB = feedShares(b).get(a) ?? 0
    const bFeedsA = feedShares(a).get(b) ?? 0
    const crafts = (name: Profession) => craftingPathFor(name).length > 0
    if (aFeedsB >= 10) relation = `${a} feeds ${b}: ${aFeedsB}% of its farmed materials.`
    else if (bFeedsA >= 10) relation = `${b} feeds ${a}: ${bFeedsA}% of its farmed materials.`
    else if (crafts(a) && crafts(b)) relation = 'Two crafters: neither gathers for the other, so every material is farmed elsewhere or bought.'
    else if (guideFor(a) && guideFor(b)) relation = 'Two gatherers: no crafting, so the payoff is gold rather than anything on your character.'
    else relation = 'Neither feeds the other.'
  }

  return (
    <section className="wt-section wt-pair" aria-labelledby="wt-pair" data-testid="profession-picker">
      <h2 id="wt-pair">
        Your two{' '}
        <small>
          {pair.length}/2 · everyone gets two primary professions; the secondary three are open to all
        </small>
      </h2>
      <label className="wt-spec">
        For
        <select value={`${spec.className}|${spec.spec}`} onChange={(event) => onSpec(event.target.value)} data-testid="which-spec">
          {specLists.map((list) => (
            <option key={list.key} value={list.key}>
              {specName(list)}
            </option>
          ))}
        </select>
      </label>

      <div className="wt-slots">
        {[0, 1].map((slot) => {
          const name = pair[slot]
          const profile = name ? getProfessionProfile(name) : undefined
          return name && profile ? (
            <div key={slot} className={`wt-slot wt-slot-full pw-cat-${profile.category.toLowerCase()}`}>
              <ProfessionIcon icon={profile.icon} size={40} />
              <span>
                <b>{name}</b>
                <small>{profile.category}</small>
              </span>
              <button
                type="button"
                onClick={() => onToggle(name)}
                aria-label={`Drop ${name}`}
                data-testid={`profession-drop-${professionSlug(name)}`}
              >
                Drop
              </button>
            </div>
          ) : (
            <div key={slot} className="wt-slot">
              <span>
                <b>{slot === 0 ? 'First' : 'Second'} profession</b>
                <small>Press Pick on a card below</small>
              </span>
            </div>
          )
        })}
      </div>

      {pair.length > 0 && (
        <ul className="wt-sum" data-testid="which-summary">
          <li>
            {places.length > 0 ? (
              <>
                <b>
                  {places.length} {places.length === 1 ? 'place' : 'places'}
                </b>{' '}
                on the {specName(spec)} list made by {both}
                {firstPicks.length > 0 && `, including a first pick: ${firstPicks.map((place) => place.name).join(', ')}`}.
              </>
            ) : (
              `Nothing on the ${specName(spec)} list is made by ${pair.length === 2 ? 'either' : 'it'}.`
            )}
          </li>
          {stat && (
            <li>
              <b>{stat}</b> is the one profession that puts a permanent stat on your character sheet.
            </li>
          )}
          {relation && <li>{relation}</li>}
        </ul>
      )}

      <p className="wt-held">
        {heldBy === 'character'
          ? "These are your character's two, and the planner reads them: Enchanting's two ring enchants are the only stats a profession adds."
          : 'Held for this visit. Make a character on the planner to keep your two with a build.'}
      </p>
    </section>
  )
}

function PlaceRow({ place }: { place: ListPlace }) {
  return (
    <li>
      <ProfessionIcon icon={place.icon} size={26} />
      <span className={`wt-rank${place.rank === 1 ? ' wt-rank-first' : ''}`} title={`Rank ${place.rank} on the list`}>
        #{place.rank}
      </span>
      <span>
        <b>{place.name}</b>{' '}
        <small>
          {slotName(place.slot)}
          {place.bindsOnPickup ? ' · binds on pickup' : ''}
          {place.via ? ` · ${place.via}` : ''}
        </small>
      </span>
    </li>
  )
}

function ProfessionCard({
  profession,
  spec,
  pair,
  onToggle,
}: {
  profession: Profession
  spec: SpecList
  pair: readonly Profession[]
  onToggle?: (profession: Profession) => void
}) {
  const profile = getProfessionProfile(profession)
  const payoff = payoffFor(profession)
  if (!profile) return null
  const places = placesFor(profession, spec)
  const picked = pair.includes(profession)
  const replaces = !picked && pair.length >= 2 ? pair[0] : undefined
  const supplies = guideFor(profession) ? suppliesOf(profession) : []
  const fed = craftingPathFor(profession).length > 0 ? fedBy(profession) : []
  const tags = payoff
    ? [...new Map(payoff.perks.map((perk) => [`${perk.kind}${perk.phase ?? ''}`, perk])).values()].sort(
        (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
      )
    : []

  return (
    <article
      className={`wt-card pw-cat-${profile.category.toLowerCase()}${picked ? ' wt-card-on' : ''}`}
      data-card={profession}
      data-testid={`which-card-${professionSlug(profession)}`}
    >
      <div className="wt-ch">
        <ProfessionIcon icon={profile.icon} size={40} />
        <span>
          <b>{profession}</b>
          <small>{profile.category}</small>
        </span>
        {onToggle && (
          <button
            type="button"
            className="wt-pick"
            aria-pressed={picked}
            title={replaces ? `Replaces ${replaces}, the older of your two` : undefined}
            onClick={() => onToggle(profession)}
            data-testid={`profession-${professionSlug(profession)}`}
          >
            {picked ? 'Picked' : replaces ? 'Swap in' : 'Pick'}
          </button>
        )}
      </div>
      {payoff && (
        <>
          <p className="wt-verdict">{payoff.verdict}</p>
          <div className="pw-kinds">
            {tags.map((perk) => (
              <KindTag key={`${perk.kind}${perk.phase ?? ''}`} kind={perk.kind} phase={perk.phase} />
            ))}
          </div>
        </>
      )}
      <div className="wt-for">
        <span>For {specName(spec)}, from Wowhead&rsquo;s list</span>
        {places.length > 0 ? (
          <>
            <ul className="wt-items">
              {places.slice(0, 4).map((place) => (
                <PlaceRow key={`${place.slot}-${place.wowItemId}`} place={place} />
              ))}
            </ul>
            {places.length > 4 && <span className="wt-none">and {places.length - 4} more</span>}
          </>
        ) : (
          <span className="wt-none">Makes nothing on its list</span>
        )}
      </div>
      {supplies.length > 0 && (
        <p className="wt-feed">
          Supplies{' '}
          {supplies.map(({ crafter, share }, index) => (
            <span key={crafter}>
              {index > 0 && ', '}
              <b>{crafter}</b> ({share}% of its farmed materials)
            </span>
          ))}
          .
        </p>
      )}
      {craftingPathFor(profession).length > 0 &&
        (fed.length > 0 ? (
          <p className="wt-feed">
            Fed by{' '}
            {fed.map(({ gatherer, share }, index) => (
              <span key={gatherer}>
                {index > 0 && ', '}
                <b>{gatherer}</b> ({share}% of its farmed materials)
              </span>
            ))}
            .
          </p>
        ) : (
          <p className="wt-feed">No gathering profession supplies it: its materials drop or are bought.</p>
        ))}
      {payoff && payoff.perks.length > 0 && (
        <details className="pw-more">
          <summary>What you get, in full</summary>
          <ul className="pw-perks">
            {payoff.perks.map((perk) => (
              <li key={perk.name}>
                <b>{perk.name}</b>
                {perk.requiresSkill ? ` (skill ${perk.requiresSkill})` : ''}
                {perk.phase ? ` · phase ${perk.phase}` : ''}: {perk.detail}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}
