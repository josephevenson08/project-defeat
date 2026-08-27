# Simulation architecture — is an event loop required?

**Written 2026-08-26 against `80c8ac8`.** Research only; no source file was changed. Companion to
`ROTATION-SCOPE.md`, which scopes *rotations*; this scopes the *engine underneath them*.

Reference implementation throughout is **wowsims/tbc at `3301fca5`**, the commit this repo already
pins for items, talents and base stats.

---

## Executive summary

**An event loop is warranted, but not as a replacement — as a second tier, and not first.** The
honest reading of the measurements below is that the ceiling on what a clock can buy — measured as
the spread between wowsims' own 60-second and 300-second results for the same character — is **0–27%
for every physical spec** and **36–66% for the three Mage specs**, while the model is currently
**1.19x to 2.27x low at best case**. So the clock cannot be most of the gap, and building it first
would spend the largest piece of work on a minority of the error. The parts that genuinely need a
clock are a short, nameable list:
snapshotting DoTs, execute phases, cooldown alignment against a *finite* fight, ramp-and-dump
resource cycles (Arcane Blast, rogue energy pooling), melee weaving, and variance itself. Everything
else in the current gap — pets, poisons, Slice and Dice's haste, Deep Wounds, Combat Potency,
Windfury Totem, Expose Weakness, weapon-enchant procs, damage-proc trinkets, and the gems and
enchants the calibration harness simply forgets to equip — is expressible closed-form and is not
built.

The second reason not to replace the engine is that this project has two features wowsims does not
have, and they are the ones a Monte Carlo engine breaks. `findUpgrades` scores **2,308–2,712
candidate items** in **58–93 ms**, live, in a React `useMemo`, on every gear change
(`src/App.tsx:244`). `calculateStatWeights` does the same on every render (`src/App.tsx:204`). A
3,000-iteration Monte Carlo sim costs ~0.25 s in plain JavaScript even in a stripped-down prototype
(measured below); 2,700 of those is eleven minutes. And it fails statistically as well as
temporally: at the sampling noise measured below, two items separated by less than about a tenth of a
percent are **not reliably ordered at all**, and a ranked gear list is full of those. wowsims never
has to solve this — its UI at the pinned commit has a gear picker and a stat-weights button and **no
upgrade finder at all** (`ui/core/components/`).

So the recommendation is a **two-tier engine**: keep `calculateSimulation` as the fast analytic
scorer that ranks gear and derives stat weights, and add an event loop behind the "Run" button as
the accurate headline number, with the analytic scorer calibrated *against* it. That is a strictly
additive change, it can land in stages that each buy something on their own, and the first three
stages do not require the loop at all.

**The single highest-value thing to do first is not engine work.** The calibration harness in
`tests/planner.spec.ts` runs with **no gems and no enchants**, and with two of seventeen slots on the
app's default item. Correcting that alone moves the mean shortfall from **1.96x to 1.69x** — about a
quarter of the reported gap — without touching a line of model code. The same class of defect is in
the shipped data: `Weapon - Mongoose`, the recommended main-hand enchant for three melee specs,
carries an **empty stat block and no effect**, so it contributes exactly zero.

---

## How to reproduce every number in this document

Numbers below are marked **[measured]** (I ran it), **[read]** (quoted from a file, with the path),
or **[derived]** (arithmetic on top of one of those — the operation is always shown).

The calibration table came from the repo's own test:

```bash
npx playwright test --reporter=line -g "every DPS spec is measured against what players actually parse"
```

Everything else marked [measured] came from four read-only Node scripts written into the session
scratchpad — never into the repo — that import the app's modules using the `registerHooks` pattern
`HANDOFF.md` documents under "Repo conventions". They reproduce `bestCaseSimulation` from
`tests/planner.spec.ts` and then vary one input at a time. They are not committed; the numbers are,
and each is stated with the setup that produced it so it can be re-derived.

wowsims quotes are `https://raw.githubusercontent.com/wowsims/tbc/3301fca5/<path>` with the line
number as of that commit.

---

## 1. Where the model actually stands

### The calibration table, run today

Full BiS rank 1, all 33 buffs, all 31 consumables, the six modelled target debuffs, primary tree
filled to the 61-point cap. This is `tests/planner.spec.ts`'s own harness, unmodified. **[measured,
2026-08-26, `80c8ac8`]**

| Spec | Modelled | archon.gg | Ratio |
| --- | ---: | ---: | ---: |
| Druid Feral | 636 | 1655 | 2.6x |
| Mage Arcane | 853 | 2084 | 2.4x |
| Warlock Destruction | 757 | 1838 | 2.4x |
| Warlock Demonology | 674 | 1619 | 2.4x |
| Rogue Combat | 732 | 1731 | 2.4x |
| Paladin Retribution | 826 | 1785 | 2.2x |
| Priest Shadow | 639 | 1330 | 2.1x |
| Hunter Beast Mastery | 1050 | 2068 | 2.0x |
| Hunter Survival | 878 | 1696 | 1.9x |
| Shaman Elemental | 746 | 1422 | 1.9x |
| Druid Balance | 750 | 1401 | 1.9x |
| Mage Fire | 762 | 1413 | 1.9x |
| Rogue Assassination | 750 | 1362 | 1.8x |
| Warrior Fury | 1131 | 2053 | 1.8x |
| Warlock Affliction | 959 | 1629 | 1.7x |
| Warrior Arms | 1023 | 1706 | 1.7x |
| Mage Frost | 696 | 1120 | 1.6x |
| Shaman Enhancement | 1076 | 1693 | 1.6x |
| Rogue Subtlety | 822 | 1292 | 1.6x |
| Hunter Marksmanship | 954 | 1341 | 1.4x |

**`src/featureFlags.ts` currently says "The model reads 1.4x to 3.1x low".** The measured range is
**1.4x to 2.6x**. The claim is stale in the flattering direction, and — unlike the three numeric
claims that file explicitly says are pinned — nothing asserts this range. That is this repo's own
documented failure mode recurring for the fourth time; it is recorded here rather than fixed,
because fixing it belongs in a commit that also writes the assertion.

### A large part of that table is the harness, not the model

