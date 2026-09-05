---
type: module
layer: domain
source: src/domain/professions/craftingPaths.ts
lines: 52
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.craftingPaths

`src/domain/professions/craftingPaths.ts` · **domain** layer · 52 lines

From the top of the file:

> A computed levelling step: what to make, how many, and the shopping list for the whole step.
> 
> **The counts are derived rather than sourced, and that distinction is the point.** Wowhead
> publishes a recipe's reagents and its orange/yellow/green/grey breakpoints; it publishes no craft
> count, and neither does anyone else without having worked it out. `compute-leveling-paths.mjs`
> does the arithmetic, which is what lets this repo carry a levelling path at all — the standing
> decision in `professionTypes.ts` is that wow-professions.com's recipe orders are linked and never
> copied, because they are that site's craft.

## Exports

**function** — `craftingPathFor`

**const** — `craftingPathModel`, `professionsWithCraftingPaths`

**type** — `CraftingStep`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
