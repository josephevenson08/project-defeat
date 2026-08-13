---
type: module
layer: domain
source: src/domain/simulation/rageModel.ts
lines: 150
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.rageModel

`src/domain/simulation/rageModel.ts` · **domain** layer · 150 lines

From the top of the file:

> Rage income from auto attacks.
> 
> Rage was the one resource `computeUsageRate` could not turn into a sustained rate, so every
> rage-costed ability without a cooldown reported `unmodelled` and contributed nothing — Heroic
> Strike, which is a large slice of real Fury damage, most of all. The blocker was never the
> arithmetic; it was that nothing computed rage *income*. This does.
> 
> Every constant below is read from wowsims/tbc `sim/core/rage.go` at the same commit the item
> catalogue is pinned to (3301fca5), not from recall:
> 
> ```go
> const RageFactor = 274.7
> HitFactor = 3.5 / 2   // main hand;  1.75 / 2 off hand
> if crit { HitFactor *= 2 }
> generatedRage = damage*(3.75/RageFactor) + HitFactor*BaseSwingSpeed*rageMultiplier
> ```
> 
> Four details from that source that a from-memory implementation gets wrong:
> 
> - **A miss generates nothing at all**, but a **dodge or parry still generates rage**, computed on
>   the damage the swing *would* have done. wowsims swaps in `PreoutcomeDamage` for exactly this.
> - **The hit-factor term uses the weapon's base swing speed**, not its hasted speed. Haste raises
>   rage income by swinging more often, not by making each swing worth more.
> - **Main-hand specials generate no rage.** The rage aura returns early on
>   `ProcMaskMeleeMHSpecial`, which is what makes Heroic Strike suppress the rage of the swing it
>   replaces — see `HEROIC_STRIKE_SUPPRESSES_SWING_RAGE`.
> - **`damage` is damage actually dealt**, so it is post-armor. Feeding this pre-mitigation damage
>   overstates rage income by the whole armor mitigation, which against a raid boss is roughly a
>   third.

## Exports

**function** — `rageDumpUsesPerSecond`, `rageFromOneSwing`, `ragePerSecondFromWeapon`

**const** — `HEROIC_STRIKE_SUPPRESSES_SWING_RAGE`, `MAIN_HAND_HIT_FACTOR`, `MAX_RAGE`, `OFF_HAND_HIT_FACTOR`, `RAGE_CONVERSION_FACTOR`, `RAGE_MULTIPLIER_UNTALENTED`, `RAGE_PER_POINT_OF_DAMAGE`

**type** — `SwingOutcomeMix`, `WhiteSwingRageInput`

## Imports

- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
