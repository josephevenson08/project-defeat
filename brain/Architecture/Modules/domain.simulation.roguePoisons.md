---
type: module
layer: domain
source: src/domain/simulation/roguePoisons.ts
lines: 137
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.roguePoisons

`src/domain/simulation/roguePoisons.ts` · **domain** layer · 137 lines

From the top of the file:

> Rogue poisons, which are the first thing on the physical path that is neither physical nor a swing.
> 
> **They roll on the spell table and they are Nature damage**, which makes them the second
> unmitigated source this model has after Retribution's seals — and the reason that distinction was
> built. A poison that took armour mitigation would lose about a quarter of itself silently against
> this app's 7,700-armour target.
> 
> Every constant is read from wowsims/tbc `sim/rogue/poisons.go` at the pinned commit 3301fca5, and
> the hand each poison sits on from `sim/rogue/presets.go`.

## Exports

**function** — `estimateRoguePoisons`

**const** — `DEADLY_POISON`, `DEADLY_POISON_HAND`, `IMPROVED_POISONS_PER_RANK`, `INSTANT_POISON`, `INSTANT_POISON_HAND`, `MASTER_POISONER_HIT_PER_RANK`, `VILE_POISONS_PER_RANK`

**type** — `RoguePoisonEstimate`, `RoguePoisonInput`

## Imports

_None._

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
