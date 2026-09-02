---
type: module
layer: domain
source: src/domain/professions/farmingRoutes.ts
lines: 282
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.farmingRoutes

`src/domain/professions/farmingRoutes.ts` · **domain** layer · 282 lines

From the top of the file:

> Farming routes, computed from where the nodes actually are.
> 
> **This is deliberately our own work rather than someone else's route.** `professionTypes.ts`
> records that wow-professions.com's routes are linked and never copied, because they are that
> site's craft. So nothing here reproduces a published circuit: the input is Wowhead's raw spawn
> coordinates, and the output is a loop this file derives from them. Two people looking at the same
> node cloud will draw similar lines, which is the point — the shape is a property of the zone, not
> of anyone's guide.
> 
> **And there is no map underneath.** Blizzard's zone art cannot be vendored, so the density of the
> nodes *is* the picture. A zone's farmable region draws itself: coordinates are percentages of the
> zone's own extent, so plotting them on a bare square reproduces the shape of where you can gather
> without reproducing the map.

## Exports

**function** — `computeRoute`, `densityCells`, `nodesForProfession`, `routeLength`, `routesForMaterials`, `routesForNode`, `twoOptimize`

**const** — `DENSITY_GRID`, `gatheringNodes`, `mappableMaterials`, `nodesWithoutSpawnData`

**type** — `DensityCell`, `FarmingRoute`, `GatheringNode`, `NodeZoneSpawns`, `RangeRoute`, `SpawnPoint`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
