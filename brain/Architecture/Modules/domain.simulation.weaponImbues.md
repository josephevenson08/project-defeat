---
type: module
layer: domain
source: src/domain/simulation/weaponImbues.ts
lines: 154
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.weaponImbues

`src/domain/simulation/weaponImbues.ts` · **domain** layer · 154 lines

From the top of the file:

> Windfury Weapon — where most of an Enhancement shaman's damage actually comes from.
> 
> The spec's own signature ability says so in its notes: Stormstrike is on a 10s cooldown and is a
> small share of the output, while "Enhancement damage is dominated by Windfury Weapon procs on
> white swings". Until this existed, that sentence described a gap rather than a model.
> 
> **A weapon imbue is not a rotational ability**, which is why this is not a `SignatureAbility`.
> There is no button and no usage rate to defend — the rate falls out of how often the main hand
> swings and lands. `ROTATION-SCOPE.md` originally filed Enhancement under "gets its second and
> third buttons"; it does not need one, it needs this.
> 
> Every constant below is read from wowsims/tbc `sim/shaman/weapon_imbues.go` at the pinned commit
> 3301fca5, not from the tooltip, because the tooltip states neither the internal cooldown nor the
> behaviour of the extra attacks.

## Exports

**function** — `estimateWindfury`

**const** — `WINDFURY_BONUS_ATTACK_POWER`, `WINDFURY_EXTRA_ATTACKS`, `WINDFURY_INTERNAL_COOLDOWN_SECONDS`, `WINDFURY_PROC_CHANCE`

**type** — `WindfuryEstimate`, `WindfuryInput`

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
