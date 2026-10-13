import { getAttunementChainForRaid, getBossesForRaid, raidDropCount, sampleAttunements, sampleRaids, type Raid } from '../../domain/raids'

/**
 * The journal's first page: the raid's facts, how to get there, whether you can get in, the
 * attunement chain step by step, and which other raid's attunement passes through this one.
 */
export function RaidAbout({ raid }: { raid: Raid }) {
  const chain = getAttunementChainForRaid(raid.id)
  const here = raid.name.split(':')[0]
  // Another raid's chain with a step inside this one: Gruul's Lair and Magtheridon's Lair feed Serpentshrine's.
  const feeds = sampleAttunements.flatMap((other) => {
    const step = other.steps.find((candidate) => candidate.location.startsWith(here))
    const target = sampleRaids.find((candidate) => candidate.id === other.raidId)
    return step && target && other.raidId !== raid.id ? [{ chain: other, target, step }] : []
  })

  return (
    <div className="journal-about" data-testid="raid-about">
      <ul className="journal-facts">
        <li>
          <b>Size</b>
          {raid.playerSize}
        </li>
        <li>
          <b>Bosses</b>
          {getBossesForRaid(raid.id).length}
        </li>
        <li>
          <b>Drops</b>
          {raidDropCount(raid)}
        </li>
        <li>
          <b>Zone</b>
          {raid.zone}
        </li>
        <li>
          <b>Resets</b>
          every {raid.resetDays} days
        </li>
      </ul>
      <p>{raid.description}</p>
      <p>
        <strong>Getting there:</strong> {raid.location}
      </p>
      <p>
        <strong>Can I get in?</strong> {raid.attunement}
      </p>
      {feeds.length > 0 && (
        <p>
          <strong>Part of an attunement:</strong>{' '}
          {feeds.map(({ chain: other, target, step }) => `${other.name} (${target.name}), step ${step.order}: ${step.title}`).join('; ')}.
        </p>
      )}

      {chain && (
        <section aria-labelledby="journal-chain" data-testid="attunement-chain">
          <h3 id="journal-chain">
            {chain.name} <small>{chain.steps.length} steps</small>
          </h3>
          {chain.needsVerification && (
            <p className="journal-verify">
              <strong>Not every point is confirmed for Anniversary realms.</strong> {chain.notes}
            </p>
          )}
          <p>{chain.summary}</p>
          <p>
            <strong>Before step 1:</strong>
          </p>
          <ul className="journal-before">
            {chain.prerequisites.map((prerequisite) => (
              <li key={prerequisite}>{prerequisite}</li>
            ))}
          </ul>
          <ol className="journal-steps">
            {chain.steps.map((step) => (
              <li key={step.order}>
                <span className="journal-step-number">{String(step.order).padStart(2, '0')}</span>
                <b>
                  {step.title}
                  {step.difficulty && <span className={`journal-difficulty journal-difficulty-${step.difficulty.toLowerCase()}`}>{step.difficulty}</span>}
                </b>
                <small>
                  {step.questName ? `Quest: ${step.questName} · ` : ''}
                  {step.location}
                </small>
                <p>{step.requirement}</p>
              </li>
            ))}
          </ol>
          <p>
            <strong>Reward:</strong> {chain.reward}
          </p>
        </section>
      )}

      {raid.needsVerification && raid.notes && <p className="journal-verify">{raid.notes}</p>}
    </div>
  )
}
