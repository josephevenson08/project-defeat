---
type: module
layer: domain
source: src/domain/professions/gatheringPlan.ts
lines: 167
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.gatheringPlan

`src/domain/professions/gatheringPlan.ts` · **domain** layer · 167 lines

From the top of the file:

> Turns a written range into the thing the page draws.
> 
> Three jobs, and the split between them is the point: **which nodes a range covers is derived**
> from the ingest, **which zones get a tab is decided by the data**, and **what order those tabs
> appear in is the one editorial call**. Mixing those is how a page ends up recommending a level
> 30-40 zone to a level 20 player because it happened to have the most spawns.

## Exports

**function** — `guideFor`, `materialsForRange`, `nodesForRange`, `planRows`, `recommendedWithoutMaps`, `routesForRange`, `trainingOutsideRanges`

**const** — `professionsWithGatheringGuides`

**type** — `PlanRow`

## Imports

- [[domain.professions.farmingRoutes]] — `src/domain/professions/farmingRoutes.ts`
- [[domain.professions.gatheringGuides]] — `src/domain/professions/gatheringGuides.ts`
- [[domain.professions.gatheringRangeTypes]] — `src/domain/professions/gatheringRangeTypes.ts`
- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`
- [[domain.professions.sampleProfessionTiers]] — `src/domain/professions/sampleProfessionTiers.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
