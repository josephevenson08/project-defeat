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

## When you cannot use the expression, compute your own from the facts

The Professions tab needed farming routes, and two things stood in the way. `professionTypes.ts` records that wow-professions.com’s routes are **linked, never copied** — they are that site’s craft. And Blizzard’s zone art cannot be vendored, so there was no map to draw a line on.

Both were dodged by dropping a level. **Facts are not anyone’s expression**: Wowhead publishes the spawn coordinates of every gathering node as plain data, so a density grid and a nearest-neighbour circuit over those points is our own work. And coordinates are percentages of a zone’s own extent — which means the node cloud *is* the picture, and the farmable region draws its own shape with no map underneath.

The general form: when the thing you want is someone else’s to give, look for the primary data underneath it and build the expression yourself. It is usually more honest and often better, because the result is derived rather than transcribed and cannot go stale when they correct something.

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

## Two surfaces may answer the same question differently, if each says which question it asked

The upgrade finder scores its baseline with the gems actually socketed and its candidates with the best ones, because it asks "what should I chase from here?". The comparison panel gems **both** sides alike, because it asks "which of these two items is better" — giving one side real gemming and the other an ideal one would fold "you have not gemmed yet" into an answer about the items.

So the same pair of items can show different deltas in the two panels, which looks exactly like a bug. It is resolved by disclosure rather than by forcing agreement: each panel states the question it is answering, a test pins the divergence so it reads as a decision, and `pickBestGemPerColor` is shared so they cannot drift on what a socket is *worth* even while they disagree on what to gem. Reconciling them would make one of the two answers wrong.

## Round before differencing, so the arithmetic on screen adds up

The comparison panel shipped twice, in one session, showing three true numbers that did not add up: a stat table printing 56 and 66 beside a difference of +9.9, and a score row printing 35.0 → 42.0 beside +7.1. Both came from rounding each side independently and then displaying the *exact* delta.

The delta a reader sees is derived from the pair they see, at the cost of up to a tenth of a point. It also decides which rows exist: stat rows are filtered on the rounded values, so a pair differing by less than half a point does not occupy a row reading "8 8 +0" — a difference the table asserts and then cannot show. Anything checkable by eye has to survive being checked.

## A scoped selector raises the bar for every later rule, media queries included

`.app-shell:not(.app-shell-no-rail)` was written to stop the rail column being reinstated on the sections that have no rail. It fixed that — and silently killed the rule that collapses the same grid to one column below 900px, which was a bare `.app-shell`. **A media query contributes no specificity**, so the collapse matched, its query applied, and it lost the cascade at every width.

The cost was the whole phone layout: the rail held a fixed 288px on a 375px screen, the app was laid out in the 87px left over, the gear paperdoll computed to 1px wide, and the mobile rules written for panels *below* the shell had never run at all. The lesson is not "avoid `:not()`" — it is that raising a selector's specificity is a change to every other rule targeting that element, and the ones inside media queries are the easiest to forget because they read as though they win by context.

## A responsive test proves only the width and the surface it actually opened

A test named "the layout reflows to phone width without overflowing" passed throughout the period the planner was unusable on a phone. It sets a 375px viewport and asserts no horizontal scroll, which is the right property — but it opens Raid Composition, and that section carries `app-shell-no-rail`, the one shell variant the bug could not affect. The two sections with a rail were the broken ones and nothing ever looked at them.

Neither the viewport nor the assertion was wrong. The coverage was: one section stood in for an app whose layout differs by section. A test at a breakpoint should name which surfaces it swept, and a layout bug that only appears in one shell variant is exactly what a single-surface check cannot see.

## Two errors pointing opposite ways hide each other

TBC's ring enchants were filed `slot: 'Finger 1'` with no `allowedSlots`, so the second ring could never be enchanted — and they carried no profession restriction, so the first ring's four were offered to every character alive. The app understated an Enchanter by a ring and overstated everyone else by one.

Neither surfaced as an obviously wrong number, because a total that is too low for one player and too high for another looks merely unfamiliar rather than broken. The practical consequence is a rule about sequencing: **fixing the slot half alone would have made the profession half worse**, handing every non-Enchanter two free ring enchants instead of one. When a defect has two sides, check whether closing one widens the other before shipping either.

## A restriction that only filters the picker is not a restriction

