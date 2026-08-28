---
type: module
layer: domain
source: src/domain/simulation/sliceAndDice.ts
lines: 144
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.sliceAndDice

`src/domain/simulation/sliceAndDice.ts` · **domain** layer · 144 lines

From the top of the file:

> Slice and Dice, and the energy economy that pays for it.
> 
> **A finisher that deals no damage at all**, which is why it fits nowhere in `SignatureAbility`: it
> spends 25 energy and five combo points to make the rogue swing 30% faster for a while. The repo's
> ability schema describes things that hit; this describes something that changes how often
> everything else does. It lives here for the same reason `weaponImbues.ts` does — a buff folded into
> white damage rather than layered on top of it.
> 
> Every constant is read from wowsims/tbc `sim/rogue/slice_and_dice.go` and `sim/rogue/talents.go`
> at the pinned commit 3301fca5.

## Exports

**function** — `combatPotencyEnergyPerSecond`, `estimateSliceAndDice`

**const** — `COMBAT_POTENCY_ENERGY_PER_RANK`, `COMBAT_POTENCY_PROC_CHANCE`, `RELENTLESS_STRIKES_ENERGY`, `SLICE_AND_DICE_BASE_DURATIONS`, `SLICE_AND_DICE_COMBO_POINTS`, `SLICE_AND_DICE_ENERGY_COST`, `SLICE_AND_DICE_GCD_SECONDS`, `SLICE_AND_DICE_HASTE`

**type** — `SliceAndDiceEstimate`, `SliceAndDiceInput`

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
