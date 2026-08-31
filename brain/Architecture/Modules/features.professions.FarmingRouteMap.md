---
type: module
layer: features
source: src/features/professions/FarmingRouteMap.tsx
lines: 78
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.FarmingRouteMap

`src/features/professions/FarmingRouteMap.tsx` · **features** layer · 78 lines

From the top of the file:

> A farming route, drawn from where the nodes actually spawn.
> 
> **There is no map underneath, and that is the design rather than a shortfall.** Blizzard's zone art
> cannot be vendored, so the node cloud *is* the picture: coordinates are percentages of the zone's
> own extent, which means plotting them on a bare square reproduces the shape of the farmable region
> without reproducing the map. A player who knows the zone recognises it immediately; one who does
> not still learns where to ride.
> 
> **The route is computed here and copied from nobody.** `professionTypes.ts` records that
> wow-professions.com's routes are linked and never copied because they are that site's craft. The
> line below comes out of `computeRoute` — density first, nearest-neighbour ordering — over Wowhead's
> published spawn coordinates. It is a heuristic and the caption says so.

## Exports

**function** — `FarmingRouteMap`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Imported by

- [[features.professions.ProfessionsPanel]] — `src/features/professions/ProfessionsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
