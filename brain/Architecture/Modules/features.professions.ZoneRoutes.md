---
type: module
layer: features
source: src/features/professions/ZoneRoutes.tsx
lines: 60
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.ZoneRoutes

`src/features/professions/ZoneRoutes.tsx` · **features** layer · 60 lines

From the top of the file:

> Zone tabs over one map, for any set of materials farmed together.
> 
> **Zones are tabs rather than stacked maps.** A 1-100 range spans six starting zones and a mid-range
> one spans four; drawing them all would put six near-identical squares in a column and make the page
> scroll past the thing it is for. One at a time, busiest first, is the same information at a
> fraction of the height — and it matches how the choice is actually made, which is "I am Horde, show
> me Durotar".
> 
> Extracted so a supplementary herb gets the same treatment as a range. The alternative was folding
> those herbs into the range's own material list, which was measured and rejected: it took the
> 150-210 range from six zone tabs to eleven, and it would have put Firebloom's Searing Gorge on a
> map captioned as the route for Liferoot, Fadeleaf and Goldthorn — zones that share a skill window
> are not zones that share a lap.

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