`bestCaseSimulation` builds gear as `{ ...gear[slot], item }` off `defaultGear`, and `defaultGear`
sets `gemIds: item.sockets?.map(() => '')` with **no `enchantId` at all**
(`src/domain/gear/defaultGear.ts:32`). The BiS entries carry `recommendedGemIds` and
`recommendedEnchantId` (`src/domain/bis/bisTypes.ts:25-26`) and the harness reads neither.

Re-running the same harness with the BiS list's own recommendations applied, and with the paired
Finger 2 / Trinket 2 slots filled from the rank-2 entry a player would actually wear there:
**[measured]**

| | Mean shortfall | Range |
| --- | ---: | --- |
| Harness as it stands | **1.96x** | 1.25x – 2.60x |
| + recommended gems and enchants | **1.74x** | 1.19x – 2.32x |
| + second ring and trinket | **1.69x** | 1.19x – 2.27x |

Per spec, gems and enchants alone are worth **+9.5% (Affliction) to +16.4% (Elemental)**, mean
+12.5%. Sockets are fully covered by the recommendations (8–13 gems per spec, every socket in the
rank-1 set); enchants cover 9–11 slots per spec. **[measured]**

This matters for the architecture question more than its size suggests: it means **the number the
project has been treating as "how wrong the damage model is" is about a quarter setup error**, and
that quarter is data plumbing, not a missing clock.

### The one spec where three independent references agree

Enhancement Shaman is the only spec with a real parse, an archon average, *and* a matched wowsims
preset in the same phase:

| Source | DPS |
| --- | ---: |
| This model, harness as it stands | 1,076 **[measured]** |
| This model, + gems, enchants, second ring and trinket | **1,305** **[measured]** |
| archon.gg observed average, SSC/TK | 1,693 **[read, `src/domain/simulation/dpsReference.ts`]** |
| Owner's Hydross parse, 116 s | 1,709.3 **[read, `ROTATION-SCOPE.md`]** |
| wowsims `3301fca5`, P2 preset, full buffs, 300 s single target | **1,975.6** **[read]** |

The wowsims figure is key `TestEnhancement-Settings-Orc-P2-Basic-FullBuffs-LongSingleTarget` in
`sim/shaman/enhancement/TestEnhancement.results`. It is a fair comparison: the preset gems and
enchants every slot, imbues **both** hands with Windfury
(`sim/shaman/enhancement/presets.go`, `FullConsumes`), runs Drums of Battle and a Flame Cap, and
applies a debuff set including Expose Weakness at 80% uptime from an 800-Agility hunter. Its target
is level 73 with **7,684 armor** (`sim/core/test_utils.go`, `DefaultTargetProto`) against this app's
level 73 / 7,700 — near-identical.

A correct TBC event-loop sim therefore reads **17% above** what players actually average, which is
what you would expect from a flawless player against a real one with movement and downtime. It is
also a reminder that **archon is the right calibration target for a planner and wowsims is not**:
aiming at 1,975 would build in a 17% optimism the app would then present as fact.

---

## 2. What wowsims actually is

Concretely, and with file citations. The whole engine is a **discrete-event simulation with a
priority queue of callbacks**, run many times over and averaged.

### The core loop is 30 lines

`sim/core/sim.go:258`, `runOnce()`:

```go
for {
    last := len(sim.pendingActions) - 1
    pa := sim.pendingActions[last]
    sim.pendingActions = sim.pendingActions[:last]
    if pa.cancelled { continue }
    if sim.Encounter.EndFightAtHealth == 0 {
        if pa.NextActionAt > sim.Duration { break }
    } else if sim.Encounter.EndFightAtHealth < sim.Encounter.DamageTaken { break }
    if pa.NextActionAt > sim.CurrentTime {
        sim.advance(pa.NextActionAt - sim.CurrentTime)
    }
    pa.OnAction(sim)
}
```

That is the entire scheduler. `pendingActions` is kept sorted **descending** by time, so popping the
tail gives the earliest event; `AddPendingAction` (`sim.go:302`) does an O(n) sorted insert into a
slice rather than using a heap.

**Time is a `time.Duration` in nanoseconds** (`sim.go:26`, `CurrentTime`). There is no tick and no
fixed step — the clock jumps from event to event. `advance()` (`sim.go:315`) is the only thing that
moves it, and its job is to expire auras and fire execute-phase callbacks on every unit before the
next event runs.

### Five event priorities, and the ordering is load-bearing

`sim/core/pending_action.go:10-22`:

| Priority | Value | Comment in the source |
| --- | ---: | --- |
| `ActionPriorityDOT` | 3 | "DOTs need to be higher than anything else so that dots can properly expire before we take other actions." |
| `ActionPriorityAuto` | 2 | "Autos can cause regen (JoW, rage, energy procs, etc) so they should be higher prio so that we never go backwards in the priority order." |
| `ActionPriorityRegen` | 1 | "regen can cause GCD actions (if we were waiting for mana)" |
| `ActionPriorityGCD` | 0 | |
| `ActionPriorityLow` | −1 | |

Simultaneous events are ordered by this, which is a detail that only exists because there *is* a
clock. A closed-form model has no simultaneity to break.

### The rotation is one interface method

`sim/core/agent.go:13` defines the `Agent` interface each class implements. It has ten methods, six
of which are construction and configuration; the timeline itself calls only these four:

```go
OnGCDReady(sim *Simulation)                      // agent.go:40
OnManaTick(sim *Simulation)                      // agent.go:43
OnAutoAttack(sim *Simulation, spell *Spell)      // agent.go:49
Reset(sim *Simulation)                           // agent.go:37
```

And the wiring, `sim/core/character.go:294`:

```go
character.gcdAction = &PendingAction{
    Priority: ActionPriorityGCD,
    OnAction: func(sim *Simulation) {
        character.TryUseCooldowns(sim)
        if character.GCD.IsReady(sim) { agent.OnGCDReady(sim) }
    },
}
```

**That is the whole extension point.** A spec is a struct with a `Spellbook` and an `OnGCDReady` that
decides what to press. Nothing else about a spec is special-cased in core.

### Three different rotation *shapes* sit behind that one hook

Worth knowing before assuming there is a single pattern to copy:

