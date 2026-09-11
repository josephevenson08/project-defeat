import { payoffFor } from '../../domain/professions'
import type { PayoffKind, Profession } from '../../domain/professions'

/**
 * What the kind labels say on screen.
 *
 * Spelled out rather than shown as the raw enum, because "feeds" means nothing to a reader and the
 * whole point of the field is that these four are different questions. `stat` is deliberately the
 * loudest — it is the rarest and the only one you can add up.
 */
const KIND_LABEL: Record<PayoffKind, string> = {
  stat: 'On your character sheet',
  gear: 'Gear only you can wear',
  utility: 'Something only you can do',
  feeds: 'Worth knowing',
}

/**
 * The answer to "is this worth carrying to 70".
 *
 * **It sits above the levelling guide rather than below it**, because it is the question you ask
 * first. Somebody opening the Blacksmithing page has usually not decided to level Blacksmithing yet;
 * telling them what 375 buys before telling them how to get there is the order the decision is
 * actually made in.
 *
 * **The `feeds` entries are the ones worth the pixels.** Three of them say a profession gives you
 * nothing — Herbalism, Mining and Skinning — and two more correct a perk people are certain exists:
 * Blacksmithing's extra sockets and Leatherworking's Fur Lining are both Wrath. An empty section
 * would read as data we have not got to; a sentence saying "this does not exist here, and here is why
 * you thought it did" is the useful version.
 */
export function ProfessionPayoff({ profession }: { profession: Profession }) {
  const payoff = payoffFor(profession)
  if (!payoff) return null

  return (
    <section className="profession-payoff" data-testid="profession-payoff">
      <h3>What it is worth at 70</h3>
      <p className="profession-payoff-verdict">{payoff.verdict}</p>

      <ul className="profession-payoff-perks">
        {payoff.perks.map((perk) => (
          <li key={perk.name} className={`profession-payoff-perk profession-payoff-${perk.kind}`}>
            <span className="profession-payoff-kind">{KIND_LABEL[perk.kind]}</span>
            <strong>{perk.name}</strong>
            <p>{perk.detail}</p>

            <p className="profession-payoff-meta">
              {perk.requiresSkill && <span>Needs skill {perk.requiresSkill}</span>}
              {/*
                Phase is a real qualifier rather than trivia: this app plans Phase 2, so "Jewelcrafting
                gets exclusive trinkets" is different advice when they are three phases out.
              */}
              {perk.phase && <span>Phase {perk.phase}</span>}
            </p>

            {perk.needsVerification && (
              <small className="needs-verification">
                {perk.notes ?? 'Needs source verification.'}
              </small>
            )}
            {!perk.needsVerification && perk.notes && (
              <small className="profession-payoff-note">{perk.notes}</small>
            )}
          </li>
        ))}
      </ul>

      <p className="profession-range-sources">Checked against {payoff.sources.join(', ')}</p>
    </section>
  )
}