Gating ring enchants behind Enchanting filtered what the gear popup offered — and nothing else. The equipped `enchantId` lives on the gear, so taking Enchanting, enchanting both rings and dropping the profession again left +8 to five stats applied to a character the app would no longer offer it to anywhere. A saved build was the same story: `enchantId` came back on a `typeof === "string"` check with no legality test at all.

`normalizeGearForCharacter` had solved exactly this problem for *items* since early on, and had never looked at enchants. The fix is `dropIllegalEnchants` beside it on the same choke point. The general form: when you add a rule about what a character may have, find every place the old answer is already stored, because the picker is only where it is chosen — not where it lives.

## A comment that explains away a disagreement with a source is the bug

`baseStats.ts` noticed that the pinned TBC simulator carried a race/class combination the app refused, and resolved it in prose: upstream models "Draenei Mage, added in Cataclysm", which is harmless because the app never offers it. The combination was a TBC launch one. The upstream was right, the comment was a remembered fact, and `racesByClass` had been built on the same memory — so a legal character could not be made, and the spell-hit racial never listed Mage because no Draenei Mage existed to exercise it.

Two things follow. **When the pinned source and the app disagree, the disagreement is a finding to check against a third source, not an anomaly to annotate.** The guard now throws in that direction too, so the next one gets looked at the day it appears. And **verifying one wrong row is a reason to verify the table**: the other nine were checked the same day and pinned in a test as verified rather than as believed.

## A source that parses badly is not a source

Verifying that matrix, the first pass read each class page's race table, whose expansion markers are icons. The extraction reported Human Hunters, Gnome and Orc Priests and Dwarf Warlocks as TBC — all Cataclysm. Applied as corrections, they would have introduced four bugs to fix one.

The race pages' patch-history prose and a TBC-specific guide agreed with each other and with the app on every row but one, and those are what the test cites. The rule: when an extraction contradicts well-established history, suspect the extraction first — and when two sources disagree, prefer the one that states the fact in words over the one that encodes it in an image.

## Measure the thing the sentence names

A phone test asserted "the panel you came for starts on the first screen" and measured where `<main>` began. `<main>` opens with both tab bars, 248px of them, so the assertion passed while the gear panel sat at y=937 on an 812px screen with nothing of it showing. The docs repeated the passing number, and the test then stayed green while a new block in the rail pushed the panel another 160px down.

Neither the assertion nor the number was careless in isolation — `<main>` is a reasonable proxy until something is inserted at its top. The rule is to measure the element the claim is about, and to give a layout assertion a floor with meaning (at least 120px of the panel visible) rather than a bare "less than the viewport", which a panel one pixel onto the screen satisfies.

## Changing a default changes every reader of the old one

The planner switched from opening with a full default gear set to opening empty, deliberately. The save format never heard about it. An empty slot serialises as a placeholder id the item catalogue does not hold, so every import reported it as a removed item — eighteen warnings for an untouched character — and the planner rebuilt imported gear on top of the *default* set, so each of those slots came back wearing an item nobody chose.

Nothing failed loudly, because each half was reasonable alone: the catalogue lookup was right to reject unknown ids, and the default baseline was right when the app opened on defaults. It surfaced only when share links made "export a half-geared build" the common case. When a default changes, the code that assumed the old one — baselines, fallbacks, "missing" checks — is where the new state goes wrong.

## Related

- [[Architecture Map]]
- [[Roadmap Board]]
- [[Data Provenance]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._

## Designing around a constraint is what makes lifting it cheap

Recorded 2026-09-04, when the repo owner decided to vendor Blizzard's zone art after two years of
this project treating it as off-limits.

For as long as the farming maps existed, the entry above described the workaround: no zone art could
be vendored, so the node cloud *was* the picture, drawn on a bare square in a coordinate space of
percentages of each zone's own extent. That was a real constraint honestly answered.

**When the constraint lifted, the workaround turned out to be the integration.** Wowhead's zone maps
cover exactly that percentage space, so the art dropped underneath with no transform, no calibration
and no per-zone fudge factor. The work was an ingest and a CSS layer. Had the original design
invented its own coordinate frame — pixels, or a normalised bounding box of the observed spawns — the
same change would have meant re-deriving every coordinate in the bundle.

The general form is worth keeping: **when you cannot have the thing, build in the units the thing
would have used.** A workaround that stays in the real coordinate system is a workaround you can
delete later; one that invents its own is a fork you have to maintain.

Two smaller things came with it, both instances of rules already in this log:

- **The art is not square** — 772x515 or 772x579, never 1:1 — and the frame takes its aspect from the
  image's own header. A square frame would crop or stretch, and cropping slides the art out from
  under coordinates that address the whole image. Every dot would have been subtly, invisibly wrong.
- **One zone has no art at the source**, and it is named in `zoneMaps.json` rather than counted, so
  the old bare-square rendering is a live fallback rather than dead code, and a second such zone is a
  visible change rather than a silently missing background.

## A display label is not a join key, and the test has to be about reachability

Recorded 2026-09-02, after the Professions rebuild found that **28 of 43 ingested gathering nodes had
never reached the screen**.

`ProfessionsPanel` matched a route to a farm row with `node.material === spot.material`. But
`spot.material` is written for a reader — "Liferoot / Fadeleaf / Goldthorn", "Thorium Ore (incl. Rich
Thorium Vein at 275+)" — and equals no node's name. Eight of Herbalism's nineteen rows and two of
Mining's eleven silently drew nothing, so the whole 1-300 herb progression was mapless on screen in
the same session that shipped 14,091 coordinates.

