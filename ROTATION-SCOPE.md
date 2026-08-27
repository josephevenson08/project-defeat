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

## The pet presses its buttons, and they are worth less than anyone expected, 2026-08-27

    Hunter Marksmanship   1225 -> 1239   (1.1x)
    Hunter Beast Mastery  1405 -> 1440   (1.5x -> 1.4x)
    Hunter Survival       1150 -> 1164   (1.5x)

Bite and Claw are modelled, along with Bestial Discipline. **The headline is the size**: they add
about **2.4%** to a Beast Mastery hunter and about **1.1%** to the other two, which is far less than
the section below implied when it said "the abilities really are most of the remaining gap".

### Why they are small, and it is one fact

`BaseDamageConfigRoll(108, 132)`. **The pet's abilities are flat rolls with no attack power scaling
at all** — unlike Kill Command, which uses `BaseDamageConfigMeleeWeapon`. So gear moves one half of
the pet and leaves the other exactly where it was.

**What moves them is Bestial Discipline, and getting that backwards is a mistake a test caught.** The
first version of the share assertion compared a naked untalented hunter against a best-case one and
expected the ability share of the pet to fall; it rose, 17.45% to 18.14%, because the comparison
conflated two effects pulling opposite ways. Held apart: gear alone takes the share **17.5% to
15.1%**, which is the flat-roll mechanism, and Bestial Discipline alone takes it **17.5% to 27.8%**
by doubling focus income. The talent is much the larger of the two.

That is worth stating plainly because it reverses the previous section's conclusion. The pet is
**13.3%** of a best-case Beast Mastery hunter now, up from 11.2%, against the ~28% the architecture
report attributed to it. The abilities were never going to close that. What is left is Frenzy, Kill
Command and Bestial Wrath — or the attribution itself is high, which is a possibility the report
already flagged about its own number.

### Three ceilings, and focus binds by a wide margin

An ability is limited by its own cooldown, by the pet's **1.5s global cooldown** (every ability sets
`IgnoreHaste: true` on a `GCDDefault` cast — the same finding Steady Shot turned on, one actor over),
and by focus. At the base 5 focus a second against costs of 35 and 25, the two together come to about
**0.16 uses a second where the GCD would allow 0.67**.

The budget is spent **greedily in `PetConfigs` order**, matching upstream's `OnGCDReady`, which tries
the primary and falls through to the secondary. So Bite takes what its 10s cooldown allows and Claw
divides the remainder. The same warning the resolver already carries applies: a second ability
spending the same resource *moves* damage rather than adding it. Here Bite returns 3.4 damage per
focus against Claw's 2.6, which is exactly why upstream lists Bite first.

**The GCD ceiling is still applied even though nothing reaches it**, and a test proves it by handing
the model an absurd focus income. An unbounded version would agree everywhere it is currently used
and quietly stop agreeing the moment a cheaper family was added.

**What is not modelled is the starvation.** On a real timeline Claw can spend the pet below 35 focus
just as Bite comes off cooldown, delaying it; the closed form lets Bite take its full cooldown rate
first. That overstates Bite slightly and understates Claw by the same focus, netting a small
overstatement since Bite is the better use of a point. Named here rather than discovered later.

### Bestial Discipline buys rate, and the asymmetry is the tell

+50% focus regen a rank, max 2, so a Beast Mastery hunter runs at **10 focus a second**. Read out of
`pet.go` rather than `talents.go`, because it is an argument to `EnableFocusBar` rather than a stat —
upstream applies it at construction, not in `ApplyTalents`.

**Bite does not move and Claw does.** Bite is already cooldown-capped at base focus, so a larger
income buys none of it; every extra point goes to Claw, which has no cooldown. Claw goes 3.6 to 15.6
uses a minute and overtakes Bite as the larger of the two. A model that scaled the whole ability
budget by the talent would raise both and look just as plausible, which is why the test asserts the
asymmetry rather than the total.

### One multiplier trap, caught by reading rather than by a failure

