---
type: module
layer: domain
source: src/domain/professions/professionWindow.ts
lines: 263
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.professionWindow

`src/domain/professions/professionWindow.ts` · **domain** layer · 263 lines

From the top of the file:

> What the Professions tab asks of the data (port step 3, 2026-10-15): the decided design is the game's
> own profession window, with a "Which two" comparison behind a switch.
> 
> - **The window** colours every recipe on a path at the player's skill from the recipe's own
>   thresholds (`recipeColorAt`), finds the step they are on (`stepIndexAt`) and puts each trainer
>   stop in the list where the bar stops moving (`withTrainerStops`).
> - **Which two** needs to know what each profession makes for a spec — the profession-made items on
>   that spec's Wowhead Phase 2 list (`placesFor`) — and which gathering profession feeds which
>   crafting one (`fedBy`, `suppliesOf`), as a share of the crafter's farmed materials.
> 
> All of it reads the data the rest of the app reads: the computed crafting paths, the gathering
> guides, `bisRankings.json` and the item catalogue, so a rank here cannot disagree with Ranked Gear.

## Exports

**function** — `fedBy`, `feedShares`, `gathererOf`, `placesFor`, `placesOnLists`, `recipeColorAt`, `stepIndexAt`, `suppliesOf`, `withTrainerStops`

**const** — `RECIPE_COLOR_WORD`, `specListKey`, `specLists`

**type** — `ListPlace`, `RecipeColor`, `SpecList`, `WindowRow`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.icons.icons]] — `src/domain/icons/icons.ts`
- [[domain.professions.craftingPaths]] — `src/domain/professions/craftingPaths.ts`
- [[domain.professions.gatheringPlan]] — `src/domain/professions/gatheringPlan.ts`
- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`
- [[domain.professions.sampleProfessions]] — `src/domain/professions/sampleProfessions.ts`
- [[domain.professions.sampleProfessionTiers]] — `src/domain/professions/sampleProfessionTiers.ts`

## Imported by

- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
