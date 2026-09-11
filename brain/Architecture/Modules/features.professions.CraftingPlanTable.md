---
type: module
layer: features
source: src/features/professions/CraftingPlanTable.tsx
lines: 68
generated: true
tags: [brain/architecture, layer/features]
---

# features.professions.CraftingPlanTable

`src/features/professions/CraftingPlanTable.tsx` · **features** layer · 68 lines

From the top of the file:

> The whole crafting climb in one table, with the trainer stops written into the rows.
> 
> **The crafting pages needed the same spine the gathering pages got.** A page that opens on
> thirty-three step cards answers "what exactly do I make at 212" to somebody who has not yet asked
> "how long is this going to take and what am I going to need". The table answers the second
> question, and it is the only place a trainer stop appears before you are already scrolling past
> the point it gates.
> 
> It is longer than the gathering one — Blacksmithing is thirty-three rows against Mining's nine —
> because a crafting step is a recipe rather than a skill window, and there are simply more of them.
> That is still the right shape: the reference guides put their whole crafting path in a table for
> the same reason, and a row you scan past costs nothing while a card you scroll past costs a screen.

## Exports

**function** — `CraftingPlanTable`

## Imports

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Imported by

- [[features.professions.CraftingProgression]] — `src/features/professions/CraftingProgression.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