Upstream writes happiness as `PseudoStats.DamageDealtMultiplier` — unit-wide, reaching everything —
but the family multiplier and the unexplained `0.85` as `AutoAttacks.MHEffect.DamageMultiplier`,
which is **the auto attack alone**. Every pet ability carries `DamageMultiplier: 1`, and Kill Command
re-applies the family multiplier *explicitly*, which is the proof it is not inherited.

Handing the abilities the white chain would have overstated them by about 6% at the modelled family
and silently more at another. The damage sources are split into `Pet melee`, `Pet Bite` and `Pet
Claw` partly so this stays visible per source rather than inside one total.

---

## The pet, continued — and the two sourcing jobs were three, 2026-08-27

    Hunter Marksmanship   1209 -> 1225   (1.1x)
    Hunter Beast Mastery  1325 -> 1405   (1.6x -> 1.5x)
    Hunter Survival       1133 -> 1150   (1.5x)

The section below sized this as **two sourcing jobs, not a modelling one**. Both were done and both
were smaller than billed. **The third job was not on the list at all**, and it was the largest of the
three: the white damage this model already had was missing three multipliers.

### The focus economy was never unreadable — it was in the wrong package

The blocked half was stated as "the base focus regeneration is passed to `EnableFocusBar` as a
*multiplier* rather than a rate". True, and the conclusion drawn from it — that the rate cannot be
read off the source — was wrong. `EnableFocusBar` is defined in **`sim/hunter/focus.go`**, not in
`sim/core`, and it carries every constant:

    const MaxFocus = 100.0
    const tickDuration = time.Second * 5
    const BaseFocusPerTick = 25.0

    focusPerTick: BaseFocusPerTick * regenMultiplier

So the base is **5 focus per second**, the multiplier is `1.0 + 0.5*BestialDiscipline`, and Bestial
Discipline is +50% regen a rank on top of it. The reason this went unsourced is worth keeping: the
previous pass looked in `sim/core/energy.go`, found the rogue and druid energy constants and no focus
ones, and read that absence as the constants not existing. **A search of the wrong package returns
the same empty result as a search for something that is not there.**

Every pet ability is sourced too, from `sim/hunter/pet_abilities.go` — Bite 35 focus on a 10s
cooldown for 108-132, Claw 25 for 54-76, Gore 25 for 37-61 with a 50% chance to double, Screech 20
for 33-61, all on a GCD locked at 1.5s by `IgnoreHaste: true`. **They are still not modelled**, and
the remaining gap is now honestly a rate model rather than a missing number.

### Three multipliers were missing from white damage, and they were never talents

This is the part nothing predicted. `pet.go` applies four multipliers within ten lines of each other
and this model had **one** of them:

| | Upstream | Was modelled |
|---|---|---|
| Happiness | `PseudoStats.DamageDealtMultiplier *= 1.25` | yes |
| "Cobra reflexes" | `PseudoStats.MeleeSpeedMultiplier *= 1.3` | **no** |
| Family damage | `MHEffect.DamageMultiplier *= petConfig.DamageMultiplier` | **no** |
| Uncommented | `MHEffect.DamageMultiplier *= 0.85` | **no** |

Net about **+21%** on the pet's white damage. None of the three is a talent, a family gate or a
conditional — all three are applied unconditionally, and the one worth naming is the `0.85`, which
upstream applies with **no comment at all**. It is carried across as read: a constant nobody can
explain is still a constant the reference implementation uses, and dropping it because it lacks a
justification would have overstated every pet by 18%.

The family multiplier needed a decision rather than a lookup. `PetConfigs` spans **0.91 (Bear) to
1.1 (Cat, Raptor, Ravager)** and this app has no pet picker, so the **Cat is assumed and the estimate
says so** — the same assumption every other default here makes, stated rather than buried, with a
test pinning that the named family and the priced multiplier cannot drift apart.

### The talents were the easy half, and one of them is two talents

Four now reach the pet, on their own `pet*` fields in `TalentModifiers`: Ferocity (+2% pet crit a
rank), Animal Handler (+2% pet hit), Unleashed Fury (+4% pet damage), Serpent's Swiftness (+4% pet
melee speed).

