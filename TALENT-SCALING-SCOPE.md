# Talent scaling — scope

**Written 2026-08-15 against `773a8eb`; stage 1 shipped the same day.** This began as a decision
document. It is kept because the prediction it made was **half wrong**, and the record of that is
worth more than a tidy plan.

Every count below was measured off the repo, not recalled. Where a measurement is a heuristic, it
says so and says which direction it errs.

---

## What actually happened

**Stage 1 is built.** Warrior talents reach `calculateSimulation` and nothing else;
`tools/ingest/ingest-talent-effects.mjs` reads `sim/warrior/talents.go`, `dps_warrior.go` and
`berserker_rage.go` at the pinned commit. 11 effects extracted, 9 talent groups refused by name.

**The falsification test this document committed to in advance half failed, which is the whole point
of having written it first.** It required DPS to move *and* the rage gap to close:

| | Untalented | Talented |
|---|---|---|
| Fury DPS | 165.6 | **193.2** (+16.7%) ✅ |
| Rage/sec | 3.4 | **5.4**, against 7.5 needed ❌ |
| Heroic Strike | excluded | **still excluded** ❌ |

So **talents are a major missing piece but they are not the rage fix**, which is what HANDOFF.md had
asserted. Flurry — the talent that whole diagnosis rested on — is gated on crit, and at the 13% a
Phase 2 Fury warrior actually has, a "+25% attack speed" talent is worth **+7.4%**.

Adding every remaining expressible rage source (Bloodrage, Improved Berserker Rage) reached 5.4 and
stopped. The last one, rage from damage taken, needs an incoming-damage stream a closed-form model of
a DPS does not have — it became `SimulationTarget.damageTakenPerSecond`, and then became unreachable
when the encounter was fixed to one boss with no controls. **Fury's rotation still cannot fund its
own dump, and now says so precisely.**

Three corrections came out of building it, each caught by asserting a *value* rather than a
direction:

- `rageGeneratedMultiplier` was in neither dispatch map, so **Endless Rage contributed nothing**. A
  test asserting "DPS went up" would have passed. `talentModifiers.ts` now throws at import if any
  ingested effect kind has no destination.
- **Endless Rage applies to the swing-speed term only**, not the whole swing — the tooltip says "more
  rage from damage dealt" and upstream disagrees with its own tooltip. Getting this wrong put
  talented rage at 5.8 instead of 5.4.
- Flurry needed a closed-form derivation the ingest could not supply: a Markov chain over the 3-stack
  aura, `π₀ = (1-c)³`, time-weighted. Deliberately a lower bound.

---

## The short version

The job is **not** "extract 579 talents from prose". That framing is what makes it look expensive,
and it is also the framing most likely to reproduce this project's oldest failure — plausible
invented values.

Three things change the picture:

1. **59% of talents change the character's own numbers**, not a named ability. Those need no
   ability model, and most land on hooks that already exist in `calculateSimulation`.
2. **Talent effects have a pinned, machine-readable upstream** — wowsims implements them as Go code
   at commit `3301fca5`, which this repo already pins for items, gems, enchants, buffs and item
   effects. Four warrior files are already sitting in `tools/ingest/.cache/wowsims/`.
3. **The ability-targeted 41% mostly has nothing to target.** The simulator models 27 distinct
   abilities. A talent that boosts Starfire is worth something; the ~187 that boost abilities this
   app has never heard of are worth nothing until rotations exist.

