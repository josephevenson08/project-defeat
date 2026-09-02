---
type: module
layer: features
source: src/features/professions/TrainingMarker.tsx
lines: 58
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.TrainingMarker

`src/features/professions/TrainingMarker.tsx` · **features** layer · 58 lines

From the top of the file:

> "Stop here and go train."
> 
> **A skill bar that has stopped moving is the most common way to lose an hour to a profession**, and
> it looks exactly like running out of nodes. The old tier table held the answer — Expert is
> trainable at 125 — in a five-row grid at the top of the page that nobody reads at the moment they
> need it. Here it sits in the progression, between the range that ends and the range that cannot
> start until you have been to a trainer.
> 
> **Consecutive milestones collapse into one marker, and that is a symptom made legible rather than
> hidden.** Nine crafting professions still carry their whole 1-300 climb as a single summary row, so
> every trainer visit below 300 lands in the same gap and four full-size markers stack up under it —
> more vertical space than the step they annotate. One line says the same thing. When those summary
> rows are itemised into real sub-ranges, the milestones distribute on their own and this collapses
> back to the single form with no change here.

## Exports

**function** — `TrainingMarker`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Imported by

- [[features.professions.CraftingProgression]] — `src/features/professions/CraftingProgression.tsx`
- [[features.professions.GatheringProgression]] — `src/features/professions/GatheringProgression.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
