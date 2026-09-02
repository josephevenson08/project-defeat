---
type: module
layer: features
source: src/features/professions/CraftingProgression.tsx
lines: 87
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.CraftingProgression

`src/features/professions/CraftingProgression.tsx` · **features** layer · 87 lines

From the top of the file:

> The crafting climb: what to make, how many, and what it costs.
> 
> **The unit is the sub-range, because that is the decision.** "Tailoring 1-375" is not actionable;
> "40-67: 35x Linen Belt, 35 Bolt of Linen Cloth and 35 Coarse Thread" is a shopping list and a
> number of clicks. The data already carries exactly this for 300-375 on every crafting profession —
> what it does not yet carry is the same detail below 300, where nine professions still hold a single
> summary row. Those render as what they are rather than as a step.
> 
> **Materials stay text for now, and that is deliberate.** They are still prose in places — "15
> Golden Sansam, Dreamfoil or Mountain Silversage, whichever matches the craft you picked" — and
> splitting a quantity off the front of a sentence to hang an icon on it is the same "a label is not
> a key" mistake that cost the gathering maps most of their coverage. They get icons when
> `keyMaterials` gets structure.

## Exports

**function** — `CraftingProgression`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`
- [[features.professions.TrainingMarker]] — `src/features/professions/TrainingMarker.tsx`

## Imported by

- [[features.professions.ProfessionPage]] — `src/features/professions/ProfessionPage.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
