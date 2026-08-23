import type { CharacterRole } from './domain/character/characterTypes'

/**
 * Surfaces that are built but deliberately not shown yet.
 *
 * A flag here is a statement that the feature works well enough to keep compiling and testing, but
 * not well enough to put in front of someone as if its output were trustworthy. Deleting the code
 * would lose the work; leaving it visible would present numbers the project knows to be wrong. This
 * is the third option.
 */

/**
 * The roles the Simulation tab is shown for.
 *
 * **The tab is a DPS surface, by the repo owner's call on 2026-08-21.** It answers "how much damage
 * does this build do", which is a question only a damage spec is asking. A Healer's estimate and a
 * Tank's Effective Health are both still computed and still tested — the math did not go anywhere —
 * but neither is put in front of someone as a headline number, because neither is what this project
 * is for.
 */
const SIMULATION_ROLES: ReadonlySet<CharacterRole> = new Set<CharacterRole>(['Physical DPS', 'Caster DPS'])

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
 * **Shown for DPS specs since 2026-08-21, hidden for Healer and Tank**, and here is what is
 * actually true about it now.
 *
 * - **Rotations cover 2 specs of 27.** Warrior Arms and Fury press three buttons each; the other 25
 *   are a single-ability approximation, which understates any spec whose damage is spread across
 *   several buttons. This is the largest remaining gap and the main reason the estimate reads as
 *   indicative. See ROTATION-SCOPE.md.
 * - **And "single-ability approximation" was itself too generous until 2026-08-23**, which is worth
 *   keeping here rather than quietly fixing: the three hunter specs had *no* ability modelled at all.
 *   `resolveRotation` filtered on the literal `'Melee Special'`, so Steady Shot — catalogued,
 *   sourced and correct — reached nothing, and a hunter's estimate was auto shots alone without
 *   naming the button they press all fight. Stage 1 of ROTATION-SCOPE closed it: the shot is bounded
 *   by the 1.5s hunter GCD (which ranged haste does not reduce) and by one shot per auto-shot cycle,
 *   both read off wowsims. It is worth **174 DPS to a Marksmanship hunter on the default set**, which
 *   is the size of the hole a filter literal was hiding.
 * - **A hunter's shot rate is not capped by mana, and the readout says so.** `StatBlock` has no mana
 *   field, so the estimate reports the mana per second the rate spends rather than enforcing a pool
 *   it would have to invent. Aspect of the Viper, Judgement of Wisdom and potions are all unmodelled.
 * - **Talents reach all 27 specs.** All nine classes are ingested — 49 effects — and every one of the
 *   four role paths takes them as of 2026-08-19. Each reads only its own fields, which is asserted in
 *   both directions: a Shaman's melee talent must move an Elemental score by exactly nothing, and a
 *   Warrior's Cruelty must not move Effective Health.
 * - **What that does *not* mean is that talents are fully modelled**, and the difference matters more
 *   than the coverage figure. Talent groups are still refused by name, each with a reason — but the
 *   **count is asserted from the data rather than written here**, because the figure that used to sit
 *   in this sentence went stale the moment the ingest changed, which is this file's own recurring
 *   failure. The **per-spell** ones — Ignite, Shadow Weaving, Ruin, every "Improved &lt;nuke&gt;" —
 *   need a spell school and a per-spell coefficient, and this simulator models one generic cast per
 *   spec and records no school at all.
 * - **The stat-pipeline group is no longer among them** (2026-08-20). Toughness, Vitality, Divine
 *   Strength, Sinister Calling, Arcane Mind and the Intellect- and Spirit-to-spell-power talents now
 *   reach `calculateStats`, so they move the stat rail, the gear rankings and the upgrade finder as
 *   well as the estimate. A talented tank no longer reads low for that reason. What is still refused
 *   for a stat reason is narrower: Health and Mana, which `StatBlock` has no field for.
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
 * **That judgement was taken on 2026-08-21 and it was taken per role, not globally.** The argument
 * against showing it — a caveat under a confident-looking number is not enough when the number is
 * off by this much, because people read the number and skip the caveat — is unchanged. What changed
 * is who sees it: a DPS spec is the audience the estimate was built for, and the tab discloses its
 * own gaps per spec. Healer and Tank stay hidden, so the two role paths whose output nobody is here
 * to read cannot be mistaken for a headline.
 *
 * `?simulation=1` still forces the tab on for any role. It is an escape hatch for development and
 * for the browser tests that exercise the healer and tank math, **not** a second product decision.
 */
export function isSimulationEnabled(
  role: CharacterRole,
  search: string = typeof window === 'undefined' ? '' : window.location.search,
) {
  return SIMULATION_ROLES.has(role) || new URLSearchParams(search).has('simulation')
}