**Separate fields are the mechanism, not tidiness.** A pet inherits attack power, spell power,
stamina and armour from its owner and *nothing else* — no crit, no hit, no haste. Folding Ferocity
into the shared `meleeCritChance` would have handed the hunter crit they have not earned, and it
would have raised the total, which reads as progress. The test asserts Auto Shot is **byte-identical**
across each pet talent, which is the half that catches it.

**Serpent's Swiftness is one talent id with two extractors.** Upstream writes two separate lines —
`RangedSpeedMultiplier` on the hunter and `pet.PseudoStats.MeleeSpeedMultiplier` on the pet — at the
same coefficient. One extractor would have silently dropped whichever half it did not match, and the
ingest would have reported success either way.

### What is left, and the share it is worth

The pet was ~6% of a hunter's total. At best-case BiS it is now **11.2% for Beast Mastery**, 7.7% for
Marksmanship and 8.2% for Survival — against archon's rotation data putting a real one nearer a
third. So the abilities really are most of the remaining gap, which the previous section guessed and
this one can now measure.

Two talents stay refused and **both reasons are about the ability rate rather than about the pet**,
which is the point of the rewrite: Frenzy is a 30% haste aura procced by pet crits, and pricing its
uptime off white swings alone would understate it when most of a pet's attacks are abilities; Bestial
Discipline multiplies a focus income nothing spends yet.

**Two claims in the section below were wrong and are corrected rather than edited away.** Kill
Command **is** implemented upstream — `sim/hunter/kill_command.go`, spell 34026 on the hunter and
34027 on the pet — and this repo said it was not, in the module doc, in the user-facing estimate and
here. And the ingest refused six Hunter talents as "there is no pet in this model", which was true
when written and false from the moment the pet shipped. A test now fails if any Hunter refusal says
it again.

---

## Stage 3 begins — the pet, and an honest shortfall, 2026-08-23

The first item on the not-built list, and the one the report sized as largest.

    Hunter Marksmanship   1131 -> 1209   (1.2x -> 1.1x)
    Hunter Beast Mastery  1247 -> 1325   (1.7x -> 1.6x)
    Hunter Survival       1056 -> 1133   (1.6x -> 1.5x)

**A pet is a second attacker, not an ability**, which is why it had nowhere to live: its own attack
power, its own crit, its own weapon, none expressible in `SignatureAbility`. Every hunter estimate
before this described a hunter standing alone.

The mechanic the answer turns on: **a pet inherits no crit at all.** Upstream inherits attack power
(22% of ranged), spell power, stamina and armour, and nothing else — so the pet rolls on its own base
crit of about 6.8%, and putting it on the hunter's would have overstated it badly. Its attack power
is `-20 + 162 Strength x 2 + 0.22 x owner ranged attack power`, and it is always happy, which is a
flat 1.25x that upstream also applies unconditionally.

**It closed less than expected and that is the finding, not a disappointment.** The pet adds roughly
**6%** of a hunter's total where archon's own rotation data puts a real pet nearer a third. The
missing part is named rather than absorbed: the focus-costed abilities (Bite, Claw, Gore, Screech)
are not modelled, because the base focus regeneration is passed to `EnableFocusBar` as a *multiplier*
rather than a rate and a number that cannot be read off the source is not one this repo invents; and
none of the Beast Mastery talents that scale a pet are ingested — Unleashed Fury (+4% damage/rank),
Serpent's Swiftness (+4% attack speed/rank), Ferocity (+2% crit/rank), Animal Handler, Frenzy. Kill
Command is not implemented upstream either.

So the next pet increment is **two sourcing jobs, not a modelling one**: the focus economy, and a
pet-scaling kind in the talent ingest. Both are bounded, and the damage table added in stage 2 is what
will show whether either lands.

---

## Stage 2 of the migration path — a damage table that adds up, 2026-08-23

`SimulationResult.damageSources` is every source, its DPS and its share, and **it sums to
`scoreExact`**, which a test asserts for all twenty DPS specs.

`breakdown` could not do this job: it mixes inputs with outputs — attack power and crit chance sit
beside `Windfury Weapon DPS` — so it cannot be summed and cannot be laid next to a log.

