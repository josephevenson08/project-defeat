---
type: log
generated: true
tags: [brain/project]
---

# Decision Log

Architectural decisions worth not re-litigating. Add new entries below the manual marker; the generated section above only carries the ones baked into the code today.

## Local-first, no backend

Everything runs in the browser against typed data in the repo. This is what makes the project cheap to iterate on and what shapes Phase 6: the addon import parses a pasted blob client-side rather than uploading it anywhere.

## `domain/` never imports `features/`

Typed TBC knowledge lives in `domain/` and stays free of UI concerns; `features/` composes it into panels. See [[Architecture Map]] for the full layer breakdown.

## Approximated data is flagged, not hidden

[[Needs Verification]] is a first-class field on items, raid loot, abilities, and profession tiers, and the UI surfaces it. The alternative — quietly shipping guesses — makes the whole planner untrustworthy.

## Per-class BiS files rather than one big table

BiS data is split one file per class/spec/phase. It keeps diffs reviewable while 27 specs get filled in independently, at the cost of a barrel file that has to stay in sync.

## Signature ability, not a rotation engine

One researched ability per spec replaces the generic filler-cast placeholder. This is explicitly an intermediate step: it buys real per-spec cast times and coefficients now, without pretending to be a rotation model.

## Three ways to answer a systematic gap: derive, surface, or decline

Three whole-catalog gaps were closed in one pass, and each needed a different answer. That pattern is more reusable than the individual fixes.

**Derive it** — armor was recorded on 5 of ~143 armour pieces, so tank mitigation read far too low. TBC armor turns out to be deterministic given item level, armour class, slot and quality, so one formula fixed dozens of items at once. Deriving is legitimate when the underlying value genuinely is a function of things already known; it is invented precision when it is not, and the difference has to be established before building, not assumed.

**Surface it** — of sixteen Tier 5 set bonuses researched, not one is a flat stat addition. They attach to named abilities, to resource costs, or to the party. Recording them as stats would have invented value, so they are listed with their effects and marked as not scored. The honest fix for an invisible bias is to make it visible.

**Decline it** — the Feral cat rotation is a dynamic conditional priority system tracking energy, time to next energy tick, combo points and fight duration. This engine is closed-form and never advances a clock, so that cannot be approximated inside it. The blocker is architectural, and pretending otherwise would have produced a confidently wrong number.

## Effective Health, not a weighted survivability score

The tank metric was `avoidance*2 + armor*1.5 + stamina*0.1`, where all three weights were invented. It is now Effective Health — health divided by the fraction of a swing that lands — which has no free parameters and is what TBC tanks were actually compared on. Raw damage-taken-per-second was rejected for a structural reason as much as a theorycrafting one: `score` is consumed by the stat-weight engine and the upgrade finder, both of which assume higher is better, so a lower-is-better headline would have silently broken both for one role. See [[Tank Avoidance]].

## Item effects are averaged by uptime, or declined outright

Trinkets are not stat sticks — a flat-stats model priced that entire item class at nearly zero. Procs and on-use effects contribute at `duration / cooldown`, ingested from wowsims rather than authored. Where the value is not a stat bonus at all — a damage proc, a heal, a buff on the healing target rather than the wearer — the entry records why it is unmodelled instead of approximating it into a stat. Procs with no internal cooldown use a procs-per-minute rate, which is what recovered the ones that would otherwise have been dropped.

## Inferred data is uniformly plausible, which is why it has to be replaced rather than audited

The original catalogue was written by inferring what an item *should* look like for its role. Six sourcing batches audited 48 entries against real tooltips and **every single one was wrong** — stats invented, sockets fabricated in both directions, item level flat across a whole slot. When the whole catalogue was finally checked against an ingest, **87 of 98 overlapping entries disagreed** and all 119 verifiable conflicts resolved **curated 0, ingested 119**.

