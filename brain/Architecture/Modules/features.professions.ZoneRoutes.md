---
type: module
layer: features
source: src/features/professions/ZoneRoutes.tsx
lines: 88
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.ZoneRoutes

`src/features/professions/ZoneRoutes.tsx` · **features** layer · 88 lines

From the top of the file:

> Zone tabs over one map, for a whole skill range.
> 
> **Zones are tabs rather than stacked maps.** A range spans three to eight zones; drawing them all
> would put eight near-identical rectangles in a column and make the page scroll past the thing it
> is for. One at a time is the same information at a fraction of the height, and it matches how the
> choice is actually made, which is "I am Horde, show me Durotar".
> 
> **The tab order is the range's recommendation, not the spawn counts.** `routesForRange` carries
> that; the reason is worth repeating here because the nav is where it would be tempting to "fix" it
> back to sorting by size. Silver's busiest zones are level 30-40 and a player mining Silver is
> around level 20.

## Exports

**function** — `ZoneRoutes`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`
- [[features.professions.FarmingRouteMap]] — `src/features/professions/FarmingRouteMap.tsx`

## Imported by

- [[features.professions.GatheringProgression]] — `src/features/professions/GatheringProgression.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