**The invariant is the point.** "The total is 3.3x low" and "white damage is 3.2x low while Windfury
is 5.7x low" are different pieces of information, and only the second says what to fix. The reference
Hydross comparison earlier in this file is exactly that, worked out by hand from a Warcraft Logs
table; this makes it something the app produces. A source dropped, double-counted, or mitigated on
the wrong side of the armour term now shows up as a sum that stops matching, rather than as a
plausible row nobody checks.

It renders in the panel, sorted biggest first with a share bar, in the shape a log uses — because a
complete decomposition only a test can see would be this project's signature failure for the fourth
time.

One asymmetry worth knowing if you extend it: **physical sources take armour and the damage
multiplier, Holy sources take only the multiplier.** That is why the list is built where the total is
rather than by scaling a flat list uniformly afterwards.

---

## Stage 3, and it did not need a timeline — 2026-08-23

**Stage 3 was scoped as "the first stage that adds a mechanism", needing a concurrent-DoT uptime
model. The mechanism turned out to be arithmetic.** DoTs do not compete for a resource the way energy
abilities do — they compete for **globals**. A DoT refreshed on its own duration costs
`gcd / duration` of every second and returns `damagePerApplication / duration` of damage, both closed
form, and the filler takes whatever fraction of the second is left. `resolveCasterRotation` is forty
lines.

Affliction was the spec it mattered most for, and it went from the worst in the table to mid-pack:

    Warlock Affliction   183 -> 959   (8.9x -> 1.7x)

Four DoTs sourced to upstream, each with a coefficient TBC **overrides rather than derives** — which
is the detail a duration/15 assumption would have got wrong every time:

| DoT | Duration | duration/15 would give | Actual |
| --- | --- | --- | --- |
| Unstable Affliction | 18s | 1.2 | 1.2 |
| Corruption | 18s | 1.2 | **0.936** |
| Curse of Agony | 24s | 1.6 | **1.2** |
| Siphon Life | 30s | 2.0 | **1.0** |

Three of the four are penalised, and Siphon Life by half — which is why it is the weakest global in
the rotation and the first DoT dropped on a short fight.

**DoTs cannot crit in TBC**, and that is the other mechanic the answer turns on. Periodic damage
rolls no crit without talents this app does not model, so the crit multiplier reaches the filler and
nothing else. Applying it to the DoTs would have inflated the largest share of the spec's damage. A
test raises spell crit and asserts every DoT row is byte-identical while Shadow Bolt moves.

**Priest Shadow followed the same day**, and needed two additions to the mechanism rather than none:

    Priest Shadow   431 -> 639   (3.1x -> 2.1x)

**A channel is a filler, not a maintained DoT.** You re-channel Mind Flay in whatever globals are
spare; you do not keep it up the way Shadow Word: Pain is kept up. Counting it as maintained would
double-count in *both* directions at once — crediting its full damage every 3 seconds and charging 3
seconds of global for it. The `channeled` flag was already on the entry and is what separates them.

**And a channel does not crit either**, because it is periodic. That produced a genuinely surprising
intermediate state: with two DoTs and a channel and nothing else, **spell crit was worth exactly zero
to a Shadow priest** — a test that asserts the spec benefits from its own spell talents failed, and
was right to. The fix was not to weaken the test but to add **Mind Blast**, which is the spec's only
critable spell and the thing crit rating actually buys. A direct cast on a cooldown is pressed on
cooldown and takes its own share of the globals, ahead of the filler.

**Vampiric Touch is flagged, and the reason is worth keeping.** wowsims does not implement it at the
pinned commit, so its coefficient is the plain `duration/15` rule rather than a sourced value — and
three of the four Affliction DoTs turned out to be overrides rather than the formula, so this one has
a real chance of being wrong the same way.

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

**The target is now sourced rather than recalled.** This section originally guessed "1,100-1,400 for
T5, 2,000+ for Sunwell" from memory and flagged it as unsourced. A real parse supplied by the repo
owner puts a Phase 2 Enhancement shaman at **1,709.3 DPS on Hydross** — see the calibration table
below, which replaces the guess.

### Closing the shared machinery, 2026-08-23

The uniform spread argued the missing damage was shared rather than per-spec, and the first item bore
that out. **Unleashed Rage** was refused for two stated reasons and both turned out to be answerable:

