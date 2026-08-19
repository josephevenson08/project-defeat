---
type: module
layer: domain
source: src/domain/character/classColors.ts
lines: 30
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.classColors

`src/domain/character/classColors.ts` · **domain** layer · 30 lines

From the top of the file:

> Blizzard's own class colours, as used in the game's UI and by every community tool.
> 
> **This is a deliberate exception to the app's colour policy**, which is otherwise near-monochrome so
> that item quality reads first. That rule binds where item quality is on screen; the raid planner
> shows no items at all, and a raid leader scanning twenty-five names for "how many Shamans" is
> exactly the job colour does better than text. The same argument the section picker already makes
> for its per-section hues.
> 
> Values are the canonical RGB Blizzard publishes, unchanged. Druid orange is deliberately close to
> the app's `--warn` amber, which is why nothing in this panel uses warn styling any more.

## Exports

**function** — `getClassColor`

**const** — `classColors`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
