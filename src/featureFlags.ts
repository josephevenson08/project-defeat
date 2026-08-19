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
 * **This text has now been wrong twice, in the same way both times, and that is the thing to know
 * before editing it.** It first said rage was unmodelled, healer HPS had no mana constraint and
 * procs were unpopulated; all three were fixed and the text was not. It was then rewritten to say
 * talent scaling reached the simulation nowhere — true on 2026-08-16, false on 2026-08-17 when
 * `37e2cf2` wired it in, and still sitting there after `fba60c8` took it to all 11 Physical DPS
 * specs. Closing a gap never forces the sentence describing that gap to change, so **the three
 * claims below that carry a number are each pinned by an assertion in `tests/planner.spec.ts` that
 * fails when they stop being true** — the rotation count, the talent split, and the rage figures.
 * Do not add a numeric bullet here without one.
 *
 * The last two bullets are absence claims — "no variance", "no spell school" — which nothing can
 * usefully assert, because the assertion would have to name the thing that does not exist. They are
 * instead written so that *adding* the feature makes the sentence obviously false to whoever adds
 * it. That is weaker, and it is called out rather than papered over: this file has twice claimed
 * more rigour than it had.
 *
 * **Still hidden, and here is what is actually true now.**
 *
 * - **Rotations cover 2 specs of 27.** Warrior Arms and Fury press three buttons each; the other 25
 *   are a single-ability approximation, which understates any spec whose damage is spread across
 *   several buttons. This is the largest remaining gap and the main reason the estimate reads as
 *   indicative. See ROTATION-SCOPE.md.
 * - **Talents reach all 27 specs.** All nine classes are ingested — 49 effects — and every one of the
 *   four role paths takes them as of 2026-08-19. Each reads only its own fields, which is asserted in
 *   both directions: a Shaman's melee talent must move an Elemental score by exactly nothing, and a
 *   Warrior's Cruelty must not move Effective Health.
 * - **What that does *not* mean is that talents are fully modelled**, and the difference matters more
 *   than the coverage figure. **49 talent groups are refused by name**, each with a reason. Two kinds
 *   dominate. The **per-spell** ones — Ignite, Shadow Weaving, Ruin, every "Improved &lt;nuke&gt;" — need
 *   a spell school and a per-spell coefficient, and this simulator models one generic cast per spec
 *   and records no school at all. The **stat-pipeline** ones — Toughness, Vitality, Divine Strength —
 *   multiply armour, stamina and strength, which `calculateStats` owns; routing talents there would
 *   move the always-visible stat rail, the gear rankings and the upgrade finder, and that is a
 *   product decision deliberately left to the repo owner. Expect a talented estimate to read low.
 * - **Melee DPS still reads low, and the remaining cause is rage income, not talents.** A talented
 *   Fury warrior's income is asserted to sit **above the 3.4/sec an untalented one makes and below
 *   the 7.5 Bloodthirst and Whirlwind want** — a band rather than a point, so verification work does
 *   not break it — and the estimate is required to still say the dump is unfunded. Every expressible
 *   source is modelled; what is left is rage from damage taken, an encounter input pinned at 0 since
 *   the encounter was fixed. (It reads about 5.4 today, which is *not* pinned: only the band is.)
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