- *"a proc with no fixed uptime"* — true until the reference parse measured it at **94.18%**.
- *"a percentage multiplier on attack power would be applied before attack power is derived from
  Strength and Agility, so it would multiply only the flat portion from gear"* — also true, and a real
  ordering bug rather than an excuse. `calculateStats` applies buff multipliers before
  `applyAttributeConversions`, so +10% attack power would have caught only the gear half.

`statMultipliersAfterConversion` is the answer: a second multiplier pass **after** the conversions.
The rule it encodes is worth remembering because getting it wrong is silent — the total still looks
plausible, just small. **A buff multiplying a *primary* stat belongs in `statMultipliers`** so the
conversions downstream see the raised value; **a buff multiplying a *derived* stat belongs after
them**, or it multiplies a number that is not finished.

Applied at 10% x 94.18% uptime, every melee spec moved and no ranged or caster spec did — Unleashed
Rage is *melee* attack power, and that the hunters held still is the check that the field routes
rather than merely multiplies:

    Warrior Fury         961 -> 1030
    Shaman Enhancement   912 ->  966
    Warrior Arms         885 ->  937
    Paladin Retribution  727 ->  767
    Hunter Beast Mastery 932 ->  932   (ranged attack power, correctly untouched)

**Bloodlust and Ferocious Inspiration followed, and needed a route rather than a field.** Both were
refused because they are not stats: percentage haste and a damage multiplier have no `StatBlock` to
land in. `aggregateBuffEffects` gives them one, mirroring `aggregateTargetDebuffs`, and
`calculateSimulation` takes the buff id list it was already handing to `calculateStats`.

Bloodlust's refusal was a real argument and is answered rather than overruled. It said applying 30%
for a whole fight "would overstate it by an order of magnitude" — right — and that averaging
"understates a burst everyone times deliberately" — also right. The reply: **not modelling it
understates by all of its value, averaging by a fraction of it**, so averaging is the better of the
two available wrongs. At 34.51% measured uptime that is 10.4% haste. The limit worth stating is that
uptime is fight-length bound: 34.51% of 116 seconds is one 40-second Bloodlust, and there is no fight
length here to scale it by.

    Shaman Enhancement    966 -> 1076   (1.8x -> 1.6x)
    Warrior Fury         1030 -> 1131   (2.0x -> 1.8x)
    Hunter Marksmanship   847 ->  954   (1.6x -> 1.4x)
    Mage Arcane           751 ->  853   (2.8x -> 2.4x)

**The crit gap was mostly an error in the comparison, not in the model.** This file recorded 38.8%
modelled against the parse's 50.0%. Warcraft Logs reports crit as a share of **hits that landed**;
the model reports it as a share of **all swings**. The log's 59 crits over 136 swings is **43.4%** on
the model's terms, so the real gap is **4.6 points**, not 11. Worth keeping as a caution: two numbers
with the same name and different denominators.

Still unmodelled and still shared: school-scoped multipliers like Sanctity Aura's 10% Holy, which
need a spell school — the same prerequisite stage 3 has been waiting on.

### Calibrated against every spec, 2026-08-23

One parse calibrates one spec. `src/domain/simulation/dpsReference.ts` now carries **archon.gg's
observed averages for all 20 DPS specs** in this phase, and a test dresses each spec in its own rank-1
BiS, every buff and consumable, and its primary tree filled to the 61-point cap, then prints the
comparison. Enhancement's reference of **1,693** lands within 1% of the owner's own Hydross parse at
1,709, which is the only independent check available on the table and a reassuring one.

The model is **1.6x to 3.5x low across the board** (Affliction excepted at 10.1x, for its own
reasons below), with Priest Shadow worst and Marksmanship Hunter closest. That is a tighter and more
uniform spread than expected, and it argues that the missing damage is mostly *shared* machinery —
haste, crit, proc handling — rather than twenty separate per-spec holes.

