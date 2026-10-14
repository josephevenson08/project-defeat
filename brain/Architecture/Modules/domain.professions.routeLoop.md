---
type: module
layer: domain
source: src/domain/professions/routeLoop.ts
lines: 556
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.routeLoop

`src/domain/professions/routeLoop.ts` · **domain** layer · 556 lines

From the top of the file:

> A farming loop through one zone's spawns, for one skill window: Step C of `docs/design/MAPS-PLAN.md`.
> 
> **What this replaced, and the three things wrong with it.** The old route bucketed the spawns into a
> 16 × 16 grid, kept the cells holding at least 35% of the busiest, visited them nearest-first, snapped
> each stop onto a spawn and uncrossed the result. It drew a reasonable line and could not say how good
> it was, and three things in it were wrong:
> 
> - **It measured a zone as if it were square.** Every zone map is 3:2, and a coordinate is a
>   percentage of each axis on its own, so one point across a zone covers half as much ground again
>   as one point down it. Distances here are in percent of the zone's width, with the vertical scaled
>   by the map's aspect, which is how the zone is shaped on the ground.
> - **It counted Wowhead's records as spawns.** Wowhead lists the same spawn several times, 0.1–0.2
>   apart: Felweed's 245 Hellfire records are about 155 places, and CMaNGOS's spawn table, read for
>   the maps plan's second-source check, has 152. Records within `SAME_SPAWN` of each other are one
>   spawn point here.
> - **Nothing weighed a detour against what it picked up.** The 35% cut was a share of the busiest
>   cell, so a dense pocket at the far edge of a zone always made the loop and a moderate one beside
>   the line never did.
> 
> **What it does instead,** in four steps: merge the records into spawn points; group the points into
> clusters a rider can take in from one place (`REACH`); build a loop through every cluster and
> shorten it with 2-opt and Or-opt; then let each cluster earn its place — a run of stops whose
> detour costs more than twice the loop's average distance per spawn is dropped, a cluster whose
> detour costs less than the average is put back, and waypoints the line passes anyway are taken
> out. That is a prize-collecting loop in the operations-research sense, solved by local search, and
> it is a heuristic: a strong line, not a proven optimum, and the map says so.
> 
> **It also says how good the loop is,** which the old one could not: how many spawn points it passes
> within `REACH` (`pointsWithinReach`) and how long a lap is in zone widths (`loopLength`).
> 
> **Our own work, from published coordinates.** `professionTypes.ts` records that published farming
> routes are linked and never copied; nothing here reproduces one.

## Exports

**function** — `farmingLoop`, `loopLength`, `pointsWithinReach`, `shortenLoop`, `spawnClusters`, `spawnPoints`, `zoneDistance`

**const** — `REACH`, `SAME_SPAWN`, `ZONE_MAP_ASPECT`

**type** — `SpawnCluster`

## Imports

- [[domain.professions.farmingRoutes]] — `src/domain/professions/farmingRoutes.ts`

## Imported by

- [[domain.professions.farmingRoutes]] — `src/domain/professions/farmingRoutes.ts`
- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