- **Priority list** — Warrior. `sim/warrior/dps/rotation.go:22` `doRotation` walks a fixed priority,
  branching on `sim.IsExecutePhase()` (line 67) and on the *swing timer*:
  `sim.CurrentTime + core.GCDDefault - war.slamGCDDelay > war.AutoAttacks.MainhandSwingAt +
  war.slamLatency` (line 69). `slamLatency` and `slamGCDDelay` are user-facing millisecond options.
- **Plan machine** — Rogue. `sim/rogue/rotation.go` is a seven-state machine
  (`PlanOpener`, `PlanSliceASAP`, `PlanFillBeforeEA`, `PlanMaximalSlice`, …) reading current energy,
  combo points, `SliceAndDiceAura.RemainingDuration(sim)` and `sim.GetRemainingDuration()`.
- **Pre-computed schedule** — Enhancement Shaman. `sim/shaman/enhancement/rotation.go` does not
  decide anything at runtime: `SetupRotationSchedule()` lays every totem drop, shock and Stormstrike
  onto a timeline *before the fight*, resolving conflicts inside `MinCastAt`/`MaxCastAt` windows via
  `sim/common/gcd_scheduler.go`. `OnGCDReady` is one line: `enh.scheduler.DoNextAbility(sim, ...)`.

The third shape is the interesting one for this project, because a pre-computed GCD schedule is much
closer to what a closed-form rate model already is.

### Auras are the proc system, and they are cheap by design

`sim/core/aura.go:31`. An `Aura` carries a duration, a stack count, a priority, and six event
callbacks — `OnGain`, `OnExpire`, `OnStacksChange`, `OnCastComplete`, `OnSpellHitDealt`,
`OnSpellHitTaken`, `OnPeriodicDamageDealt`, `OnPeriodicDamageTaken` (`aura.go:66-77`).

The `auraTracker` (`aura.go:200`) keeps **separate slices per callback type** so that firing
`OnSpellHitDealt` iterates only the auras that have one (`aura.go:636`), and caches `minExpires`
(`aura.go:216`) so that `advance()` returns immediately when nothing can have expired
(`aura.go:375-378`). Both are performance decisions worth copying rather than rediscovering.

Flurry is the archetype (`sim/warrior/talents.go:279`): a 3-stack, never-expiring `procAura` that
multiplies melee speed on gain and divides it back on expire, driven by an outer aura whose
`OnSpellHitDealt` sets stacks to 3 on any melee crit (line 313) and removes one on a melee **white**
hit (line 319).

### Casting is a decorator chain

`sim/core/cast.go:68`:

```go
return spell.wrapCastFuncInit(config,
    spell.wrapCastFuncResources(config,
        spell.wrapCastFuncHaste(config,
            spell.wrapCastFuncGCD(config,
                spell.wrapCastFuncCooldown(config,
                    spell.wrapCastFuncSharedCooldown(config,
                        spell.makeCastFuncWait(config, onCastComplete)))))))
```

Each layer is built once at registration and is a no-op if the spell does not need it — a spell with
no cooldown gets no cooldown closure at all. Notable inside: a hard cast sets `Unit.Hardcast` and
calls `AutoAttacks.DelayAllUntil` so casting pushes the swing timer (`cast.go:322`), and the GCD is
`max(gcd, castTime + channelTime + afterCastDelay)` (`cast.go:195`).

### Resources are three separate bars with different physics

- **Energy** (`sim/core/energy.go`): `EnergyTickDuration = 2020ms`, `EnergyPerTick = 20.2` (lines
  10, 13) — 10/sec on average but arriving in **lumps**, which is why pooling is a real decision.
  Combo points live on the same struct (`energy.go:24`), capped at 5.
- **Rage** (`sim/core/rage.go`): generated from damage dealt, per swing.
- **Mana** (`sim/core/mana.go`): a periodic tick action started by `initManaTickAction`, plus the
  five-second rule set at `cast.go:265`.

### Attacks roll a single random number against a cumulative table

`sim/core/spell_outcome.go:117`, `OutcomeFuncMeleeWhite`:

```go
roll := sim.RandomFloat("White Hit Table")
if !spellEffect.applyAttackTableMiss(...) &&
   !spellEffect.applyAttackTableDodge(...) &&
   !spellEffect.applyAttackTableGlance(...) &&
   !spellEffect.applyAttackTableCrit(..., critMultiplier, &chance) {
    spellEffect.applyAttackTableHit(spell)
}
```

This is the same one-roll table `src/domain/simulation/attackTable.ts` already builds — the
difference is only that wowsims *samples* it and this project takes its expectation. **That
distinction costs nothing in the mean.** It matters only for variance and for anything that branches
on an outcome (Flurry, Seal Fate, Ignite, Windfury).

### DoTs snapshot

`sim/core/dot.go:115`, `TickFuncSnapshot`: the tick effect is built **once, when the DoT is applied**,
with the base damage frozen at that moment. This is the one mechanic in the whole engine that a
rate-based model structurally cannot reproduce — see the table below.

### Monte Carlo, and the cost of it

`sim.run()` (`sim.go:191`) calls `runOnce()` per iteration and aggregates. The UI default is
**3,000 iterations** (`ui/core/sim.ts:70`). Stat weights (`sim/core/statweight.go`) are a **finite
difference**: for each stat, two full sims at Iterations/2, one at +50 and one at −50 (+/−15 for hit
and expertise), and the weight is `(dps_perturbed - dps_baseline) / value`.

It runs in the browser as **Go compiled to WASM inside a Web Worker pool** — `ui/worker/sim_worker.js`
instantiates `lib.wasm`, `ui/core/worker_pool.ts` fans requests across workers. No backend. That is
worth stating plainly: **wowsims proves an event loop is compatible with this project's local-first,
browser, no-backend constraint.** What it does not prove is that it is compatible with this
project's *feature set*.

---

## 3. What the clock is worth, measured

wowsims' own pinned expected results run every spec at two fight lengths: `ShortDuration = 60`
seconds and `LongDuration = 300` seconds (`sim/core/test_utils.go:31-32`), both full-buffed, both
single-target, both against the same level-73 / 7,684-armor target. **A closed-form model has exactly
one answer where wowsims has two.** The ratio between them is a direct measurement of how much of a
spec is scheduling. **[read, all values from the `.results` files at `3301fca5`]**