**The harness has now been wrong twice, both times in the direction that flatters the next person to
"improve" the model.** The second: it dressed every spec in raid gear with **empty sockets and bare
weapons**, never reading the ranked entries' own `recommendedGemIds` and `recommendedEnchantId`, and
left `Finger 2` and `Trinket 2` empty because the ranked list names only `Finger 1` and `Trinket 1`.
Applying them took the slot count from 15 to 17 and moved every spec at once:

    Shaman Enhancement   1076 -> 1305   (1.6x -> 1.3x)
    Hunter Marksmanship   954 -> 1131   (1.4x -> 1.2x)
    Warrior Fury         1131 -> 1305   (1.8x -> 1.6x)
    Druid Feral           636 ->  728   (2.6x -> 2.3x)

The range across the twenty is **1.2x to 2.3x** now. Found by a research agent auditing the
simulator, and verified here before being acted on.

**The first version of this harness was wrong by about 28%, in the same direction.** It ran with **no target debuffs**, where every real parse has Sunder Armor, Faerie Fire and
Curse of Recklessness. Those strip 4,010 armour between them, and against this app's 7,700-armour
target that is the difference between **42.2%** mitigation and **25.9%** — so the harness was
measuring the model against a boss no raid ever fights. Correcting it moved Enhancement from 669 to
**912** and Fury Warrior from 707 to **961** without a line of model code changing. A calibration
rig can be wrong in the same direction as the thing it measures, and this one was.

**The test found a real bug on its first run, which is the argument for having it.** Every spec read
low except **Warlock Affliction, which read 1,731 against a target of 1,629** — the one spec in the
game reading *above* what players parse. The cause: `resolveCast` guarded the "use the DoT's duration
as the divisor" rule on `castTimeSeconds === 0`, a check written for the divide-by-zero an instant DoT
causes. Unstable Affliction is a **1.5s cast with an 18-second duration**, so it fell past the guard
and delivered its entire 18 seconds of damage every 1.5 seconds — twelve times over. It is
`Math.max(castTime, duration)` now, because both bounds are real. Mind Flay is a 3s channel over a 3s
duration and is unaffected either way, which is the check that the fix is the right shape rather than
one aimed at a single ability.

Corrected, Affliction reads **144** and is now the *worst* spec at 11.3x — which is honest, and is
what its own ability notes have always said: "a DoT-only model will understate Affliction", for a spec
that really maintains five DoTs plus a filler.

**The assertion that caught it is deliberately one-directional**: no spec may read *above* its
reference. The model understates everywhere, so a spec reading high is not good news — it is a
double-count, a multiplier applied twice, or a proc rate taken literally. That bound needs no
retuning as the model improves, which is what makes it survivable.

### Calibrated against a real parse, 2026-08-23

The repo owner supplied their own Warcraft Logs breakdown for **Hydross the Unstable, Serpentshrine
Cavern** — 116 seconds, boss-only damage (the spawns are excluded in the table), 198.1k total,
**1,709.3 DPS**. That is a real Phase 2 Enhancement shaman and it is the number to calibrate against,
in place of the recollection this file previously carried.

| Source | Parse DPS | Share | This model | Gap |
| --- | --- | --- | --- | --- |
| Melee (white) | 921.2 | 53.9% | ~286 | **3.2x** |
| Windfury Attack (two lines) | 493.7 | 28.9% | 86.9 | **5.7x** |
| Stormstrike (two lines) | 144.1 | 8.4% | 88.8 | 1.6x |
| Earth Shock | 52.1 | 3.1% | 0 | not modelled |
| Flame Shock | 50.9 | 3.0% | 0 | not modelled |
| Fire Nova Totem | 38.5 | 2.3% | 0 | not modelled |
| Flamecap Fire | 8.8 | 0.5% | 0 | not modelled |
| **Total** | **1,709.3** | | **522** | **3.3x** |

**Windfury is on both weapons, and there is no Flametongue at all.** The parse shows *two* separate
`Windfury Attack` rows with average hits of 2.0k and 962.2 — a 2:1 ratio, which is main hand and off
hand. Two consequences, both of which this repo currently gets wrong:

- Upstream's **36%** proc chance for two imbued hands is the one that applies, not the 20% modelled.
- **Off-hand Windfury attacks are real damage that is not counted at all.**

