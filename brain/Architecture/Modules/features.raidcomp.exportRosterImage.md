---
type: module
layer: features
source: src/features/raidcomp/exportRosterImage.ts
lines: 157
generated: true
tags: [brain/architecture, layer/features]
---

# features.raidcomp.exportRosterImage

`src/features/raidcomp/exportRosterImage.ts` · **features** layer · 157 lines

From the top of the file:

> Renders a roster to a PNG a raid leader can paste into Discord.
> 
> **Buff coverage is deliberately absent from the image.** On screen the per-group buff lists are the
> working surface — they are how you decide where the Shaman sits. Once that is decided, the thing
> worth sharing is the seating chart itself: a raid reads "am I in group 3" off it in a second, and
> forty lines of buff annotation would bury that. The analysis is for the planner; the image is for
> the raid.
> 
> Drawn on a canvas rather than rasterised from the DOM, because the alternatives all cost more than
> this: `html2canvas` is a dependency and a runtime network risk, and the SVG `foreignObject` route
> is defeated by the app's own stylesheet not being inlined. Canvas also means the export looks the
> same on every machine, which a screenshot does not.

## Exports

**function** — `downloadRosterImage`, `drawRoster`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Imported by

- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