The lesson generalises past items: plausibility is not evidence, and a dataset produced by inference cannot be fixed by spot-checking it, because the errors are individually reasonable. It is now ingested from pinned sources, and the curated layer contributes **provenance only** — drop location, roles, crafting. Mechanical data is never authored by hand.

## Plumbing before data, because data wired to nothing is this project's signature failure

It has happened three times: 33 sourced raid buffs reaching no number because nothing rendered the panel that set them, two meta gems modelled purely as procs while `Gem` had no `effect` field, and researched per-spec ability prose that reached no surface. So when talents were extended to casters and healers, the argument was threaded through `calculateCasterDps` and `calculateHealing` **first**, and the ingest followed. Ingesting Mage effects with no caster talent argument to reach would have been the same failure a fourth time.

## Coverage is not completeness, and the refusal count goes next to it

Talents reach 27 of 27 specs *and* 43 talent groups are refused by name, each with a reason. Quoting only the first figure would be true and misleading. Every ingest in this repo reports what it skipped, and the surfaces that quote a coverage number quote the refusal beside it — computed from the data, because the version of this note that wrote the number down was stale within a day of the ingest changing.

## Verify before correcting, even when the data looks obviously wrong

Five BiS entries named items Phase 2 cannot reach, which reads like a bad ingest. Tracing them to source showed Band of Eternity requires Scale of the Sands — the Mount Hyjal faction, Phase 3 — and Hailstone Pendant drops from Ahune during the Midsummer event added in 2.4. The phase data was right; Wowhead was being forward-looking. Correcting the "obvious" way would have deleted legitimate rankings.

## Match on typed data, never on a display string

Buffs recorded who provides them as prose — "Warrior", "Feral Druid" — which is fine for printing and wrong for matching. The raid-composition planner compares a roster against it, and the failure mode of a near-miss is *silent*: the buff is never credited, coverage under-reports, and a raid leader recruits for a seat they already filled. The provider is now typed and the display string is derived from it, so the two cannot drift.

## Counts are computed, never written down

A hardcoded "214 needsVerification flags remain" survived six sourcing batches inside this generator, while the README promised the vault could not drift from the code. It could — the guarantee only ever covered what was actually derived. Coverage figures are now computed from the data, and prose should point at them rather than restate them.

## A caveat needs something that fails when it stops being true

Seven user-facing statements have been found **wrong** here, and every one of them was true when written. That is the whole mechanism: closing a gap never forces the sentence describing that gap to change, so the text rots silently — and on a surface whose case for existing is describing its own limits, a confident wrong caveat is worse than no caveat.

So a claim carrying a number gets an assertion rather than a promise. A stat flagged unmodelled must score exactly zero. "2 specs of 27" must match the ability data. The test pinning the caster path as talent-blind was written *to fail* on the day someone wired it, as the reminder to rewrite the flag — and when that day came, it did.

## A shared budget is spent greedily, so a second button moves damage rather than adding it

The rotation resolver does not divide a resource between abilities — it hands it out in priority order, first ability first, later ones dividing what is left. So adding a second ability that costs the *same* resource is not additive: it moves damage from one use to another, and only pays off if the new use returns more per point of resource than the old one.

This overturned a planned piece of work rather than being a note about one. Adding Mangle (Cat) alongside Shred was queued as straightforward data, and it is a **measured 4% loss**: Shred returns 11.8 damage per energy against 10.6 for Mangle, and the Mangle debuff multiplies periodic physical damage, of which the Feral model has none. The right question for any second button is therefore "is the swap a gain", not "is the ability sourced". See [[Feral Druid]].

## A buff that comes from a talent belongs to the spec, never to the class

Trueshot Aura is Marksmanship, Power Infusion is Discipline, Expose Weakness is Survival — attributing them to the class credited a roster with buffs nobody in it had specced. The same rule split **Improved Faerie Fire** out of Faerie Fire: the base spell is trainer-taught to every Druid and stays class-wide, while the Balance talent that improves it became its own entry.