**Two rules come out of it, and the second is the load-bearing one.**

The first is the obvious one: when a field is read by a person *and* by code, those are two fields.
`materials` is now a listed array beside the label, populated explicitly rather than parsed — a split
on "/" works until a label contains one for another reason.

The second is about what the tests were doing. Every profession test passed throughout, because they
all asserted the **data**: 45 nodes, no crates, sampling preserves each zone's width. Not one
asserted that a node reaches a surface. That is this file's "plumbing before data" rule failing from the
other direction — the plumbing was built, the data was ingested, and the *join between them* was the
thing nobody tested. A dataset can be perfect, fully ingested, covered by assertions, and still render
nothing.

So a feature that ingests data now owes a test that the data comes out the far end, and the declared
gaps in it are **named rather than counted** — a count passes when one gap is swapped for another.

## The biggest gap and the next piece of work are different claims

Recorded 2026-09-02, after the repo owner's README edit of 2026-09-01 deprioritised the simulation
rule model and named **TBC content phase 2** as the target.

Every doc in this repo ranked its open items by *size of modelling gap* and then wrote the top of
that list down as the queue — `HANDOFF.md` said rotations were "the top of the queue", and
[[Roadmap Board]]'s generated "next honest step" said the same thing in different words. Nobody
decided that; it fell out of the ranking. The owner then decided otherwise, and two documents were
contradicting an owner decision the day after it was pushed.

**A gap ranking is not a plan.** Both are worth writing down, and they answer different questions:
how wrong is the model, versus what gets built next. Only the second is the owner's to set, and it
is the one this project's docs had been quietly answering on their own.

## An element is sized by the asset inside it, not the space around it

Recorded 2026-09-11, after the raid picker's cards had grown to **twice the width of two of the five
images behind them**.

The owner reported two separate complaints — the boss art looked pixelated, and the page lagged — and
they had one cause. A card filled the panel at 1353 CSS pixels, 2706 device pixels on a 2x display,
while the Serpentshrine and Tempest Keep panels only exist at 690px. Magnifying an image is the blur;
repainting five magnified images per scroll frame is the lag. Measured: **24 of 108 frames over 32ms
before, 0 after**.

**The layout was asking the artwork a question it could not answer.** Nothing in the CSS knew how big
the images were, so the cards were sized by the room available — which is the normal way to lay a
page out and the wrong way when the content is a fixed-resolution asset. The picker is now capped at
1180px, the width of the *narrowest* panel, with two cards to a row so each is served 1:1 on a 2x
screen. The constant is derived from the assets and the comment beside it says so, because the next
person to want bigger cards needs to know the price.

**The general rule: when a layout's job is to present a fixed-size asset, the asset sets the layout's
bounds.** Growing the container past the asset never adds information — it only invents pixels and
spends paint time doing it.

