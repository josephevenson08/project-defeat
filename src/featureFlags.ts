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
 * Hidden because the estimates are known to be badly low for melee and the gaps are structural, not
 * cosmetic: rage is not modelled at all, so a Fury Warrior's Heroic Strike contributes nothing;
 * healer HPS has no mana constraint; weapon and armour procs are unpopulated. A caveat under a
 * confident-looking number is not enough when the number is off by this much — people read the
 * number and skip the caveat.
 *
 * Everything behind it still builds, and every test of the underlying math still runs. Append
 * `?simulation=1` to the URL to bring the tab back, which is how the browser tests reach it.
 */
export function isSimulationEnabled(search: string = typeof window === 'undefined' ? '' : window.location.search) {
  return new URLSearchParams(search).has('simulation')
}
