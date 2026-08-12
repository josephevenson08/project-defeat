---
type: module
layer: domain
source: src/domain/professions/sampleCraftingGuides.ts
lines: 532
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.sampleCraftingGuides

`src/domain/professions/sampleCraftingGuides.ts` · **domain** layer · 532 lines

From the top of the file:

> Concise leveling-path guides for the 9 crafting/secondary professions.
> 
> **Alchemy's 300-375 tail is sourced** against wow-professions.com's TBC guide
> (`/tbc/alchemy-leveling-guide-burning-crusade-classic`): skill ranges, craft counts and material
> quantities are transcribed as facts, the wording here is this repo's own. The other eight
> professions still carry the older estimated steps and their `needsVerification` flags. Alchemy was
> done end to end first to establish the shape, the same way Warrior was for talents; **Jewelcrafting
> followed**, sourced the same way from `/tbc/jewelcrafting-leveling-guide-burning-crusade-classic`. These are not
> exhaustive per-recipe lists - just enough waypoints (with recipe source callouts for
> BoE/vendor/quest recipes that are commonly used to skip skill-up gaps) that a player
> reading this knows generally how to level without getting stuck. All ranges below 300
> are pre-Outland (vanilla) content; 300-375 is the TBC-added tail.

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
