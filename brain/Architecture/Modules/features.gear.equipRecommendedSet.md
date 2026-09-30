---
type: module
layer: features
source: src/features/gear/equipRecommendedSet.ts
lines: 92
generated: true
tags: [brain/architecture, layer/features]
---

# features.gear.equipRecommendedSet

`src/features/gear/equipRecommendedSet.ts` · **features** layer · 92 lines

From the top of the file:

> The whole ranked list, equipped in one go.
> 
> **Two people asked for this by name.** In the 2026-09-21 usability study the raid leader and the
> returning veteran both wanted "equip this whole list" from Ranked Gear, and the owner's heuristic
> evaluation arrived at the same place from the other end: a planner that opens with seventeen empty
> slots and no suggestion of what to do next is a screen with nothing to act on.
> 
> Every slot takes its **rank 1** entry with the enchant and gems that entry recommends, which is
> exactly what the Ranked Gear panel's per-item Equip button applies one row at a time.

## Exports

**function** — `buildRecommendedSet`

**type** — `RecommendedSet`

## Imports

- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.bis.index]] — `src/domain/bis/index.ts`
- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.gear.gearData]] — `src/features/gear/gearData.ts`
- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
