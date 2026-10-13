import { PHASE_LABEL } from '../../domain/phase'

/**
 * "TBC Classic · Phase 2", in the top bar of every screen.
 *
 * It used to appear only under the wordmark in the Raids rail and on the front door, so a player who
 * arrived on any other tab had no way to tell which phase the numbers were for. The gaming-UI
 * research found printing the phase beside the numbers to be the strongest habit across the tools
 * closest to this one (`docs/research/gaming-ui`).
 */
export function PhaseChip() {
  return (
    <span className="phase-chip" data-testid="phase-chip">
      {PHASE_LABEL}
    </span>
  )
}
