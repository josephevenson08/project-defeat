---
type: module
layer: features
source: src/features/raidcomp/RaidCompositionPanel.tsx
lines: 240
generated: true
tags: [brain/architecture, layer/features]
---

# features.raidcomp.RaidCompositionPanel

`src/features/raidcomp/RaidCompositionPanel.tsx` · **features** layer · 240 lines

From the top of the file:

> The raid-composition planner: a roster in, buff and debuff coverage out.
> 
> **Why this is a section rather than another planner panel.** The planner answers "how good is my
> character"; this answers "is my raid missing anything", and the person asking is usually not the
> person being geared. Nothing on this screen is about the character in the rail, so putting it
> under the planner would have inherited a rail that describes something else — the same mistake
> the tier lists and raids sections already avoid by having no rail at all.
> 
> **Every buff counts here, including the fifteen the simulator marks `notModelled`.** That flag
> means the stat model cannot express the effect; it says nothing about whether the buff matters. To
> a raid leader Bloodlust is not a rounding error. This is the one surface where that dataset is
> worth all 33 entries rather than the 18 `calculateStats` can apply, which is most of the reason
> this feature is cheap: the data was already sourced and already correct.

## Exports

**function** — `RaidCompositionPanel`

## Imports

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`
- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
