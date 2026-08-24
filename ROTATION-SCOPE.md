# Rotations — scope

**Written 2026-08-18 against `6269fcc`.** Nothing built yet. This exists because HANDOFF.md carried a
one-line hypothesis about what this work *is* — "wowsims has full ability implementations for all
nine classes at the pinned commit, so this may be an ingest rather than a research project — the same
insight that made talents cheap" — and that hypothesis is **wrong** in the way that matters most for
estimating it. Scoping it first is what the talent pass did, and the reason that document was worth
keeping is that its prediction turned out half wrong in writing rather than in code.

---

## The short version

**Rotations are not an ingest.** Talents were cheap because a talent is a *number*: `0.02 * rank`,
extractable by regex, and the value transfers to a closed-form model even though the mechanism does
not. A rotation has no number to extract. In wowsims it is an imperative state machine reading live
simulation state, and **the mechanism is the entire content** — there is nothing left once you take
it away.

So the honest choice is between two things, neither of which is an ingest:

- **A. Extend the closed-form model per spec.** Derive a sustained-rate expression for each spec's
  real rotation, the way `rageDumpUsesPerSecond` and `flurrySpeedMultiplier` were derived. Tractable
  for some specs, genuinely not for others.
- **B. Build an event-loop simulator.** A clock, resource regeneration, aura durations, a priority
  list per spec. This is what wowsims *is*. It replaces `calculateSimulation`'s whole approach rather
  than extending it.

