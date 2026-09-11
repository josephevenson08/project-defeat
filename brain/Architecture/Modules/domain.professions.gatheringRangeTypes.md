---
type: module
layer: domain
source: src/domain/professions/gatheringRangeTypes.ts
lines: 102
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.gatheringRangeTypes

`src/domain/professions/gatheringRangeTypes.ts` · **domain** layer · 102 lines

From the top of the file:

> The unit a gathering profession is actually levelled in.
> 
> **This replaces one section per material with one section per decision.** The old model had a row
> per ore and per herb — eleven for Mining, nineteen for Herbalism — and they overlapped, because
> materials do: Tin runs 65-125 while Silver runs 75-125, so the page showed two sections covering
> nearly the same skill window and a player standing at 80 had to work out which one they were in.
> Gold got its own block entirely, which is the clearest symptom: Gold Veins sit in the same zones as
> Iron and you pick them up on the Iron lap, so a section of its own describes a trip nobody takes.
> 
> A range answers "what am I doing right now" instead. It owns a skill window, the zones worth
> riding in that window, and every node the window unlocks — Gold included, on the range where you
> actually hit it.

## Exports

**type** — `GatheringGuide`, `GatheringNodeRef`, `GatheringRange`, `ZoneNote`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[domain.professions.gatheringGuides]] — `src/domain/professions/gatheringGuides.ts`
- [[domain.professions.gatheringPlan]] — `src/domain/professions/gatheringPlan.ts`
- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