**And the corollary for the test suite.** The guard added here asserts the *outcome* — for every
card, the `cover` scale factor against its own `naturalWidth` stays at or below 1 — rather than the
constant that currently produces it. A test pinned to `1180px` would pass while someone reintroduced
the magnification by a different route; two of them were available here, the width cap and the
two-up grid, and only one of them is the number. This is the same lesson as
*[[Decision Log#A display label is not a join key, and the test has to be about reachability|the gathering-node join]]*, aimed at CSS:
assert the thing you actually care about, at the surface where it can go wrong.

## An audit that cannot say what it looked at cannot say it found nothing

Recorded 2026-09-12, after a clean sweep of every image in the app turned out to have measured
**zero** of the things it was written to check.

The raid-art fix above generalised into a standing test: for every painted image anywhere in the app,
the scale between the box and the file. Its first run reported "nothing magnified" across 345 paints
and three viewports. It had walked to the zone maps by clicking the first profession card — and the
first card is Alchemy, a crafting profession that draws no maps at all. Zero maps measured, zero
magnified, green.

The same pass then flagged four Karazhan item icons as failing to decode. The files were there; the
icons are `loading="lazy"` and were below the fold. So the audit was simultaneously **blind where it
claimed coverage and wrong where it claimed a defect** — the two failure modes of a sweep that
reports on absence.

**A test that asserts an absence owes a second assertion that it was looking.** Every screen in that
test now declares a floor for what it must have measured — five raid panels, thirty icons, three zone
maps — and the floor fails before the absence claim is allowed to pass. This is the same shape as
*[[Decision Log#A caveat needs something that fails when it stops being true|a caveat needs something
that fails]]* and *[[Decision Log#A display label is not a join key, and the test has to be about
reachability|the gathering-node join]]*: this repo keeps rediscovering that **nothing fails when
nothing is checked**, and the fix is always to make the checking itself checkable.

The corollary for lazy-loaded content: "not loaded yet" and "failed to load" are different states and
only one of them is a defect. Scroll the page first, then judge only what reports `complete`.

## Look for the data in the repo before going to source it

Recorded 2026-09-12, after "source and cost planning" — a roadmap item filed as unstarted — turned
out to be **a parse of data that had been sitting in the repo since the guides were first ingested**.

The roadmap said gear comparison, source/cost planning and a mobile layout were unstarted, and a
first measurement seemed to agree: 182 of 557 BiS-recommended items could say where they came from,
because only the hand-curated slice of the catalogue carried provenance. Joining the raid loot tables
lifted that to 42%. On those numbers the feature reads as a data-gathering job — an ingest against
Wowhead for 300-odd items, or a panel that says "unknown" more often than not.

Then `ingest-bis.mjs` turned out to capture a `source` column, and every one of the 1,430 ranked rows
carries it: `Drop: (Serpentshrine Cavern)`, `Profession: Tailoring - BoP only`, `Vendor: (41 Badges
of Justice)`. `bisLists` was folding it into the free-text `notes` field. **The panel's own
`sourceDetails` had been reading the structured `entry.source` and finding it empty since the day it
was written.** Parsing the column took 90.1% of items to a named source; no new data was fetched.

**The rule: before sourcing data, check what the ingest already captured and what the loaders throw
away.** Coverage measured on the *typed* surface says what the app can use, not what the repo holds —
those were 32.7% and 100% of the same fact. This is [[Decision Log#Plumbing before data, because data
wired to nothing is this project's signature failure|plumbing before data]] seen from the other end:
that entry is about building a surface for data that has not arrived, and this one is about data that
arrived and reached no surface. Both come from the join between the two going unexamined.

**And the corollary that cost the most to learn here.** The first parse also filled `boss` from
whatever text sat beside the instance in that column. That text is usually the tier token the item is
exchanged for, so the panel announced that Karazhan drops a boss called "Helm of the Fallen Hero".
The fix was not a better regex — the column does not contain an encounter at all. The boss comes from
the raid loot tables, and the resolver takes the place and the encounter **from the same dataset**,
because mixing the guide's instance with the catalogue's boss put Kael'thas Sunstrider in
Magtheridon's Lair across 52 rows. A join that draws each field from whichever source has one reads
as the richest answer and is the easiest way to state something no source ever claimed.

## Measure the pixel, not the stylesheet

Recorded 2026-09-12, after a boss name that computed as `rgb(255, 255, 255)` reached the screen as
`rgb(57, 57, 57)` and a contrast pass had already declared it fine.

`::after` is a child of its element in tree order, and it comes *after* the real children. A plate
with `position: relative` and no `z-index` therefore paints **underneath** the card's own scrim. Every
boss card and — as it turned out — every raid card in the picker had been drawing its title beneath a
black gradient at 0.93. The picker had shipped that way: name painted `rgb(126,126,126)` against a
declared white, drop count `rgb(56,59,61)` against a declared `rgb(135,142,147)`.

**The contrast check that should have caught it instead confirmed the bug.** It sampled the ground
behind each line and compared that to the colour the stylesheet *declared* — a ratio the page never
rendered. It reported 8.31:1 for text a reader could barely see. Worse, believing it sent the fix the
wrong way: the wash under the text got darker, which hid more of the artwork and changed nothing about
the cause.

**So a rendering check has to read the rendered thing.** The probe now takes two screenshots — one
normal, one with the glyphs hidden — and compares the painted ink to the declared colour *and* the
bare ground to the ink. Either half alone is a check that can pass while the screen is wrong.

This is the same shape as *[[Decision Log#An audit that cannot say what it looked at cannot say it
found nothing|the audit that measured zero maps]]*, one layer down: there the sweep never looked at
the thing it claimed to clear, and here it looked at the wrong thing and cleared it anyway. **A
measurement is only evidence about what it actually sampled.**

## A model can be more correct than the one the owner wants, and the owner still decides

Recorded 2026-09-12, after the raid-composition screen was rebuilt on Wowhead's counting model and
deliberately became **less accurate about the game**.

Coverage capped every exclusive group: one Paladin held one Greater Blessing and one aura, one Shaman
one totem per element, one Warrior one shout. Those caps are sourced from spell tooltips and raid
convention, they are right about TBC, and a previous session had called the uncapped version "the
single largest over-credit in this tool". The owner asked for Wowhead's model instead — verified
against the live page, where a lone Holy Paladin lights up all six Blessings at 1 each — and that is
what shipped.

**The fork was surfaced before it was crossed, not after.** Everything else in the rebuild — the
per-party buff rows, the count-led lists, dropping the per-seat pickers — was identical under either
model, so the only thing the question gated was how the numbers are computed. That is the shape of a
decision worth interrupting for: cheap to ask, and expensive to get wrong silently.

**Three things paid for the accuracy that was given up**, and they are the pattern to repeat when a
requested design is less truthful than the one it replaces:

1. **The screen says what the number means.** A line under the heading states that counts are "who
   could cast it, not what will be up", and a test asserts that line is present — so the app never
   claims coverage in its own voice that it cannot stand behind.
2. **The knowledge was kept, not deleted.** `buffExclusivity.ts` still holds the rule and is still
   tested, now against `applyExclusivity` directly rather than through coverage. The two tests that
   asserted the cap through `computeCoverage` were replaced rather than adjusted, because coverage
   had become the wrong place to ask the question.
3. **The reversal is written down where the next reader lands** — in the code, here, and in the
   handoff — because a later session reading only the old comments would "fix" this straight back.

The general rule: *[[Decision Log#The biggest gap and the next piece of work are different claims|a
gap ranking is not a plan]]*, and neither is a correctness ranking. What the app asserts is a
correctness question and stays non-negotiable; which model it presents is the owner's.

## Completing a dataset is how you find the assumption it was hiding

Recorded 2026-09-13, after Karazhan's loot tables went from 45 hand-curated rows to 147 sourced ones
and immediately broke a test that had been passing for months.

The test asserted that the item catalogue and the raid data **agree on which boss drops an item**. It
held because the hand-written tables listed each item once. The real tables do not: Earthsoul
Leggings drops from Moroes *and* the Opera Event, and Wowhead's own item page carries separate kill
counts for each. The assumption was never TBC's, it was an artifact of the curation, and no amount of
reading the old data would have revealed it — only completing it did.

**A curated subset can encode a rule the full set does not obey, and every check written against the
subset inherits it.** That is a different failure from stale data: the test was correct about what it
measured, and wrong about the world. The fix was to loosen it to "the catalogue's boss is *one of* the
encounters that drop it" and add a falsification naming the two-boss item, so the looser rule cannot
quietly become vacuous.

Two smaller things the same pass turned up, both worth the same shape of attention:

**Two encounters do not drop their own loot.** The Chess Event rewards a chest object rather than the
boss, and the Opera Event is three fights whose Wizard of Oz loot sits on The Crone rather than
Dorothee. Both return an empty table if you assume boss-drops-loot, and an empty table looks like a
boss with nothing worth having rather than like a bug. `ingest-raid-loot.mjs` records where each
encounter's loot actually lives for exactly that reason.

**The icon map is generated from what the data references**, so adding rows silently created two
iconless entries until `ingest-icons.mjs` was re-run. Any ingest that adds item ids has that
downstream step; the test that catches it is *[[Decision Log#A display label is not a join key, and
the test has to be about reachability|the reachability check]]* doing its job.

## A scrape that fails soft will eventually delete its own dataset

Recorded 2026-09-13, after an ingest wrote a file containing **zero** priced items over 109 good ones
and exited 0.

The cost ingest had already run successfully. Re-running it minutes later, Wowhead throttled the
burst: every page still returned **HTTP 200**, just without the JSON the listviews render from. Every
item parsed to "no cost found", the script collected an empty array, and `writeFileSync` did exactly
what it was told. No error, no non-zero exit, no sign anything was wrong except a dataset that had
quietly become nothing.

**Two defences, and the second is the one that generalises.**

The first is a better failure signal. The HTTP status was useless here — the tell was that the page
carried no `WH.Gatherer` block at all, which every real item page has. A scraper needs a positive
check that it got *the thing it came for*, not just bytes; absence of the payload is a failure even
when the transport says success.

The second is that **an ingest must refuse to shrink its own output.** Fewer rows than last time is
either throttling or an upstream shape change, and both want a person looking rather than a silent
overwrite. The guard is three lines and it is the difference between "re-run it" and "restore it from
git, if you noticed". Every generated dataset in this repo should have it.

This is *[[Decision Log#An audit that cannot say what it looked at cannot say it found nothing|the
audit that measured zero maps]]* again, and worth noticing that it is: that one reported a clean
sweep over an empty set, this one reported a successful write over an empty set. Both are the same
bug — **treating "I found nothing" as a result rather than as a question** — and both were invisible
until something downstream happened to need the data.

## A drag is a pointer feature, and a panel that only drags has no phone and no keyboard

Recorded 2026-09-20, when moving a player between raid groups stopped requiring a drag.

The raid chart had shipped with drag-and-drop as the only way to move a seat, and the open question
was recorded as "unverified on a real device — if drag fails on a phone, add a tap-to-move control".
That framing was too generous to it. HTML5 drag-and-drop is defined over mouse events; touch browsers
do not synthesise them, so `dragstart` cannot fire from a finger. It was not a thing that might fail
on a device, it was a thing that could not work on one — and the same fact made the panel unusable
from a keyboard, which is WCAG 2.1.1 rather than a nice-to-have.

**The replacement is a two-step pick up and place, not an emulated drag.** Press Move on a seat, then
press the seat you want them in. It costs one extra press on a desktop, where drag is still there, and
it is the only version that exists at all on a phone or from a keyboard. Emulating drag from touch
events was the alternative and it is strictly worse: it reimplements a gesture the platform does not
want to give you, and it still leaves the keyboard with nothing.

**Two details that are not obvious from the diff.** Every other seat becomes one button covering the
whole row rather than an overlay on top of the controls already there — the seat's name and remove
buttons sit 8px apart, and a target laid across that pair would silently take taps meant for either.
And the seat's contribution card had to be suppressed while a move is armed: it opens on
`:focus-within`, so pressing Move unfurled a list of eight totems directly over the seats being chosen
between. That rule has to sit *after* the reveal rule it fights, because the two tie on specificity —
written beside the other move styles it lost, and the card still opened.

## A controlled select must always have an option for its value

Recorded 2026-09-22, when the gear popup's list gained an explicit "— Empty —" option.

React does not render a `<select>` whose value matches no option as blank. It selects the **first
enabled option**, silently. The gear popup's list box had exactly that state on every empty slot: the
empty placeholder's id was never among the options, so the top item — the highest item level, the one
people reach for — sat highlighted while the slot said Empty. Clicking it changed nothing the browser
recognised, fired no `change`, and equipped nothing. Two of twelve participants in the usability study
hit it on their first click.

**The suite could not see it, and that is the more general lesson.** Every gear test drives the list
with `selectOption`, which sets the value directly and fires `change` regardless. Only a click on the
pre-selected option reproduces the bug, so the new test clicks, the way a person does. A test helper
that bypasses the input's real interaction model can hide a whole class of defect behind a green run.

The code already guarded the neighbouring case — the equipped item stays in the list while filtering,
"so the select never holds a value with no matching option" — but its comment said browsers render that
as blank, which is not what React does, and the empty slot was never covered. Keep the Empty option: it
is the fix, and it is also the only way to take an item off.
