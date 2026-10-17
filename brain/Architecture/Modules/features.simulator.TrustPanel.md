---
type: module
layer: features
source: src/features/simulator/TrustPanel.tsx
lines: 62
generated: true
tags: [brain/architecture, layer/features]
---

# features.simulator.TrustPanel

`src/features/simulator/TrustPanel.tsx` · **features** layer · 62 lines

From the top of the file:

> "How far to trust it": every DPS spec's best case by this model against what players of it average.
> 
> The best cases are worked out here, from the same function the calibration test in
> `tests/planner.spec.ts` pins the range with, so the panel and the test cannot disagree. Your spec's
> row is marked; healers and tanks, who have no reference, see the table without a mark.

## Exports

**function** — `TrustPanel`

## Imports

- [[domain.simulation.dpsReference]] — `src/domain/simulation/dpsReference.ts`
- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.simulator.bestCase]] — `src/features/simulator/bestCase.ts`
- [[features.simulator.simFormat]] — `src/features/simulator/simFormat.ts`

## Imported by

- [[features.simulator.TheEstimate]] — `src/features/simulator/TheEstimate.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