Recommendation: build **one spec, character-global talents only, Fury Warrior** — and treat it as a
falsifiable test of the handoff's own diagnosis rather than as stage one of a 579-talent programme.
Details in [Recommendation](#recommendation).

---

## The four gaps

### 1. Plumbing — `talentPoints` reaches nothing

The state already exists and is already persisted. It just has no consumer.

| | |
|---|---|
| Held in | `App.tsx:129`, `useState<TalentPoints>` |
| Persisted | `buildSerialization.ts:43`, `buildTypes.ts:34` — saved builds already round-trip it |
| Reset on class change | `App.tsx:178` |
| Consumed by | `TalentsPanel` (`App.tsx:275`) — **and nothing else** |

Four functions would need it, and all four are call sites in the same component tree:

- `calculateStats(character, gear, buffIds, consumableIds, bonusStats)`
- `calculateSimulation(character, gear, stats, role, debuffIds, target)`
- `findUpgrades(...)`
- `calculateStatWeights(...)`

**The trap worth naming now:** if talents reach `calculateStats` but not `findUpgrades` and
`calculateStatWeights`, the upgrade rankings silently diverge from the stat rail the user is looking
at. Those two call `calculateStats` themselves to score candidates, so they need the same talent
argument or they score a different character than the one on screen. This is the same class of bug
as the two-hander/off-hand fix — a value computed one way in one place and another way in another.

### 2. Types — `StatBlock` has nowhere to put a percentage

`StatBlock` is 26 fields of flat amounts and ratings. There is no field that can hold any of:

- `+5% critical strike chance` — crit *chance*, not crit *rating*; the conversion is one-way
- `+10% damage`
- `+25% attack speed`
- `+25% rage generated`
- `-2% chance to be dodged`

Two precedents exist for where this goes, and they are not equally good:

- `applyStatMultipliers` (`statUtils.ts:33`) — multiplies a named `StatBlock` field. Works for
  Vitality (`+5% Stamina`) and Toughness (`+10% armor from items`). Does **not** work for anything
  that is not a `StatBlock` field, which is most of the list above.
- `aggregateTargetDebuffs` (`calculateSimulation.ts:153`) — collapses a set of ids into a small
  typed record (`armorReduction`, `physicalCritTakenBonus`, …), each field applied at one named
  point in the calculation. **This is the right shape for talents.** It is already proven, it keeps
  every modifier's application point explicit, and a modifier with nothing to apply to contributes
  nothing by construction rather than silently.

Several hooks a talent modifier would need **already exist**, which is most of why stage 1 is small:

| Talent effect | Existing hook |
|---|---|
| Attack speed % | `attackSpeedMultiplier` (`calculateSimulation.ts:412`) |
| Melee crit % | `rawCritChance` (`:393`) — debuffs already add to it the same way |
| Melee hit % | `missReduction` (`:394`) |
| Rage generated % | `ragePerSecondFromWeapon` result (`:499`) |
| Ability rage cost | `ability.resource.cost` read at `:262` |

### 3. Data — the prose is regular, the effects are not

Per-rank descriptions are cleanly regular: one sentence, one number that varies by rank. Extracting
*a* number per rank is tractable.

Extracting *the meaning* is not. Measured over all 579 max-rank descriptions with a regex
classifier — **a crude one, 25% fell through to unclassified and several visible entries are
misfiled** — the shape of the problem still shows through:

- **~31% are conditional or proc-based.** "for your next 3 swings after dealing a melee critical
  strike", "after being the victim of a critical strike", "when activated". These are not stat
  modifiers; they need an uptime derivation.
- **Compound effects are common.** Naturalist reduces a cast time *and* adds 10% physical damage.
  Defiance adds threat *and* expertise. Combat Expertise adds expertise *and* 10% Stamina. One
  talent is not one modifier.
- **Free text carries markup.** Several descriptions contain `<br />`.

A prose-extraction pass would therefore be an *interpretation* of 579 descriptions. Given that this
project's whole history is recovering from plausible-looking invented values, that is the wrong
source — see [Provenance](#provenance-the-part-that-changes-the-cost).

### 4. Targets — the decisive gap

Split by what a talent acts on (heuristic: does the description name a capitalised ability after
"your"; over-matches, so it *understates* the character-global share):

| | Count | Share |
|---|---|---|
| Character-global | **340** | 58.7% |
| Ability-targeted | **239** | 41.3% |

The simulator models **27 distinct abilities across 31 entries**, one to five per spec:

```
Druid    Starfire, Shred, Lifebloom          Priest   Flash Heal, Circle of Healing, Mind Flay
Mage     Arcane Blast, Fireball, Frostbolt   Rogue    Mutilate, Sinister Strike, Hemorrhage
Paladin  Holy Light, Consecration,           Shaman   Lightning Bolt, Stormstrike, Chain Heal
         Crusader Strike                     Warlock  Unstable Affliction, Shadow Bolt, Incinerate
Hunter   Steady Shot (all three specs)       Warrior  Mortal Strike, Bloodthirst, Shield Slam,
                                                      Whirlwind, Heroic Strike
```

Of the 239 ability-targeted talents, **at most 52 name something modelled** — and that 52 is
inflated twice over: the matcher counts school names ("Fire", "Shadow", "Frost") as ability matches,
so Mage/Fire Impact (a stun proc) is counted as a Fireball modifier; and it missed Hunter entirely.
The true figure is lower.

**So roughly 187 ability-targeted talents have nothing to modify.** Not "modify it imprecisely" —
there is no such ability in the model. That is not fixable by better talent data; it is gated on
rotation coverage, which is its own separate open item.

---

## Provenance: the part that changes the cost

**wowsims implements talents as code, at the commit this repo already pins.** All nine class
modules are present at `3301fca5`, and four warrior files are already in the local cache — no fetch
needed to verify this, the evidence is on disk:

```
sim_warrior_heroic_strike_cleave.go:9   cost := 15.0 - float64(warrior.Talents.ImprovedHeroicStrike)
                                                     - float64(warrior.Talents.FocusedRage)
sim_warrior_dps_dps_warrior.go:74       EnableRageBar(..., TernaryFloat64(war.Talents.EndlessRage, 1.25, 1))
sim_warrior_warrior.go:195              secondaryModifier += 0.1 * float64(warrior.Talents.Impale)
sim_druid_druid.go:109                  primaryModifier = 1 + 0.02*float64(druid.Talents.PredatoryInstincts)
```

That second line is the rage-income gap HANDOFF.md describes, already reduced to a sourced constant.

This makes talent effects the **same kind of job as `ingest-item-effects.mjs`** — read a pinned
upstream, take what is expressible, report and skip what is not. It also self-limits usefully: a
talent wowsims did not implement is one that did not matter enough to a simulator to be worth
implementing.

**The load-bearing caveat.** wowsims is event-driven — auras, charges, callbacks, a real timeline.
This simulator is closed-form. **The values transfer; the mechanisms do not.** Flurry in wowsims is
an aura holding charges that auto attacks consume; here it has to become an analytic expected
uptime, and *that derivation is this project's own work*, not something an ingest can hand over. It
is the same judgement `effectUptime` already makes for item procs with its `duration / cooldown`,
and it needs the same kind of written justification.

That derivation is the one genuinely novel piece of work in stage 1, and it should be treated as
the risk item.

---

## Recommendation

### ~~Do this~~ **Done**: stage 1 — Fury Warrior, character-global talents only

The smallest change that tests the handoff's own diagnosis. Fury Warrior is the right spec because
it is the one whose number is already known to be wrong (165.6 DPS), the one whose cause is already
written down (rage income, gated on Flurry), and the one whose upstream is already cached.

The candidate set, measured — Warrior talents that change the character rather than a named ability:

| Talent | Effect | Lands on |
|---|---|---|
| Flurry | +25% attack speed, next 3 swings after a melee crit | `attackSpeedMultiplier` — **needs uptime derivation** |
| Endless Rage | +25% rage from damage dealt | rage income, sourced constant `1.25` |
| Cruelty | +5% melee crit | `rawCritChance` |
| Precision | +3% melee hit | `missReduction` |
| Improved Berserker Stance | +10% attack power | `stats.attackPower` |
| Dual Wield Specialization | +25% off-hand damage | `offHandDps` |
| Weapon Mastery | −2% chance to be dodged | special/white attack tables |
| Impale | +20% crit damage bonus of abilities | `MELEE_CRIT_DAMAGE_MULTIPLIER`, specials only |
| Anger Management | 1 rage / 3 sec in combat | rage income, flat |
| Unbridled Wrath | chance of extra rage on melee damage | rage income — **needs a rate** |
| Deep Wounds | crits bleed for 60% of weapon average over 12s | a new damage term |
| Two-Handed Weapon Specialization | +5% two-hander damage | white + specials (Arms) |
| Death Wish / Enrage / Rampage | conditional damage and AP | **uptime derivations; defer** |

Build: a `TalentModifiers` record in the `aggregateTargetDebuffs` shape, derived from
`TalentPoints` + the class's talent tree, threaded into `calculateSimulation`, applied at the hooks
above. Defer the three conditional ones at the bottom — they need the same uptime machinery as
Flurry and none of them is load-bearing for the rage thesis.

**State the falsification test before building it.** A 41-point Fury build carrying Flurry 5,
Endless Rage, Cruelty 5, Precision 3 and Improved Berserker Stance should move 165.6 DPS
substantially toward a defensible figure *and* close the rage gap — auto attacks currently fund
~3.1 rage/sec against the 7.5 Bloodthirst and Whirlwind need. If it does not, the diagnosis in
HANDOFF.md is wrong, and stages 2 and 3 should not be built on top of it.

### Then reassess: stage 2 — the other physical specs

Same machinery, no new concepts, once stage 1 has proven the shape. Arms, Protection, both Rogue
DPS trees, Enhancement, Feral.

### Only if wanted: stage 3 — ability-targeted talents

Restricted to the ≤52 that name a modelled ability. Worth noting that this stage competes directly
with simply modelling more abilities, and modelling more abilities is probably worth more.

### Do not do this: a general 579-talent extraction

- ~187 ability-targeted talents have nothing to modify.
- ~31% are conditional or proc-based and need event machinery this simulator does not have.
- Prose interpretation at that volume is exactly the risk this project's history warns about.

---

## Consequences worth deciding before, not during

**Does the stat rail move?** This is the real scope question, and it is a product decision rather
than a technical one.

- Talents in `calculateSimulation` only → affects a **hidden** tab. Low blast radius.
- Talents in `calculateStats` too → the **always-visible stat rail changes** for every user, and so
  do gear rankings and upgrade suggestions. Vitality (+5% Stamina), Toughness (+10% armor),
  Combat Expertise (+10% Stamina) are all real and all rail-visible.

The second is more correct and much more visible. It also means an empty talent tree — the default,
since `talentPoints` starts `{}` — must produce **exactly today's numbers**, or every existing
expectation in the test suite moves at once. That is a hard invariant worth a test of its own.

**It bears on the `featureFlags.ts` decision.** Talent scaling is the substantive reason melee DPS
reads low. Whatever is decided about unhiding the Simulation tab, doing it *before* this lands means
publishing a number known to be understated for a known reason.

---

## Cost

Stage 1 is roughly a session: the modifier record and its derivation, threading four call sites,
the Flurry uptime derivation, and tests including the empty-tree invariant. The Flurry derivation is
the only part whose difficulty is genuinely uncertain — everything else is plumbing against hooks
that already exist.

Stages 2 and 3 are not estimated here, deliberately. Stage 1 is designed to produce the evidence
that says whether they are worth estimating.
