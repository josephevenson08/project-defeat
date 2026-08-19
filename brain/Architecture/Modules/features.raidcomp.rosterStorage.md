---
type: module
layer: features
source: src/features/raidcomp/rosterStorage.ts
lines: 83
generated: true
tags: [brain/architecture, layer/features]
---

# features.raidcomp.rosterStorage

`src/features/raidcomp/rosterStorage.ts` · **features** layer · 83 lines

From the top of the file:

> Persistence for a planned raid.
> 
> A raid leader builds a 25-person roster the evening before an invite; losing it to a page refresh
> would make the tool useless for the one job it exists for. Same storage convention as saved builds,
> separate key so the two never collide.

## Exports

**function** — `clearStoredRoster`, `loadRoster`, `saveRoster`

**const** — `rosterShape`, `rosterStorageKey`

## Imports

- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`
- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`

## Imported by

- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
