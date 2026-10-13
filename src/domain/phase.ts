/**
 * The game and phase every number in the app is for.
 *
 * **Phase 2 on purpose.** Phase 3 is live on the Anniversary realms, and the app still targets
 * Phase 2 (Serpentshrine Cavern and Tempest Keep) by the owner's choice: its rankings, loot and tier
 * lists are all Phase 2 data. Saying so on every screen is what stops a Phase 3 player reading them
 * as current. If more phases arrive, this is what a phase switcher would set.
 */
export const GAME_NAME = 'TBC Classic'
export const CURRENT_PHASE = 2

export const PHASE_LABEL = `${GAME_NAME} · Phase ${CURRENT_PHASE}`
