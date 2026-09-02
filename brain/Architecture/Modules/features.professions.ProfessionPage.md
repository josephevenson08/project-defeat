---
type: module
layer: features
source: src/features/professions/ProfessionPage.tsx
lines: 66
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.ProfessionPage

`src/features/professions/ProfessionPage.tsx` · **features** layer · 66 lines

From the top of the file:

> One profession, on its own page.
> 
> **The skill-tier table is gone and its content is not.** Five rows of Apprentice-through-Master are
> identical on all thirteen professions and answer the question in the wrong shape: a player does not
> want a table of brackets, they want telling — at the point they are standing on — that they have
> to go and train before the next point will land. `trainingMilestones` turns the same data into
> markers, and the two progression components interleave them with the ranges they gate.
> 
> Gathering and crafting get different components because they answer different questions. A
> gatherer asks *where*, and gets zones and a route. A crafter asks *what and how many*, and gets
> counts and materials. Forcing one layout to serve both is what made the old panel read as a list.

## Exports

**function** — `ProfessionPage`

## Imports

- [[components.layout.Panel]] — `src/components/layout/Panel.tsx`
- [[domain.professions.index]] — `src/domain/professions/index.ts`
- [[features.professions.CraftingProgression]] — `src/features/professions/CraftingProgression.tsx`
- [[features.professions.GatheringProgression]] — `src/features/professions/GatheringProgression.tsx`

## Imported by

- [[features.professions.ProfessionsPanel]] — `src/features/professions/ProfessionsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