| Spec (wowsims preset) | 300 s | 60 s | Short / long |
| --- | ---: | ---: | ---: |
| Priest Shadow, P1 Basic | 1312.3 | 1312.7 | **1.00x** |
| Druid Balance, P2 Adaptive | 1439.4 | 1448.4 | **1.01x** |
| Warrior Fury, P1 Basic (Human) | 938.1 | 1010.2 | 1.08x |
| Warrior Protection, P1 | 544.7 | 590.7 | 1.08x |
| Shaman Enhancement, **P2** Basic | 1975.6 | 2189.1 | 1.11x |
| Druid Feral, P1 Default | 2236.8 | 2473.0 | 1.11x |
| Rogue Assassination, P1 Mutilate | 1226.2 | 1447.6 | 1.18x |
| Warrior Arms, P1 Basic (Human) | 697.8 | 855.7 | 1.23x |
| Shaman Elemental, P1 Adaptive | 1574.8 | 1914.0 | 1.22x |
| Hunter, P1 Basic (Dwarf) | 1583.9 | 1956.6 | 1.24x |
| Rogue Combat, P1 Basic | 1408.8 | 1769.8 | 1.26x |
| Warlock Destruction, P4 | 1824.3 | 2307.7 | 1.26x |
| Paladin Retribution, P4 | 2118.4 | 2690.4 | 1.27x |
| Mage Frost, P1 FrostRotation | 1633.2 | 2215.9 | 1.36x |
| Mage Fire, P1 FireRotation | 1569.8 | 2356.3 | **1.50x** |
| Mage Arcane, P1 ArcaneRotation | 1352.1 | 2239.2 | **1.66x** |

Read this as a ceiling on what a clock buys per spec, not as the gap itself. Two things fall out:

1. **Shadow Priest and Balance Druid are fight-length invariant.** For those, an event loop buys
   essentially nothing over correct rate arithmetic — which is exactly what `ROTATION-SCOPE.md`
   already discovered for Shadow: stage 3 was scoped as needing a timeline and turned out to be forty
   lines of division.
2. **The Mage specs are the opposite**, and Arcane most of all. That is Arcane Blast's ramp:
   `sim/mage/arcane_blast.go:42` shortens the cast by `numStacks * (1/3)s` and line 39 multiplies the
   mana cost by `1 + 0.75 * numStacks`, with an 8-second, 3-stack aura (lines 17–18). On a 60-second
   fight you sit at 3 stacks and go out of mana at the end; on 300 seconds you cannot. **There is no
   single sustained rate**, and this project models the ability at its unstacked 2.5 s cast
   (`src/domain/abilities/signatureAbilitiesMage.ts:12`), whose own note already says so.

The owner's Hydross parse is **116 seconds** — nearer the short end. A model with no fight length is
implicitly answering a question the parse did not ask.

---

## 4. The mechanics table

What a closed-form model can and cannot express, and what each item is worth. Sizes are marked
[measured], [read] or [derived]; where I could not put a number on it, the row says so rather than
guessing.

### Group A — genuinely needs a clock

| Mechanic | Why closed form cannot express it | Worth |
| --- | --- | --- |
| **DoT snapshotting** | `sim/core/dot.go:115` freezes the tick effect at application. A DoT cast inside a trinket proc or Bloodlust keeps that damage for its whole duration. The value depends on the *joint distribution of proc state and cast time*, which has no rate expression. | Not determined. Largest for Affliction (five maintained DoTs) and Shadow. |
| **Execute phase** | `sim.executePhase` flips at `ExecuteProportion: 0.2` and warriors switch rotation entirely (`sim/warrior/dps/rotation.go:67`, `:197`). A closed form has no notion of "the last 20% of the fight". | Included in the 1.08x (Fury) / 1.23x (Arms) short-vs-long ratios above. |
| **Cooldown alignment against a finite fight** | Whether Bloodlust, Drums, Death Wish and a trinket land together, and how many times each fits, depends on fight length and on each other. This model averages Bloodlust to 34.51% uptime → 10.4% haste (`ROTATION-SCOPE.md`) with no fight length to scale by. | The whole short/long spread, 0% to 66% depending on spec. |
| **Ramp-and-dump resource cycles** | Arcane Blast (above); rogue energy pooling (`canPoolEnergy`, `sim/rogue/rotation.go:66`); warrior rage banking for Execute. Energy arrives in 20.2-point lumps every 2.02 s (`sim/core/energy.go:10,13`), so "can I afford a 60-energy Shred right now" is a question about phase, not about a mean. | Mage Arcane 1.66x; Rogue Combat 1.26x. |
| **Melee weaving / swing-timer coupling** | A cast delays the next swing (`cast.go:322` → `AutoAttacks.DelayAllUntil`), and rotations are written to avoid paying that cost. wowsims' `Dwarf-P1-MeleeWeave` hunter reads **1843.6** against `Dwarf-P1-Basic`'s **1583.9** at 300 s — the same character, a different weave. | **+16.4%** for a hunter [derived from the two `.results` keys]. |
| **Variance** | A distribution, a percentile, or "how often does this build beat that one" cannot come from an expected value at all. | Not a DPS gap; a missing *feature*. `featureFlags.ts` already discloses it. |

### Group B — expressible closed form, but only by solving an optimisation the clock does for free