**Recommendation: A, on a deliberately short list of specs, and not all 25.** The single-ability
approximation's error is *not uniform* — it is nearly exact for a Frost Mage and badly wrong for an
Affliction Warlock, and that spread is the thing worth acting on. Details under
[Prioritisation](#prioritisation-the-error-is-not-uniform).

**Do not start this by ingesting anything.** The one thing measured beyond doubt below is that there
is nothing there to ingest.

---

## What is actually true today

Measured against `6269fcc`, by loading the modules rather than grepping them.

**31 abilities across 27 specs.** Only two specs have more than one:

| Spec | Abilities |
|---|---|
| Warrior Arms | Mortal Strike, Whirlwind, Heroic Strike |
| Warrior Fury | Bloodthirst, Whirlwind, Heroic Strike |
| every other spec | exactly 1 |

**The role split, from `getRoleForSpec` — the same source `App.tsx:175` feeds the simulator:**

| Role | Specs | Rotation path |
|---|---|---|
| Physical DPS | 11 | `calculatePhysicalDps` → `resolveRotation` |
| Caster DPS | 9 | `calculateCasterDps` — no rotation concept |
| Healer | 5 | `calculateHealing` — no rotation concept |
| Tank | 2 | `calculateTankSurvivability` — no rotation concept |

Note this corrects a figure that was wrong in three places at once — HANDOFF.md, `featureFlags.ts`
and a test comment all said "7 caster and 2 healer specs", which is 9 against the real **16**. It is
now asserted in `tests/planner.spec.ts` rather than written down, for the reason that whole section
of the handoff exists.

**`resolveRotation` handles one effect type.** The filter is literal:

```ts
const abilities = getRotationAbilities(character.className, character.spec).filter(
  (ability) => ability.effectType === 'Melee Special',
)
```

Of the six `AbilityEffectType` values, **five reach no rotation resolution at all** — `Ranged
Special`, `Direct Damage`, `DoT`, `Direct Heal`, `HoT`. That is 18 of the 31 abilities.

**So the "2 of 27" figure understates the problem in one direction and overstates it in another.**
The 25 uncovered specs are not one gap, they are three:

- **9 melee specs** where the resolver works and only the *data* is thin — Feral, Retribution, three
  Rogue, Enhancement, plus the two Warriors already done and Protection. Adding an ability here is
  adding an entry to `sampleSignatureAbilities`.
- **3 Hunter specs** where the resolver excludes them *by effect type*. Steady Shot is already in the
  data, fully specified, and reaches nothing. The code says why, honestly: its "sustained rate depends
  on auto-shot weaving that isn't modelled."
- **14 caster, healer and tank specs** where there is no rotation concept in the code to extend.
  `calculateCasterDps` resolves one cast profile and repeats it.

---

## Why this is not an ingest

The talent pass worked because upstream had already reduced each talent to a constant. Rotations
have not been reduced to anything. Read at the pinned `3301fca5`:

**Rogue** (`sim/rogue/rotation.go`, 348 lines) is a seven-state plan machine:

```go
const (
	PlanNone = iota
	PlanOpener
	PlanExposeArmor
	PlanSliceASAP
	PlanFillBeforeEA
	PlanFillBeforeSND
	PlanMaximalSlice
)

func (rogue *Rogue) doPlanSliceASAP(sim *core.Simulation) {
	energy := rogue.CurrentEnergy()
	comboPoints := rogue.ComboPoints()
	sndTimeRemaining := rogue.SliceAndDiceAura.RemainingDuration(sim)

	if comboPoints > 0 {
		if energy >= SliceAndDiceEnergyCost || rogue.deathmantleActive() {
			if rogue.canPoolEnergy(sim, energy) && sndTimeRemaining > time.Second*2 {
				return
```

**Mage** (`sim/mage/rotations.go`, 190 lines) is the same shape for casters — and note it makes
decisions on how much fight is *left*:

```go
numStacks := mage.ArcaneBlastAura.GetStacks()
if numStacks > 0 && sim.GetRemainingDuration() > time.Second*5 {
	waitTime := mage.ArcaneBlastAura.RemainingDuration(sim) + time.Millisecond*100
	mage.Metrics.MarkOOM(&mage.Unit, waitTime)
```

**Warrior** carries per-millisecond tuning parameters as *user-facing rotation options* —
`slamLatency`, `slamGCDDelay`, `slamMSWWDelay`, `RampageCDThreshold`, `HsRageThreshold`. A rotation
upstream is not even a fixed thing; it is a configurable one.

Every one of these reads state this app does not have: current energy, combo points, aura remaining
duration, stack counts, time left in the fight, and whether a proc is live. **This simulator has no
timeline.** Grepping `src/features/simulator` and `src/domain/simulation` for any time-stepping
construct returns nothing, and three separate comments in the code state the closed-form constraint
outright.

TALENT-SCALING-SCOPE.md already wrote the correct version of this rule, one level shallower:

> **The values transfer; the mechanisms do not.**

For talents there was still a value underneath. **For rotations the mechanism is all there is.** That
is the whole finding, and it is why "wowsims implements it, so this is an ingest" does not carry over
from the talent pass — the surface similarity is real and the conclusion does not follow.

---

## Prioritisation: the error is not uniform

The reason not to do all 25 is that "single-ability approximation" describes situations that are
nothing like each other in how wrong they are.

**Provenance warning, because this repo has been bitten by exactly this.** The tiering below is
*unsourced judgement about TBC rotations*, not measured data and not read off wowsims. It is fit for
deciding what order to work in, and **unfit for writing into `src/domain`** — every spec listed here
needs its real rotation sourced before an ability is added, the same standard the buffs and debuffs
were held to after five of fourteen turned out wrong. Treat the tiers as a hypothesis to check, and
expect at least one of them to be wrong: the talent scope doc's central prediction was.

**Near-exact already — leave alone:**

- **Mage Frost, Mage Fire, Warlock Demonology/Destruction, Shaman Elemental, Druid Balance.** These
  specs really do cast one filler nuke most of the time in Phase 2. Frostbolt spam *is* the Frost
  Mage rotation. Modelling a second button buys close to nothing, and the estimate is not misleading.

**Badly wrong — the real targets:**

- **Warlock Affliction.** Modelled as one DoT (Unstable Affliction). The actual rotation maintains
  three to four DoTs concurrently plus a filler. A single-DoT model may understate by a wide margin,
  and it is the clearest case where the number is not merely imprecise but structurally wrong.
- **Priest Shadow.** Mind Flay alone, with Shadow Word: Pain and Vampiric Touch uncounted.
- **Rogue, all three.** Builder/finisher is *the* rogue mechanic and none of it is present. The code
  already warns that a naive second energy ability would double-count the budget — Shred at 60 plus
  Mangle at 45 claims 20 energy/sec against the 10 that exists.
- **Druid Feral.** Same energy problem, and the existing comment says the guard "does not make the
  answer right". **Checked 2026-08-23 and the tier is wrong in an instructive way:** the single-Shred
  model is already the best answer *available*, because the second button costs the same energy and
  returns less of it. Feral is badly wrong because it is missing **bleeds**, not because it is missing
  buttons — see the stage 2 rewrite.
- **Hunter, all three.** Blocked by the effect-type filter rather than by data.

**Structurally different, decide separately:**

- **The 5 healers.** A healer "rotation" is a triage decision, not a priority list. HPS at flat-out
  cast rate is arguably already the right shape, and the existing mana-deficit reporting is the
  honest framing. Adding a second heal spell does not obviously improve anything.
- **The 2 tanks.** Scored by survivability, where the rotation barely enters.

---

## The falsification test, stated before building

The talent pass's most useful habit. State what would prove the work *failed*, in advance:

> **Adding a second ability to a spec must change that spec's DPS by more than the shared-budget
> accounting removes from the first ability — and the total must not exceed the GCD, energy or rage
> budget the spec actually has.**

The failure mode this catches is specific and has already happened once in this repo: a second energy
ability that claims a budget already fully spent, producing a DPS gain that is pure double-count. The
existing `computeUsageRate` comment describes exactly that trap.

A second, sharper one for the Affliction case:

> **A multi-DoT model must reproduce the single-DoT number when the extra DoTs are removed** — the
> same invariant as "an empty talent tree reproduces today's numbers exactly", which is what made the
> talent work safe to land.

---

## Recommendation

~~**Stage 1 — Hunter, and nothing else.**~~ **Done 2026-08-23**, and the estimate of the work was
right: `resolveRotation` now takes a `RangedShotContext`, picks `Ranged Special` when it has one, and
rolls it on the ranged table — no dodge, parry, block or glance, which reusing the melee special table
would have charged it for.

**The sustained rate came out as two ceilings rather than one derivation**, both read off wowsims at
the pinned commit rather than judged:

- **The hunter GCD is locked at 1.5s and ranged haste does not reduce it** — upstream says so
  explicitly with `IgnoreHaste: true`. The cast time *is* divided by ranged swing speed, so it drops
  below the GCD with any haste at all and stops being the constraint. This was the surprise: the
  obvious model, "cast time bounds the rate", is wrong in the direction that would have overstated.
- **One shot per auto-shot cycle.** Casting *delays* the next auto rather than clipping it, priced
  upstream as `max(0, (gcdAt + castTime) - shootAt)`, and its rotation avoids paying that. So a second
  shot inside one cycle buys its damage by pushing a white shot back — the 1:1 weave hunters gear for.

**Mana is deliberately not a third ceiling.** `StatBlock` has no mana field, so a cap would have meant
inventing the income as well as the pool. The rate's mana drain is reported in the breakdown instead,
which keeps the assumption visible rather than silent.

**Measured: Steady Shot is worth 174.4 DPS to a Marksmanship hunter on the default set** — 102.8 to
277.2 — at one shot per 3.0s and 36.7 mana/sec. The size of that number is the point: a filter
literal was hiding most of the spec's damage, and `featureFlags.ts` was calling it a "single-ability
approximation" when the count was zero.

Also learned, and it generalises to stage 2: **Ranged Weapon Specialization reaches Steady Shot.**
Upstream applies it as a blanket `RangedDamageDealtMultiplier` with no proc mask, where the talent's
own wording ("ranged weapon") could be read either way. The repo's `rangedDamageMultiplier` field
documented itself as white-only and was wrong about its own scope.

~~**Stage 2 — the melee data thinning.** Feral, Retribution, Enhancement, and Protection get their
second and third buttons. The resolver already handles the budgets; this is `sampleSignatureAbilities`
entries plus per-ability sourcing.~~

**Re-scoped 2026-08-23, and none of the four specs survived contact.** This section predicted "at
least one of them is wrong" — it was all of them, and for four different reasons. The stage as
written does not exist; what replaces it is below.

**"The resolver already handles the budgets" was the load-bearing error.** It does not share a budget
between abilities, it hands it out **greedily in priority order**: the first ability takes what its
own rate allows and later ones divide what is left. So a second ability costing the *same* resource
does not add damage, it **moves damage from one use to another** — and only pays off if the second
use is worth more per point of resource than the first. That reframes the whole stage from "add
entries" to "prove the swap is a gain", and it applies to stage 4 too.

- **Protection is out of scope and this doc predates the decision.** The owner ruled on 2026-08-21
  that this project is for DPS; Protection is a Tank spec and the Simulation tab is hidden for it.
  Listed here in 2026-08-18. Nothing to do.

- **Feral: adding Mangle (Cat) alone makes the estimate *worse*, and that is measured.** Energy is the
  binding budget, and Shred returns **11.8 damage per energy against 10.6 for Mangle**. Maintaining
  Mangle on its 12s debuff costs 3.75 of the 10 energy/sec and loses about **4%** of the total.

  The reason it does not pay itself back is a data error this repo was carrying: Shred's own notes
  said Mangle applies a "+30% Shred/bleed debuff". **In TBC it is bleeds only.** Upstream implements
  the aura as `PeriodicPhysicalDamageTakenMultiplier *= 1.3` for 12s, and Shred is direct damage. The
  "Shred and Ravage" wording belongs to a later expansion. With no bleed modelled for this spec, the
  debuff multiplies nothing at all.

  So **Rake is the prerequisite, not the sibling**. Once a bleed exists, Mangle and Rake become worth
  adding together and neither is worth adding alone. A test pins the per-energy comparison so this is
  not rediscovered by someone adding Mangle helpfully.

- ~~**Retribution needs a type change**, not an entry.~~ **Done 2026-08-23, and it needed neither.**
  The predicted blocker was that Judgement is "neither a clean `Melee Special` nor a clean
  `Direct Damage`" — true, and it turned out not to matter, because the answer was not to widen
  `AbilityEffectType` at all. Ret's Holy damage lives in `domain/simulation/paladinSeals.ts`, the same
  shape `weaponImbues.ts` uses, and `resolveRotation` was not touched.

  **The bigger finding is that the judgement was never the main event.** The seal is: Seal of Blood
  adds 35% of weapon damage to **every** landed white hit, and Seal of Command 70% at 7 PPM. Together
  with the judgement that is **112.5 DPS to a Horde Ret and 70.6 to an Alliance one** — more than half
  of what the spec does, and the reason its own notes calling Ret "the spec where the special-attack
  share of damage is smallest" was true and misleading. The missing share was not special-attack
  damage.

  **It is faction-split and the gap is enormous.** Seal of Blood is a Blood Elf spell, Horde-only in
  Phase 2 before 2.4 gave Alliance the identical Seal of the Martyr. Judgement of Blood deals 295-325;
  Judgement of Command deals 68-73. Modelling one seal for both factions would have been wrong by
  about a factor of four on that component, so the model reads `character.faction`.

  **Holy damage is not reduced by armor**, which is the first unmitigated damage on the physical path.
  `calculatePhysicalDps` now adds it after mitigation rather than inside it; folding it into `rawDps`
  like every other source would have quietly shaved ~42% off it against this app's own target. A test
  moves the target's armor with debuffs and asserts the physical rows move while the Holy rows do not.

  Two claims in the repo's own notes were wrong and are corrected: the judgement **does** trigger the
  GCD, and Judgement of Command is not implemented by upstream at all, so its numbers come from the
  Seal of Command tooltip with no second source and no spell-power coefficient applied.

- ~~**Enhancement's gap is not a button at all.**~~ **Done 2026-08-23.** Its notes said the spec is
  dominated by **Windfury Weapon procs on white swings**, and the model counted none of them. A
  weapon imbue is not a rotational ability and has no place in `SignatureAbility`, so it lives in
  `domain/simulation/weaponImbues.ts` and is folded into white damage rather than layered as a
  special.

  **Two ceilings again, the same shape as the hunter weave:** 20% per *landed* main-hand swing, and a
  **3-second internal cooldown**. Neither is on the tooltip — both are read from
  `sim/shaman/weapon_imbues.go` at the pinned commit. The cooldown is not binding at Phase 2 speeds
  (a 2.7s main hand procs about once per 19 seconds against a ceiling of one per 3), but modelling it
  as a bare percentage would silently overstate any future fast-weapon or high-haste build, so it is
  in and tested directly.

  The closed form holds because **the extra attacks cannot re-proc it** — upstream gives them
  `ProcMaskEmpty`, so the rate stays linear in the swing rate with no cascade to simulate. Each proc
  is two extra main-hand attacks at **+475 attack power**, rolled through the same white table.

  **Worth 25.8 DPS on the default set**, taking Enhancement from 149.9 to 175.7 — more than two
  thirds of what Stormstrike contributes, from a source that had no representation at all.

  Two things are stated rather than modelled: the main hand is *assumed* to carry Windfury, since
  this app has no weapon-imbue slot to read, and **Elemental Weapons is not applied** — it multiplies
  Windfury damage by 13.33% per point upstream, but it has no ingested talent effect in this repo, so
  applying it would be inventing a number.

**What stage 2 actually is, restated:** one mechanism (weapon-proc damage, for Enhancement), one
type change (hybrid Holy-off-melee-crit, for Retribution), and one item that is really stage 3
(bleeds, for Feral). None of it is "sampleSignatureAbilities entries plus sourcing".

**Both landed 2026-08-23**, and neither was what this section predicted: Enhancement needed a
proc model rather than buttons, and Retribution needed a damage *school* rather than a type change.
**Stage 2 is closed.** What was filed under it for Feral is really stage 3, since bleeds are the
prerequisite for its second button being worth anything.

**The one prediction that held is the warning at the top of this file** — that the tiering was
unsourced judgement and at least one entry would be wrong. Every entry was.

**Stage 3 — DoT uptime for casters.** Affliction and Shadow, which are where the caster estimate is
worst. This needs a genuinely new piece: a concurrent-DoT uptime model, plus a filler that fits in
the gaps. It is the first stage that adds a mechanism rather than data.

**Stage 4 — only if wanted: combo points.** Rogue and Feral properly. This is the one that most
resembles building an event loop, because energy pooling and finisher timing are a scheduling problem
rather than a rate problem. Scope it separately; do not let it ride along with stage 2.

**Do not do: a general rotation engine for all 27 specs.** That is option B, it is a rewrite of
`calculateSimulation` rather than an extension, and the reason to say so now is that stages 1-3
deliver most of the accuracy without it.

---

## The measured gap, 2026-08-23 — where the missing DPS actually is

The doc above reasons about rotations. This section is a **measurement**, prompted by the repo owner
observing that a Phase 2 BiS Enhancement shaman should read far higher than the app says.

Reproduce it by equipping the rank-1 entry of `requireBisList('Shaman', 'Enhancement')` into every
slot it names, then running `calculateStats` / `calculateSimulation` with progressively more input:

| Setup | DPS | Attack power | Crit | Miss |
| --- | --- | --- | --- | --- |
| BiS gear only | 245 | 1,214 | 17.4% | 19% |
| + all 33 raid buffs and all 31 consumables | 437 | 2,543 | 33.8% | 17.8% |
| + every Enhancement talent at max rank | **522** | 2,543 | 38.8% | 11.8% |

**The inputs are not the problem, and that is the finding.** 2,543 attack power and 38.8% crit fully
buffed are realistic Phase 2 figures. The gap is in the damage model, and it is roughly the 4x this
project already advertises — so the honest reading is that `featureFlags.ts` is right and the causes
below are what "4x" is made of.

**What a Phase 2 Enhancement shaman should actually read is itself worth sourcing before it is used
as a target.** Community parses for T5-era Enhancement are commonly quoted around 1,100-1,400, with
2,000+ belonging to the Sunwell era — but that is recollection, not a source, and this repo has a
decision note about exactly that kind of number. Whatever the target, 522 is well under it.

### Talents reach three fields out of twenty-one

With every Enhancement talent maxed, `deriveTalentModifiers` moves exactly three values:
`meleeCritChance 0.05` (Thundering Strikes), `meleeHitChance 0.06` (Dual Wield Specialization) and
`physicalDamageMultiplier 1.1` (Weapon Mastery). Everything else in the tree reaches nothing.

- **Flurry is refused by name**, and the recorded reason is specific: *"Shaman has its own Flurry at a
  different rank scale; the analytic derivation is Warrior-shaped."* Warrior's Flurry is modelled and
  the melee path already calls `flurrySpeedMultiplier`, so this is a **rank-scale problem rather than
  a mechanism problem** — the single biggest item on this list, at +30% melee attack speed for 5/5.
- **Elemental Weapons reaches nothing**, which is already recorded against the Windfury work: it
  multiplies Windfury damage by 13.33% per point, so 5/5 would take that 86.9 DPS to roughly 144.
- **Unleashed Rage reaches nothing.** Attack power is identical with and without talents, which is the
  tell — a +10% attack power talent that moves attack power by zero.

### Mechanics that are not modelled at all

- **Flametongue Weapon.** Enhancement runs Windfury main-hand and Flametongue off-hand; only the
  first exists. `weaponImbues.ts` is the right home and the shape is already there.
- **Windfury is main-hand only.** Upstream uses a **36%** proc chance when both hands are imbued
  against the 20% modelled here, so a two-imbue build is understated twice over.
- **Earth Shock and Lightning Shield.** Real Enhancement presses both; the single-ability
  approximation covers neither.

### A stale refusal reason, which is a bug rather than a gap

Two Shaman refusals read *"Spell-side talents, and `calculateCasterDps` takes no talents yet."* That
stopped being true on **2026-08-19**, when all four role paths were given `TalentModifiers`. There is
a test named *"no talent is refused for a reason the code no longer has"* and it does not catch this
one, which makes the test the more interesting half of the finding.

---

## Consequences worth deciding before, not during

- **The `featureFlags.ts` claim moves the moment stage 1 lands.** It currently says "Rotations cover 2
  specs of 27", pinned by an assertion at `tests/planner.spec.ts`. That assertion is *supposed* to
  fail when this work happens — it is doing its job, not blocking. Update the text with the code, in
  the same commit.
- **Every spec touched changes its stat weights and its upgrade rankings**, because both re-run
  `calculateSimulation`. This is wider blast radius than the talent work chose to take: talents were
  deliberately confined to the hidden simulator. Rotations cannot be, because the weights are derived
  from the same call.
- **`SignatureAbility` is already rich enough** for stages 1 and 2 — it carries cooldowns, resource
  costs, off-GCD, swing replacement and both-weapon strikes. Stage 3 needs nothing new either; the
  `periodic` field already models DoTs. **Stage 4 is the one that needs a type change**, for combo
  points.
- **Spell school still is not modelled**, and stage 3 runs into it: Shadow's DoTs interact with
  Shadow Weaving and Winter's Chill is already `notModelled` for exactly this reason. Adding schools
  is a prerequisite worth pricing into stage 3 rather than discovering inside it.
