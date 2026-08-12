---
type: module
layer: domain
source: src/domain/professions/sampleCraftingGuides.ts
lines: 571
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.sampleCraftingGuides

`src/domain/professions/sampleCraftingGuides.ts` · **domain** layer · 571 lines

From the top of the file:

> Concise leveling-path guides for the 9 crafting/secondary professions.
> 
> **Every 300-375 tail is sourced** against wow-professions.com's TBC guides (see HANDOFF.md for the
> URL pattern — the slugs are inconsistent). Skill ranges, craft counts and material quantities are
> transcribed as facts; the wording here is this repo's own, and none of their prose is copied.
> 
> The `needsVerification` flags that remain are all on **pre-300 vanilla** ranges, which are out of
> scope for a Phase 2 planner and are deliberately left as summaries rather than itemised. A reader
> levelling from scratch wants a dedicated 1-300 guide; a reader at 300 wants what is below.
> 
> Sourcing these found the old estimates were not merely vague but repeatedly **wrong on
> materials** — Super Mana Potion listed Mana Thistle and Crystal Vial when it is Dreaming Glory and
> Felweed, and Enchanting's 320-335 pointed at Runed Arcanite Rod, which is a vanilla item.

## Exports

**function** — `getCraftingLevelingPath`

**const** — `craftingLevelingPaths`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`
- [[domain.professions.sampleProfessions]] — `src/domain/professions/sampleProfessions.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
