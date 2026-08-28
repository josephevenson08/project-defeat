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
 * - **Rotations cover 5 specs of 27.** Warrior Arms and Fury press three buttons each; Affliction
 *   maintains four damage-over-time effects with a Shadow Bolt filler; Shadow keeps two DoTs up,
 *   presses Mind Blast on cooldown and channels Mind Flay in the gaps; Destruction maintains Immolate
 *   and fills with Incinerate. The other 22 are a single-ability approximation, which understates any
 *   spec whose damage is spread across several buttons. Still the largest remaining gap. See
 *   ROTATION-SCOPE.md.
 * - **The estimate is now measured rather than asserted to be roughly right.** `dpsReference.ts`
 *   holds observed averages for all 20 DPS specs from archon.gg, and a test compares every spec at
 *   best case against them. The model reads **1.05x to 2.3x low** — a range this file has now got
 *   wrong three times by not moving when the model improved, so the test brackets it on both sides
 *   and fails on an improvement, which is the only thing that has reliably forced this prose to keep
 *   up. The third time was Kill Command landing on 2026-08-27. No spec may read *above* its
 *   reference — a spec that does is double-counting something, which has been caught twice.
 *
 *   **Marksmanship is now within 5% of its reference, and that is worth reading carefully.** It is
 *   the spec with the least left to model — auto shot, Steady Shot and a pet, all three of which are
 *   in — so being close is plausible rather than suspicious. But it also means the next pet
 *   improvement may push it *above* 1341 and trip the one assertion here with real teeth. If that
 *   happens the answer is to find the double-count, not to loosen the bound: every previous time a
 *   spec crossed it, something was genuinely counted twice.
 * - **And "single-ability approximation" was itself too generous until 2026-08-23**, which is worth
 *   keeping here rather than quietly fixing: the three hunter specs had *no* ability modelled at all.
 *   `resolveRotation` filtered on the literal `'Melee Special'`, so Steady Shot — catalogued,
 *   sourced and correct — reached nothing, and a hunter's estimate was auto shots alone without
 *   naming the button they press all fight. Stage 1 of ROTATION-SCOPE closed it: the shot is bounded
 *   by the 1.5s hunter GCD (which ranged haste does not reduce) and by one shot per auto-shot cycle,
 *   both read off wowsims. It is worth **174 DPS to a Marksmanship hunter on the default set**, which
 *   is the size of the hole a filter literal was hiding.
 * - **A hunter's pet is a second attacker, and it presses three buttons.** Its auto attack is modelled
 *   — its own weapon, its own attack table, 22% of the owner's ranged attack power and no inherited
 *   crit — along with every Beast Mastery talent this model can express, a focus bar spent on Bite
 *   and Claw in priority order, and Kill Command. The pet is **16.5% of a best-case Beast Mastery
 *   hunter**, against an attributed share nearer a third.
 *
 *   **Whether a pet ability scales is what decides its worth, and the two kinds behave oppositely.**
 *   Bite and Claw are `BaseDamageConfigRoll` — flat, with **no attack power scaling at all** — so
 *   they add about 2.3% and gear cannot move them. Kill Command is a real weapon swing plus 127, so
 *   it follows the owner's attack power through the pet's 22% inheritance, and it is worth **3.6%**:
 *   more than Bite and Claw together despite landing only 7.7 times a minute.
 *
 *   **Kill Command's gate is the owner's crit rate, not its own cooldown.** Upstream opens a
 *   5-second window on any owner crit, so the rate is `1 / (5 + 1/crits per second)` — about half
 *   what the cooldown alone would allow. Its 75 mana joins the reported drain rather than capping it.
 *
 *   **What moves Bite and Claw is Bestial Discipline, not gear**, and getting that backwards is a
 *   mistake this repo made and a test caught. Gear alone takes them from 17.5% of the pet to 15.1%;
 *   Bestial Discipline takes them to 27.8% by doubling focus income.
 *
 *   Still missing: Frenzy, Bestial Wrath, and Focused Fire — which upstream gives Kill Command
 *   specifically, at 10% crit a rank. The estimate names the pet family it assumes, because the eight
 *   families span 0.91 to 1.1 on damage and this app has no picker for them.
 * - **Retribution's Holy damage is modelled, and it is faction-split.** Seal of Blood adds 35% of
 *   weapon damage to every landed white hit; Seal of Command adds 70% at 7 procs per minute; the
 *   judgement lands on the Judgement button's 10s cooldown. **Seal of Blood is Horde-only in Phase 2**
 *   — Judgement of Blood deals 295-325 where Judgement of Command deals 68-73 — so the model reads
 *   `character.faction`. Worth **112.5 DPS to a Horde Ret and 70.6 to an Alliance one**, which is more
 *   than half of what the spec does.
 * - **Holy damage is the one thing on the physical path that armor does not reduce**, and it is added
 *   after mitigation rather than inside it. Nothing else on that path is unmitigated today; anything
 *   added later that is not physical has to make the same distinction or it loses ~42% silently.
 * - **Windfury Weapon is modelled for Enhancement, and it is not an ability.** It is a proc against
 *   the main-hand swing rate — 20% per landed swing, capped by a 3s internal cooldown, two extra
 *   attacks at +475 attack power — folded into white damage rather than layered as a special. Worth
 *   **25.8 DPS on the default set**, against 36 for Stormstrike. The main hand is *assumed* to carry
 *   the imbue, since there is no weapon-imbue slot to read, and Elemental Weapons is not applied
 *   because it has no ingested talent effect.
 * - **No mana-costed ability is capped by mana, and the readout says so.** `StatBlock` has no mana
 *   field, so the estimate reports the mana per second the modelled rate spends rather than enforcing
 *   a pool it would have to invent. It reaches every mana-costed physical ability, not just the
 *   hunter shot that prompted it — an Enhancement shaman sees it for Stormstrike, which is the spec
 *   where TBC mana pressure actually bites. Aspect of the Viper, Judgement of Wisdom, Shamanistic
 *   Rage and potions are all unmodelled.
 * - **Talents reach all 27 specs.** All nine classes are ingested and every one of the four role paths
 *   takes them as of 2026-08-19. The effect count is deliberately not written here: this sentence
 *   said "49" while the file held 63, and then 68, which is this file's own recurring failure in
 *   miniature. `talentEffects.json` carries the figure and a test asserts it matches the list. Each reads only its own fields, which is asserted in
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