| Mechanic | The closed form | Why it is hard anyway |
| --- | --- | --- |
| **Rogue builder/finisher mix** | Energy income and GCD budget are both rates; Slice and Dice, Rupture and Eviscerate each have a known cost in energy, GCDs and combo points, and a known return. It is a linear program with a fixed point (Slice and Dice's haste raises off-hand swings, which raises Combat Potency energy, which funds more finishers). | `ROTATION-SCOPE.md` already found the trap: `resolveRotation` spends its budget **greedily in priority order**, so a second same-resource ability *moves* damage rather than adding it. Getting the mix right is an optimisation; a priority list on a clock finds it by construction. |
| **Feral energy + bleeds** | Same shape. `ROTATION-SCOPE.md` measured Shred at 11.8 damage/energy against Mangle's 10.6 and correctly refused to add Mangle alone. | Same. Rake and Rip change the answer, and the repo already knows it. |
| **Warrior rage allocation** | Already partly built: `rageDumpUsesPerSecond` solves Heroic Strike's rate against surplus rage including the swing it displaces. | The existing model deliberately does **not** cap rage-costed cooldowns by income (see the long comment at `calculateSimulation.ts:531`), which is honest but means the budget is not actually balanced. |

### Group C — expressible closed form and simply not built

This is the group the measurements say is largest, and it is why the recommendation is staged the way
it is.

| Mechanic | Status here | Worth |
| --- | --- | --- |
| **Gems and enchants in the calibration harness** | Not applied at all (`defaultGear.ts:32`; harness reads neither `recommendedGemIds` nor `recommendedEnchantId`). | **+9.5% to +16.4%, mean +12.5%** [measured] |
| **Second ring and trinket in the harness** | BiS data files paired slots under `Finger 1` / `Trinket 1` deliberately (`bisLists.ts:149`), and the harness's `rank !== 1` filter never reaches the rank-2 entry. | **+3.5% mean on top of the above** [measured] |
| **Weapon-enchant procs** | **0 of 91 enchants carry an `effect` field.** `Weapon - Mongoose` — the recommended main-hand for Enhancement, Combat Rogue and Retribution, and off-hand for Enhancement — has `stats: {}`. `Weapon - Executioner` and `Deathfrost` likewise. The reference parse measures Mongoose at **53.48% uptime over 10 procs**. | Currently exactly **0 DPS** [measured]. `effectUptime` already exists to price it. |
| **Damage-proc trinkets** | 49 item effects ingested, **48 skipped**: "Damage procs, mana returns and mob-type conditionals are skipped rather than approximated" (`tools/ingest/ingest-item-effects.mjs:261`). Stat procs are averaged over uptime and do land. | Not determined per spec. A PPM damage proc is `ppm/60 × avgDamage`, which is arithmetic. |
| **Pets** | No pet concept anywhere in `src/features/simulator` or `src/domain/simulation` [measured by grep]. Six of Beast Mastery's talents are refused by name and **all six are pet talents** — Ferocity, Animal Handler, Unleashed Fury, Frenzy, Focused Fire, The Beast Within [measured]. The Demonology ability notes already say "a large share of its damage comes from the pet". | **~28% of a BM hunter's damage** [derived, flagged: the model gives BM 1.10x Marksmanship where the references give 1.54x, so BM carries ~40% more damage than the shared model sees; 0.40/1.40 = 28%. This is an attribution, not a measurement]. A pet is a second closed-form actor, not a timeline. |
| **Slice and Dice** | Not modelled. `sim/rogue/slice_and_dice.go:64` — **×1.3 melee attack speed** (×1.35 with Slayer's 2pc), 25 energy, 9–21 s by combo points. A Combat rogue holds it near 100%. | Not determined; it multiplies all white and poison damage, which is most of the spec. |
| **Rogue poisons** | Not modelled. Deadly Poison: 30% + 2%/point per landed hit, 5 stacks, `180/4` per tick every 3 s over 12 s (`sim/rogue/poisons.go:48,61,76`). Instant Poison is PPM. | Not determined. Both are rate arithmetic once the landed-hit rate is known, which this model already computes. |
| **Combat Potency** | Not modelled. 20% of off-hand hits return **3 energy per point** (`sim/rogue/talents.go:282-283`), so 15 at 5/5. | `ENERGY_PER_SECOND` is a hard 10 (`specialAttacks.ts:9`). At a hasted 1.15 s off-hand that is ~+2.6 energy/sec, **+26% energy income** [derived from the two constants]. |
| **Deep Wounds** | Refused by name for Arms [measured]. `sim/warrior/deep_wounds.go:33,44,45,48` — a 12 s, 4-tick DoT whose per-tick base is `MH.AverageDamage()` (the weapon roll alone, `attack.go:105`) times `DamageMultiplier: 0.2 × rank`, refreshed by any melee crit. | Shape is closed form — at raid crit rates uptime is ~100%, so it is a flat DPS term. **The magnitude I could not settle**: read literally the multiplier applies *per tick*, giving 2.4× the weapon roll over 12 s at 3/3, where the tooltip wording is 60% of weapon damage in total. Source it before implementing. |
| **Windfury Totem** | `notModelled` (`src/domain/buffs/sampleBuffs.ts`): "each hit has a 20% chance of granting the attacker one extra attack with 445 extra attack power" [measured, 12 of 33 buffs are unmodelled]. | Same shape as `weaponImbues.ts`, which is already built and tested. |
| **Expose Weakness** | `notModelled` (2 of 8 target debuffs are) [measured]. wowsims' own preset applies it at **80% uptime from an 800-Agility hunter** (`presets.go`, `FullDebuffs`) = 25% of Agility as attack power to everyone. | A flat attack-power debuff — the same shape `physicalHitTakenBonus` already uses. |
| **Flurry uptime** | Modelled, as a Markov chain over white swings (`talentModifiers.ts:321`), deliberately as a lower bound because specials refresh stacks without consuming them. | At 38.8% crit the chain gives **77.1% uptime → ×1.2164** speed; the parse measured **94.16% → ×1.2776** [derived + read]. A **~5% understatement of swing rate**, compounding into Windfury. Fixable by extending the same chain to include specials — still closed form. |
| **Elemental Weapons** | Refused (no ingested effect). ×13.33% Windfury damage per point (`sim/shaman/weapon_imbues.go:29`). | At 3/3 on the modelled 295.8 Windfury DPS that is **+118 DPS** for Enhancement [derived]. |
| **Earth Shock, Flame Shock, Fire Nova, Flamecap** | Modelled at zero. | **150.3 DPS, 8.8% of the parse** [read, `ROTATION-SCOPE.md`]. Blocked on spell school, which the repo already prices as a prerequisite. |
| **Spell school** | Not modelled anywhere. Blocks Sanctity Aura (+10% Holy), Winter's Chill, Shadow Weaving, Ignite, Ruin, and every shock above. | Not determined; it is a prerequisite rather than a value. |

---

## 5. Recommendation, with the reasoning

**Build a two-tier engine. Do Group C first, and do not start with the loop.**

The reasoning, in the order it actually moved me:

**1. The gap is not mostly the clock.** The best-case shortfall is 1.19x–2.27x. The clock's ceiling,
from wowsims' own results, is 1.00x–1.11x for five of the six specs where a real Phase 2 preset
exists, and 1.19x–1.36x for most of the rest. Only the Mage specs are dominated by scheduling. If you
built a perfect event loop and changed nothing else, most of the table would still be low.

**2. The largest single item is a harness bug.** Gems, enchants and two gear slots are worth 16%
combined, measured, and cost nothing but plumbing. Anything that starts with an engine rewrite spends
its first weeks not fixing that.

**3. This project's shape is not wowsims' shape.** wowsims answers one question — "what does this
build do" — and can afford 3,000 iterations to answer it. This app answers three: that one, plus
"which stat is worth more" and "which of 2,700 items should I equip next", both of which run live in
a `useMemo` on every gear change. Measured today: `calculateSimulation` costs **0.003–0.133 ms** per
call, `calculateStatWeights` completes in **under 1 ms** over 6–8 probes, and `findUpgrades` walks
**2,308–2,712 candidates in 58–93 ms** [measured]. Replacing the scorer replaces all three.

**4. But an event loop is affordable for the headline number, and by a wide margin.** I wrote a
minimal discrete-event melee sim in plain JavaScript — sorted pending-action list, aura tracker with
`minExpires` caching, two swing timers, a Flurry-shaped charge aura, a rage bar, a priority rotation,
a refreshed DoT and a proc roll — deliberately copying `sim.go`'s shape. Measured on this machine
under Node 24: **1,124 events per 300-second iteration, 81 ns per event, 0.092 ms per iteration, and
3,000 iterations in 275 ms.** Per-iteration DPS had a coefficient of variation of **2.90%**, giving a
standard error of the mean of **0.092% at n=1000** and **0.053% at n=3000** [measured — and flagged:
this is a toy, its variance is lower than a real sim's because it has fewer random cooldowns and no
fight-length variation, so treat the timing as indicative and the variance as a floor].

Even at ten times that cost, a full Monte Carlo run is **~2.5 seconds**. That is a button, not a
blocker. What it is not is 2,700 buttons.

**5. Monte Carlo also breaks the upgrade finder statistically, not just temporally.** The finder
ranks items whose DPS deltas are often a fraction of a percent. At the 2.90% per-iteration CV
measured above, the noise on the *difference* of two independent 3,000-iteration runs is **0.077% of
DPS** [derived: `CV × √2 / √n`]. So two candidates 0.25% apart are ordered confidently, two 0.08%
apart are a coin flip, and resolving that second pair to 3σ would take **~64,000 iterations each**
[derived]. At a more realistic 5% CV those thresholds roughly double. Common random numbers — the
same seed for baseline and candidate — would cut this a great deal, and wowsims does not use them
outside its test harness. But the sound answer is not to rank 2,700 items with a sampler at all.

**6. The test suite is far less of an obstacle than it looks.** 203 tests, of which **30 call
`calculateSimulation`** and only **2 pin an absolute DPS figure** — `expect(empty.score).toBe(215.3)`
and `expect(after.score).toBe(254.7)`, both the Fury Warrior reference in the talent tests
[measured]. Everything else is relational: `toBeGreaterThan(without.scoreExact)`,
`toBe(other.scoreExact)`, `perPoint` is zero for unmodelled stats. **The suite pins relations and
invariants, not magnitudes.** A change that moves every number but preserves the orderings breaks two
assertions, not two hundred.

### The case against, stated fairly

The strongest argument for going straight to the loop is that Group C items keep arriving one at a
time and each one is a bespoke derivation, while an event loop makes them all fall out of one
mechanism. That is true, and it is why the answer is not "never". It is a sequencing argument, not a
refusal: the loop is the right destination and the wrong first step, because the first step has to be
the thing that both closes the most error and de-risks the loop — and that thing is a per-source
damage breakdown you can check against a parse.

The second argument against staging is that two engines can disagree, and a planner that shows one
number in the stat rail and a different one behind the Run button is exactly the "two surfaces
disagree by design" problem this repo already fixed once for talents. That is a real risk and it has
to be designed around rather than accepted: the analytic scorer must be *calibrated against* the loop
per spec, not left to drift, and the interface must say which one produced which number.

---

## 6. Migration path

Six stages. Each is independently shippable, each buys something on its own, and the loop does not
appear until stage 4.

### Stage 1 — Fix the harness and the enchant data *(no engine change)*

- Apply `recommendedGemIds` and `recommendedEnchantId` in `bestCaseSimulation`, and fill Finger 2 /
  Trinket 2 from the rank-2 paired entry.
- Give `Weapon - Mongoose`, `Weapon - Executioner` and `Deathfrost` real effects, using the
  `ItemEffect` shape and `effectUptime` that already exist.
- Pin the calibration range with an assertion so `featureFlags.ts`'s "1.4x to 3.1x" cannot rot again.

**Buys: mean shortfall 1.96x → 1.69x, measured. Cost: hours.**

### Stage 2 — A per-source damage breakdown, and a parse to check it against

Today `SimulationResult.breakdown` is a mix of inputs (attack power, crit chance) and outputs
(`Stormstrike DPS`, `Windfury Weapon DPS`). Make the output half a first-class, complete
decomposition: every source, its DPS, and its share — the same shape a Warcraft Logs damage table
has.

This is the stage that makes everything after it checkable. `ROTATION-SCOPE.md`'s Hydross table is
the model: it found that white damage was 3.2x low and Windfury 5.7x low, which is a completely
different piece of information from "the total is 3.3x low".

**Buys: every later stage becomes falsifiable per source instead of per total. Cost: small.**

### Stage 3 — Work the Group C list against that breakdown

In leverage order, each one a closed-form addition to the existing engine, each landed with the
falsification test `ROTATION-SCOPE.md` already established (removing the addition must reproduce the
previous number exactly):

1. **Pets** — a second actor with its own attack table and attack power. Largest single item, and it
   is not a timeline problem. Unblocks six refused Beast Mastery talents.
2. **Slice and Dice, poisons, Combat Potency** — the three that make a Rogue a Rogue. All rate
   arithmetic; the fixed point (haste → off-hand swings → energy → finishers → haste) converges in
   three or four passes.
3. **Weapon-enchant and damage-proc item effects** — `effectUptime` for the stat ones is built; a
   PPM damage proc needs `ppm/60 × avgDamage × attackTable`.
4. **Windfury Totem, Expose Weakness, Deep Wounds, Elemental Weapons** — four buffs/talents of shapes
   this codebase already has.
5. **Flurry with specials in the Markov chain** — closes a measured ~5% swing-rate understatement.
6. **Spell school** — the prerequisite the repo has already priced, unblocking the shocks, Sanctity
   Aura, Winter's Chill, Shadow Weaving, Ignite and Ruin.

**Buys: most of the remaining gap for the physical specs, on my reading of the table. Cost: the bulk
of the work, and it is the same bulk either way — an event loop still needs every one of these
implemented, just as callbacks instead of terms.**

### Stage 4 — The event loop, behind the Run button only

Build `src/domain/simulation/engine/` as a new module. `calculateSimulation` is untouched.

Port order, following what `sim/core` actually needs, and skipping what this project does not:

| Port | From | Skip |
| --- | --- | --- |
| `Sim` with a pending-action queue | `sim.go:258–337` — `runOnce`, `AddPendingAction`, `advance`, ~80 lines | Health-based fights, presims, raid-wide simulation |
| `PendingAction` + the five priorities | `pending_action.go` (~46 lines) | — |
| `Aura` + `auraTracker` with per-callback slices and `minExpires` | `aura.go` | Threat metrics, the proto layer |
| `Spell` + the cast decorator chain | `spell.go`, `cast.go` | Healing, pets-as-owners (until stage 5) |
| Attack-table sampling | `spell_outcome.go` — **reusing this repo's existing `attackTable.ts` probabilities**, sampled rather than averaged | Crushing blows, incoming attacks |
| Resource bars | `energy.go`, `rage.go`, `mana.go` | Combo points can wait for the rogue rotation |
| `Dot` with snapshotting | `dot.go` | AoE tick variants |

Consider a real binary heap rather than wowsims' O(n) sorted slice insert. I did not profile the toy
to confirm the queue dominates, so this is insurance rather than a measured need — but the queue is
the one structure every event touches, and a heap costs an afternoon to write once.

Run it in a **Web Worker** with the same shape wowsims uses (`ui/core/worker_pool.ts`), so a 2-second
run does not freeze the planner. This is the only UI change stage 4 needs: the Run button becomes
async and gets a progress bar.

**Buys: fight length, execute phases, cooldown alignment, snapshotting, variance, and a DPS
distribution rather than a point. Cost: this is the big one — see §7.**

### Stage 5 — Rotations per spec, on the loop, one spec at a time

Twenty specs, but they need three shapes, not twenty: a priority list (warriors, paladins, hunters,
shamans), a plan machine (rogues, feral), and a maintained-DoT-plus-filler (warlocks, shadow) which
this project has **already built analytically** in `resolveCasterRotation` and which the wowsims
Enhancement pre-computed-schedule pattern also fits.

Gate each spec: the loop's answer is only shown for a spec whose rotation has been written and whose
result has been checked against the archon reference. Every other spec keeps showing the analytic
number. `featureFlags.ts` already has the vocabulary for this.

### Stage 6 — Calibrate the analytic scorer against the loop, and keep them honest

The analytic scorer stays as the ranking engine. Add a test that asserts, per spec, that the two
agree within a stated tolerance at a stated reference build — and when they diverge, that is a real
finding about the analytic model rather than a tolerance to widen.

This is what stops the two-tier design becoming the "two surfaces disagree by design" trap. It is
also where the loop pays back into the fast path: the loop can *derive* the correction factors the
analytic model needs (Flurry's real uptime, a spec's real cooldown share) instead of them being
judged.

---

## 7. What it would cost

Sizing, in units of "an experienced session on this codebase". These are estimates and should be read
as such; the two anchors under them are real.

| Stage | Size | Anchor |
| --- | --- | --- |
| 1. Harness + enchant data | **Hours** | Measured: +16% for a change with no new mechanism |
| 2. Per-source breakdown | **~1 session** | `SimulationResult.breakdown` already exists; this restructures it |
| 3. Group C list | **6–10 sessions** | Comparable items already landed at roughly one session each: Windfury (`2327873`), Paladin seals (`0b1f1a0`), Affliction DoTs (`e4d3343`), Shadow (`58a9b42`) |
| 4. The event loop core | **3–5 sessions** | The engine machinery in `sim/core`, excluding its data files and item DB, is 36 files / ~286 KB of Go. The subset above is maybe a third of that, and TypeScript is not more verbose than Go for this |
| 5. Rotations, per spec | **0.5–1 session each**, 20 specs | wowsims' 15 rotation files run 2.2 KB (Smite Priest) to 14.6 KB (Hunter), median 7.0 KB |
| 6. Calibration harness between tiers | **~1 session** | The existing calibration test is the template |

**What has to be built first, in dependency order:**

1. **Per-source breakdown** (stage 2) — nothing after it is checkable without it.
2. **Spell school** — already blocking three separate things by the repo's own count. It is a
   prerequisite for stages 3 and 5, and it is cheaper to add before the loop than inside it.
3. **A worker boundary** — stage 4 needs `calculateSimulation`'s inputs to be serialisable across a
   `postMessage`. They nearly are (`CharacterProfile`, `EquippedGear`, `StatBlock`, id arrays), but
   `EquippedGear` holds whole `GearItem` objects; sending ids and rehydrating inside the worker is
   the cheaper shape and should be decided before the loop is written, not after.
4. **A seeded RNG with per-callsite streams** — wowsims' `RandomFloat(label)` trick (`sim.go:129`)
   gives reproducible tests that survive reordering. Worth copying on day one; retrofitting it is
   miserable.

**What does *not* have to be built:** raid-wide simulation, healing, threat, tank survivability on
the loop, or anything for the 5 Healer and 2 Tank specs. DPS-only and Phase-2-only both cut real
scope here.

---

## 8. What I could not determine

Stated plainly, because the failure this repo keeps repeating is confident prose that turned out
false.

- **I did not run wowsims.** Every wowsims number here is read from a checked-in `.results` file or
  from source at `3301fca5`. I did not build the Go binary, so I cannot confirm those results
  reproduce, and I could not produce a per-source damage breakdown for any spec — which is the one
  thing that would settle how the remaining gap divides between Group B and Group C.

- **Only Enhancement and Balance have a Phase 2 preset upstream.** Every other short/long ratio in §3
  is P1 or P4 gear. Fight-length sensitivity plausibly changes with gear (more haste, more procs,
  different mana budgets), so those ratios are indicative for Phase 2, not measured for it.

- **The pet share is an attribution, not a measurement.** The 28% figure is derived from the ratio of
  two ratios (model BM/MM vs reference BM/MM) and assumes the only material difference between the
  two specs that the model cannot see is the pet. That is plausible — six refused BM talents, all pet
  talents — and it is not proof. Demonology's pet share I could not bound at all: Demonology and
  Destruction read 2.15x and 2.13x, which is too close to separate a pet from a rotation.

- **Deep Wounds' magnitude reads 4x the tooltip and I could not settle which is right.**
  `sim/warrior/deep_wounds.go` applies `DamageMultiplier: 0.2 × rank` to a flat per-tick base of the
  main hand's average weapon roll, across 4 ticks — which is 2.4× the weapon roll at 3/3, against a
  tooltip that says 60% total. Either wowsims is applying a total as a per-tick value, or
  `TickFuncApplyEffects` divides somewhere I did not find. Do not implement from my reading; read it
  again.

- **I could not price Slice and Dice, poisons, or the damage-proc trinkets.** All three need the
  Group C work to exist before their contribution can be measured, and estimating them from TBC
  recollection is exactly what this repo's evidence standard forbids. I have given the upstream
  constants instead.

- **The event-loop benchmark is a toy.** 0.092 ms per 300-second iteration is real and reproducible,
  but my prototype has ~6 event sources where a real Fury warrior has perhaps 15–20, no metrics
  aggregation, no spell registry, and no target. I would expect a real engine at 3–10x that cost,
  which is where the "~2.5 seconds for 3,000 iterations" figure in §5 comes from — that is a
  judgement, not a measurement. Its variance is also almost certainly understated: no fight-length
  variation, few random cooldowns.

- **I did not verify that the analytic and loop tiers can be kept in agreement.** §6 stage 6 asserts
  it as a design requirement. Whether the analytic scorer can track the loop closely enough for the
  upgrade rankings to stay trustworthy is an open empirical question, and it is the single biggest
  risk in the recommendation. If it cannot, the fallback is to rank gear on the analytic tier and
  label it as an approximation rather than as the same number — which is worse, and survivable.

- **I did not check whether Web Workers work under this deployment.** The app is served from GitHub
  Pages under a subpath (`/project-defeat/`), and Vite's worker bundling plus that base path is a
  known source of 404s. It is very likely fine; I did not test it.

- **The 2,700-candidate figure for `findUpgrades` is per spec and includes every slot.** I did not
  check how much of that the spread filter (`findUpgrades.ts:223`) discards before scoring, so the
  "eleven minutes" figure in the executive summary is an upper bound on the *scoring* loop, not a
  measurement of the whole function under a loop-based scorer.

- **`ROTATION-SCOPE.md`'s claim that stage 4 "most resembles building an event loop" is one I now
  think is half wrong**, and I could not settle it. Rogue energy is a rate problem *on average* —
  what a clock buys is the pooling granularity and the optimisation. I could not measure how much of
  Combat's 1.26x short/long ratio is pooling versus cooldown alignment (Adrenaline Rush, Blade
  Flurry), and those want opposite conclusions.

---

## 9. Incidental findings

Two things found while measuring, neither of which belongs to this question.

- **The simulation breakdown shows a "Rage per second" row for classes with no rage.** Measured at
  best case: Rogue Combat 12.3, Shaman Enhancement 15.2 — both rendered verbatim by
  `SimulatorPanel.tsx:84`. `calculatePhysicalDps` builds a `MeleeSwingContext` for every non-Hunter
  melee spec and the display guard checks only `> 0`, never the class. Flagged as a separate task.

- **`src/featureFlags.ts` is carrying a fourth stale disclosure**: "1.4x to 3.1x low" against a
  measured 1.4x to 2.6x. Unlike the three claims that file says are pinned, this one has no
  assertion behind it. Correcting it without writing the assertion would, on this repo's own
  evidence, buy about a day.

---

## Appendix — wowsims files worth reading, in order

For anyone picking up stage 4. Sizes at `3301fca5`.

| File | Bytes | Why |
| --- | ---: | --- |
| `sim/core/pending_action.go` | 946 | The whole event abstraction. Read first. |
| `sim/core/sim.go` | 10,427 | `runOnce`, `AddPendingAction`, `advance` — lines 258–337. That is the whole scheduler. |
| `sim/core/agent.go` | 5,740 | The interface a spec implements; four of its ten methods are timeline hooks. |
| `sim/core/aura.go` | 22,845 | Auras and the callback dispatch. The `minExpires` cache at :375 is the perf trick. |
| `sim/core/cast.go` | 10,440 | The decorator chain; hardcasts delaying swings. |
| `sim/core/spell.go` | 11,692 | Spell registration and metrics. |
| `sim/core/dot.go` | 4,803 | Snapshotting. Short and important. |
| `sim/core/attack.go` | 22,283 | Swing timers, `ReplaceMHSwing`, OH delay. |
| `sim/core/energy.go` | 4,491 | The 20.2-per-2.02s tick and combo points. |
| `sim/common/gcd_scheduler.go` | 8,963 | The pre-computed-schedule pattern — closest to what this project already does. |
| `sim/warrior/dps/rotation.go` | 8,387 | A priority list that reads swing timers. |
| `sim/rogue/rotation.go` | 9,715 | A plan machine. |
| `sim/core/statweight.go` | 13,783 | Why finite-difference stat weights are expensive. |
| `ui/core/worker_pool.ts` | — | How it runs in a browser with no backend. |
