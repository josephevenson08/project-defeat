---
type: module
layer: domain
source: src/domain/simulation/specialAttacks.ts
lines: 155
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.specialAttacks

`src/domain/simulation/specialAttacks.ts` · **domain** layer · 155 lines

From the top of the file:

> Energy regenerates at a flat 20 per 2s tick in TBC, i.e. 10/second, with no haste scaling. That
> fixed rate is what makes an energy-cost ability's sustained frequency computable at all — rage and
> mana have no equivalent, which is why those are not modelled here.

## Exports

**function** — `averageSwingDamage`, `computeSpecialDamagePerUse`, `computeUsageRate`, `estimateSpecialAttack`, `normalizedSpeedForWeapon`

**const** — `ENERGY_PER_SECOND`, `NORMALIZED_SPEEDS`

**type** — `SpecialAttackEstimate`, `SpecialUsageBasis`

## Imports

- [[domain.abilities.index]] — `src/domain/abilities/index.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
