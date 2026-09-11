---
type: module
layer: features
source: src/features/professions/GatheringPlanTable.tsx
lines: 77
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.GatheringPlanTable

`src/features/professions/GatheringPlanTable.tsx` · **features** layer · 77 lines

From the top of the file:

> The whole climb in one table, with the trainer stops written into the rows.
> 
> **This exists because a five-row tier table at the top of a page does not answer the question it
> holds the answer to.** "Expert is trainable at 125" is only ever needed at the moment a player's
> skill bar stops moving at 125, and at that moment they are three screens down looking at a map.
> Weaving the stop into the row for the range it falls in is what the reference guides do, and it is
> the reason their readers do not lose an hour to a stalled bar.
> 
> It also gives the page a spine you can read in five seconds before committing to anything — which
> the per-material version could not, because eleven overlapping sections do not summarise.

## Exports

**function** — `GatheringPlanTable`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Imported by

- [[features.professions.GatheringProgression]] — `src/features/professions/GatheringProgression.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
