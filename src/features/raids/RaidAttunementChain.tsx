import type { AttunementChain } from '../../domain/raids'

type RaidAttunementChainProps = {
  chain: AttunementChain
}

export function RaidAttunementChain({ chain }: RaidAttunementChainProps) {
  return (
    <div className="raid-attunement" data-testid="raid-attunement">
      <div className="raid-detail-header">
        <h3>{chain.name}</h3>
        <span>{chain.steps.length} steps</span>
      </div>
      <p className="panel-copy">{chain.summary}</p>

      <h4 className="raid-section-heading">Before you start</h4>
      <ul className="raid-attunement-prereqs">
        {chain.prerequisites.map((prerequisite) => (
          <li key={prerequisite}>{prerequisite}</li>
        ))}
      </ul>

      <h4 className="raid-section-heading">Steps</h4>
      <ol className="raid-attunement-steps">
        {chain.steps.map((step) => (
          <li className="raid-attunement-step" key={step.order}>
            <div>
              <strong>{step.title}</strong>
              <span>
                {[step.location, step.difficulty].filter(Boolean).join(' · ')}
              </span>
            </div>
            {step.questName && <p className="raid-attunement-quest">Quest: {step.questName}</p>}
            <p>{step.requirement}</p>
            {step.needsVerification ? (
              <small className="needs-verification">{step.notes ?? 'Needs source verification.'}</small>
            ) : (
              step.notes && <p className="raid-attunement-step-note">{step.notes}</p>
            )}
          </li>
        ))}
      </ol>

      <h4 className="raid-section-heading">Reward</h4>
      <p className="panel-copy">{chain.reward}</p>

      {chain.needsVerification && <small className="needs-verification">{chain.notes ?? 'Needs source verification.'}</small>}
    </div>
  )
}
