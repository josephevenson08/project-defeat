---
type: module
layer: features
source: src/features/professions/CraftingProgression.tsx
lines: 108
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.CraftingProgression

`src/features/professions/CraftingProgression.tsx` · **features** layer · 108 lines

From the top of the file:

> One computed step: what to make, how many, and the shopping list for the whole step.
> 
> **The craft count is derived and the page says so**, because a number that looks sourced and is
> not is worse than one that admits what it is. `crafts` is an expectation over the skill-up
> probabilities, so it is the count that gets you there on average — not a guarantee, and the
> caption at the top of the list carries that.

## Exports

**function** — `CraftingProgression`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`
- [[features.professions.MaterialChip]] — `src/features/professions/MaterialChip.tsx`
- [[features.professions.TrainingMarker]] — `src/features/professions/TrainingMarker.tsx`

## Imported by

- [[features.professions.ProfessionPage]] — `src/features/professions/ProfessionPage.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