The counterpart rule is what stopped that going too far. A walkthrough asked to restrict *base* Faerie Fire to Balance and Dreamstate Druids, which would encode a raid convention as a game rule — and it was inverted besides, since Dreamstate is a Restoration talent and Restoration is the one Druid tree with no Faerie Fire talent at all. `ExclusiveGroup.basis` exists to keep game rules and raid conventions apart, and the same distinction applies to provider attribution.

## Model what a seat competes in, not what one class happens to need

Seat assignments were a single `blessingId`, which was the shape of the first thing that needed one. A Paladin competes in **two** exclusive groups at once — a Blessing and an aura — so one answer per seat made two decisions fight over one field, and assigning the aura would have silently cleared the Blessing.

Assignments are now keyed by `ExclusiveGroup.id`. The tell that the original shape was wrong was visible long before it broke: the domain had been able to assign *any* exclusive buff since totems got a group, and a test was already assigning an air totem through a function called `assignBlessing`.

## Falsify an invariant before trusting it

A test that has never been seen to fail is a hypothesis. This repo has already shipped a green suite that asserted nothing: `expect(locator).toHaveCount(0)` is vacuously true wherever the panel is not rendered, which only became possible once the planner grew sub-tabs. Every invariant added since is checked by breaking the thing it guards and confirming the failure names the real defect.

## A constant nobody can explain is still a constant the reference uses

The hunter pet carries an ungated `DamageMultiplier *= 0.85` that wowsims applies with **no comment at all**, alongside a `MeleeSpeedMultiplier *= 1.3` commented only as "Cobra reflexes". Neither is a talent, a family gate or a conditional. Both were absent from this model, and dropping the unexplained one for lacking a justification would have overstated every pet by 18%.

So an unexplained constant is carried across as read, and the fact that it is unexplained is written down next to it. The alternative — modelling only the constants that come with a rationale — silently substitutes this project’s reasoning for the reference implementation’s behaviour, in whichever direction the missing rationale happens to point.

## A second actor gets its own fields, never the shared ones

A hunter pet inherits attack power, spell power, stamina and armour from its owner and **nothing else** — no crit, no hit, no haste. So the four Beast Mastery talents that scale it land on `petCritChance`, `petHitChance`, `petDamageMultiplier` and `petMeleeSpeedMultiplier` rather than on the melee fields they resemble.

Sharing a field would have handed the *hunter* crit they had not earned, and it would have raised the total — which reads as progress. The test that catches it asserts the owner’s Auto Shot is byte-identical across each pet talent, because a separation bug looks exactly like an improvement from the total alone.

## Split a damage source when its halves scale differently

The hunter pet reports as `Pet melee`, `Pet Bite` and `Pet Claw` rather than one `Pet` row. The auto attack grows with 22% of the owner’s ranged attack power; Bite and Claw are flat rolls with no attack power scaling at all, so they shrink as a share with every upgrade the hunter equips.

One row would have hidden a shrinking source behind a growing one, and the whole point of `damageSources` summing to `scoreExact` is that a change shows up **per source** rather than as a plausible total nobody can check. The test for the split asserts that 2,000 extra attack power moves the melee row and leaves the two abilities exactly where they were.

## Name the actor a gate points at, not just the gate

The hunter pet has three abilities and three gates that look alike and are not: Bite and Claw are limited by the **pet’s focus**, Kill Command by the **owner’s** crits, and Frenzy by the **pet’s** crits. Kill Command and Frenzy sit five lines apart in `sim/hunter/talents.go` and read different units.

That distinction decides the evaluation order rather than being a detail of it: Frenzy counts Kill Command’s crits, and Kill Command counts the owner’s Steady Shot, so the pet is priced after the rotation and after Kill Command. A field named for what it does (`petCritChance`) rather than who it belongs to would have made two of these interchangeable, and the resulting number would still have looked plausible.

## A cooldown is not a rate when something else gates the ability

