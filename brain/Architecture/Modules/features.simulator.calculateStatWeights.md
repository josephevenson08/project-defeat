---
type: module
layer: features
source: src/features/simulator/calculateStatWeights.ts
lines: 188
generated: true
tags: [brain/architecture, layer/features]
---

# features.simulator.calculateStatWeights

`src/features/simulator/calculateStatWeights.ts` · **features** layer · 188 lines

From the top of the file:

> How much of a stat to add when probing its value. Large enough that the resulting metric change
> large enough to stay well clear of floating-point noise while small
> enough to stay in a roughly linear part of the curve. Results are divided back down to per-point.

## Exports

**function** — `calculateStatWeights`

**type** — `StatWeightEntry`, `StatWeightsResult`

## Imports

- [[domain.simulation.encounterTypes]] — `src/domain/simulation/encounterTypes.ts`
- [[domain.talents.talentModifiers]] — `src/domain/talents/talentModifiers.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`
- [[features.stats.statsTypes]] — `src/features/stats/statsTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.simulator.StatWeightsPanel]] — `src/features/simulator/StatWeightsPanel.tsx`

## Concepts & phases

- [[Stat Weights]]
- [[Phase 4 - Simulation]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
