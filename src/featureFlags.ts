/**
 * Surfaces that are built but deliberately not shown yet.
 *
 * A flag here is a statement that the feature works well enough to keep compiling and testing, but
 * not well enough to put in front of someone as if its output were trustworthy. Deleting the code
 * would lose the work; leaving it visible would present numbers the project knows to be wrong. This
 * is the third option.
 */

/**
 * The Simulation tab — the encounter settings, the DPS/HPS estimate, the stat weights derived from
 * re-running it, and the upgrade finder built on those.
 *
 * **All three reasons this file originally gave have since been fixed, and the flag has not been
 * revisited.** It used to say rage was not modelled at all, that healer HPS had no mana constraint,
 * and that weapon and armour procs were unpopulated. `domain/simulation/rageModel.ts`,
 * `domain/simulation/manaModel.ts` and `tools/ingest/ingest-item-effects.mjs` addressed those in
 * turn. Leaving the old text in place was worse than the flag itself: it described defects that no
 * longer exist, so anyone reading it would have re-fixed them.
 *
 * **Still hidden, and here is what is actually true now.**
 *
 * - **Melee DPS still reads low, but the diagnosis moved.** It is no longer rage. Rage is modelled,
 *   and measuring it showed the shortfall is upstream: auto attacks fund about 3.1 rage/sec while
 *   Bloodthirst and Whirlwind alone want 7.5. What is missing is talent scaling — Flurry, Endless
 *   Rage, Unbridled Wrath — which reaches the simulation nowhere at all. See TALENT-SCALING-SCOPE.md.
 * - **Rotations cover 2 specs of 27.** Every other spec is a single-ability approximation, which
 *   understates specs whose damage is spread across several buttons.
 * - **No multi-iteration variance and no result charting**, so a single point estimate is all there
 *   is to show.
 * - **Spell school is not modelled anywhere**, which is why Winter's Chill is `notModelled` and
 *   Curse of the Elements is approximate.
 *
 * Whether that is still disqualifying is a judgement, and it is deliberately not taken here. The
 * original argument stands on its own terms — a caveat under a confident-looking number is not
 * enough when the number is off by this much, because people read the number and skip the caveat.
 * The counter-argument is that the estimate is now honest about its own gaps on the tab itself.
 *
 * Everything behind it still builds, and every test of the underlying math still runs. Append
 * `?simulation=1` to the URL to bring the tab back, which is how the browser tests reach it.
 */
export function isSimulationEnabled(search: string = typeof window === 'undefined' ? '' : window.location.search) {
  return new URLSearchParams(search).has('simulation')
}