The same shape appears on Stormstrike — two rows, 1.2k and 653.4 average — which is `hitsBothWeapons`
working correctly, and is why Stormstrike is the closest source in the table at 1.6x. That is a useful
control: where the two-weapon handling is already right, the residual gap is small.

**Haste is the other half, and it compounds.** The parse lands **136 melee swings in 116 seconds** =
**1.17 swings/sec**. Two 2.6s weapons unhasted give 0.77/sec, so the real multiplier is about
**1.5x** against the **1.10** this model produces. The log says where it comes from:

| Source | Uptime |
| --- | --- |
| Flurry | **94.16%** |
| Mongoose (`Lightning Speed`), 10 procs | 53.48% |
| Bloodlust | 34.51% |
| Drums of Battle | 25.57% |

**Flurry at 94% uptime is effectively permanent**, and it is the talent the ingest refuses by name.
It scales white damage *and* the Windfury proc rate, so it is the single highest-leverage item in
this file — one talent sitting underneath both of the two largest gaps.

Melee crit in the parse is **50.0%** against 38.8% in the fully buffed and talented model.

**Four abilities are modelled at zero and are worth 150.3 DPS together (8.8%)**: Earth Shock, Flame
Shock, Fire Nova Totem and Flamecap Fire. Note that three of the four are *spell* damage on a melee
spec, which runs into the missing spell school the same way stage 3 does.

**Two of these landed the same day, and the parse changed one of them mid-flight.**

- **Flurry is ingested.** The refusal was right that the rank scale differed and wrong that this made
  it hard: upstream is `1.05 + 0.05*rank` against the Warrior's `1 + 0.05*rank`, so the same slope
  plus a flat 5%, carried by a new `baseBonus` field. The 3-stack analytic derivation was reused
  untouched. **522 → 615.9 DPS**, and Windfury rose with it (86.9 → 105.7) because the proc rate
  follows the swing rate — one talent under both of the top two gaps, exactly as predicted.
- **Windfury now rolls on the off hand.** With both hands imbued the model went to **668.7 DPS**.

**And the parse falsified upstream's constant, which is the whole reason to have a log.** wowsims
carries 0.2 for one imbued hand and **0.36 for both**. Taken literally as a per-swing chance that
predicts **18.3 procs per minute**; the log records 41 Windfury hits over 116 seconds, which at two
attacks per proc is **10.6 per minute**. Rolling 0.2 per landed swing on *each* hand predicts
**10.1** — inside 5%. So 0.36 is upstream expressing something other than a per-swing chance
(plausibly one roll for a pair, since `1 - 0.8²` is 0.36), and the model declines it with the
arithmetic written down. **The implied rate straight off the parse is 17.4%**, slightly under 20%,
which is the shape the shared 3s cooldown predicts.

Where that leaves the comparison: total **668.7 against 1,709.3**, so 2.6x rather than 3.3x. Windfury
is 158.5 against 493.7 — the *rate* now matches the log and the *damage per proc* does not, which
points at the same place white damage does.

**What remains, and it is mostly one thing.** White damage is 2.2x low and Windfury inherits it,
because both take their damage from the same swing. Candidates, none yet checked: melee crit is 38.8%
against the parse's **50.0%**; **Unleashed Rage** is unmodelled and is +2% attack power per point;
Bloodlust, Drums of Battle and Mongoose are all in the log's haste stack and none are modelled; and
the BiS list hands this shaman *the same 2.7s weapon in both hands*, which is unlikely to be what the
parsed player was holding.

**Order of work this implies**, by leverage rather than by tidiness:

1. **Flurry** — under both of the top two gaps.
2. **Windfury on the off hand, at the 36% two-imbue rate** — 28.9% of real damage, currently 5.7x low.
3. **Earth Shock and Flame Shock** — 6.1% together, and the honest start of "Enhancement presses more
   than two buttons".
4. **Elemental Weapons** — +13.33% per point to Windfury, which multiplies whatever item 2 fixes.

One caveat kept deliberately: this is **one parse, on one fight, with visible downtime** — the DPS
trace falls off after roughly 0:50. It is a far better target than recollection, and it is still a
single sample. Numbers derived from it should say so.

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