Kill Command has a 5-second cooldown, and it fires about **7.7 times a minute** rather than 12. Upstream opens a 5-second window on any **owner crit** and casts inside it, so the spell goes off on the first crit *after* the cooldown comes up rather than the instant it does. The rate is `1 / (cooldown + 1/λ)`, where λ is the rate of the gating event.

The closed form is worth preferring over "on cooldown" because it degrades correctly at both ends: a character critting constantly approaches one per cooldown and never exceeds it, and one who never crits gets none at all, which is exactly the upstream gate. Where it is weak is named rather than left to be discovered — real crits are not Poisson, so the wait is less variable than this assumes and the model therefore understates.

## Apply a ceiling before it binds, not after

The pet ability rate is capped by focus, by each ability’s own cooldown, and by the pet’s 1.5s global cooldown. At every realistic focus income the GCD ceiling is nowhere near binding — the abilities come to roughly 0.16 uses a second where it would allow 0.67 — so a model that simply omitted it would agree with this one everywhere it is currently used.

It is applied anyway, and a test proves it by handing the model an absurd focus income. A ceiling left out because nothing reaches it is indistinguishable from one that was forgotten, and it stops being harmless the moment the inputs move.

## Measure against the reference’s own configuration, not a synthetic ideal

The calibration harness dressed each spec in its primary talent tree filled to 61 points. That is not a build any TBC raider plays, and it is not a ceiling either — a real 41/20 split can be worth more than 61 points down one tree. It hid a working feature completely and made a wrong number look plausible, both in the same hour.

It reads wowsims’ own raiding presets now, for the 17 of 20 DPS specs that have one. The three without keep the old rule rather than getting an invented build, and the calibration output **names which specs use which**, because a sourced spec and a synthetic one are not the same measurement and a single column would imply they were.

## When two sourced datasets disagree, say which is authoritative for what

wowsims writes `PiercingIce: 5` for a talent the ingested Wowhead tree caps at three ranks — an allocation the game would not accept. Neither source is simply wrong: wowsims is authoritative for coefficients and mechanics, and the Wowhead trees are the game’s own data on what a talent can *hold*.

So the rank is clamped to the tree and the clamp is **reported on every run**, rather than trusting the higher number or silently dropping the talent. Splitting authority by *which fact* rather than by *which source* is what makes that decidable instead of a coin toss.

## Owning a talent is not using it

A Demonology warlock spends 41 points in a tree that contains Demonic Sacrifice, so a build reader hands them the talent — and upstream gates its bonus on `DemonicSacrifice && SacrificeSummon`, the talent **and** the choice. Those points bought Summon Felguard, so the demon is kept and the bonus never applies. Without that distinction the warlock collected a pet and a sacrifice bonus at once, which upstream’s `else` makes impossible.

The tell was a number moving in the right direction for the wrong reason, and no assertion would have caught it: every individual value was correct and the error was one actor holding two mutually exclusive things. Measuring after every change is what found it.

## A feature can be correct and invisible, and the honest move is to say so

Spell school and Demonic Sacrifice landed together, both correct, and moved **no spec** in the calibration table — because the only spec whose build reaches the talent is the one spec that does not use it. The temptation is to reach for a number that makes the work look like it did something.

Instead the mechanism is asserted directly — a warlock handed the talent gains exactly 1.15x, one whose spells are all a different school gains nothing — and the limitation is written where the next reader will hit it. A feature nobody can see is still a feature; a feature described as having moved something it did not is a rotted claim on day one.

## Look in the right package before concluding a constant does not exist

The pet focus economy sat unmodelled for a pass because a search of `sim/core/energy.go` found the rogue and druid energy constants and no focus ones, and that absence was read as the numbers being unreadable. They are all in `sim/hunter/focus.go` — 25 focus every 5 seconds, a 100 cap — one package over.

A search of the wrong place returns the same empty result as a search for something that is not there. When the conclusion is going to be "this cannot be sourced", the search itself is the thing to check first.

## Related

- [[Architecture Map]]
- [[Roadmap Board]]
- [[Data Provenance]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
