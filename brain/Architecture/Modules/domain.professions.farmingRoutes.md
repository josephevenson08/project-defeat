---
type: module
layer: domain
source: src/domain/professions/farmingRoutes.ts
lines: 379
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.farmingRoutes

`src/domain/professions/farmingRoutes.ts` · **domain** layer · 379 lines

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
> **There is a map underneath now, and there was not until 2026-09-04.** For most of this file's life
> Blizzard's zone art was treated as un-vendorable, so the density of the nodes *was* the picture — a
> zone's farmable region drew its own shape, because coordinates are percentages of the zone's own
> extent. The owner has since decided to vendor the art under Blizzard's fan-content rules, and that
> same percentage space is what makes the overlay register with no transform at all.
> 
> The design the constraint forced is still doing work: `zoneMaps.json` records the one zone with no
> art on the CDN, and its map falls back to the bare square rather than to a hole.

## Exports

**function** — `computeRoute`, `densityCells`, `nodesForProfession`, `routeLength`, `routesForMaterials`, `routesForNode`, `snapToSpawns`, `supplementaryNodes`, `twoOptimize`

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
