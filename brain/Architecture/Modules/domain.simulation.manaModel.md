---
type: module
layer: domain
source: src/domain/simulation/manaModel.ts
lines: 92
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.manaModel

`src/domain/simulation/manaModel.ts` · **domain** layer · 92 lines

From the top of the file:

> What a caster's mana actually does, so a healing estimate stops pretending mana is free.
> 
> `calculateHealing` reported an HPS with no mana term at all — a healer who casts forever. That is
> the single largest reason the Simulation tab is hidden. Every constant here is read from
> wowsims/tbc `sim/core/mana.go` at the commit the item catalogue is pinned to:
> 
> ```go
> MP5ManaRegenPerSecond()    = stats[MP5] / 5.0
> SpiritManaRegenPerSecond() = 0.001 + Spirit*sqrt(Intellect)*0.009327
> AddStat(stats.Mana, 20-15*20); Mana += Intellect*15
> ```
> 
> **The important one is what happens while casting.** wowsims computes casting regen as MP5 alone
> and only adds a share of Spirit regen when `SpiritRegenRateCasting` is non-zero — and that comes
> from talents (Meditation and its equivalents), which this project does not model. So for an
> untalented healer mid-cast, **Spirit contributes nothing and MP5 is the entire regen**. That is a
> real TBC property rather than a modelling shortcut, and it is why Spirit prices near zero here.

## Exports

**function** — `computeManaBudget`, `manaFromIntellect`, `mp5RegenPerSecond`, `spiritRegenPerSecond`

**const** — `MANA_PER_INTELLECT`, `MP5_INTERVAL_SECONDS`

**type** — `ManaBudget`

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
