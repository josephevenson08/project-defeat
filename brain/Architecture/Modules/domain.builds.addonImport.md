---
type: module
layer: domain
source: src/domain/builds/addonImport.ts
lines: 341
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.builds.addonImport

`src/domain/builds/addonImport.ts` · **domain** layer · 341 lines

From the top of the file:

> Reads the string the in-game addon produces and turns it into a build the planner can wear.
> 
> The format, and the research behind every field in it, are in `docs/design/IN-GAME-IMPORT-SCOPE.md`; the addon
> that writes it is in `addon/`. A real export from a level 70 Troll Enhancement Shaman is committed
> at `addon/verify/real-export.json` and is what the tests run against.
> 
> **Deliberately not `validateBuild`.** That function drops anything past Phase 2, which is right for
> a saved build and wrong for a character someone is standing in: the first real export was half
> Phase 3, and running it through that gate would have handed its owner a half-naked copy of their
> own shaman. This converter equips what the player is wearing and says, once, that the *rankings*
> stop at Phase 2 — which is the honest version of the same limit.

## Exports

**function** — `parseAddonExport`

**const** — `ADDON_EXPORT_FORMAT`, `ADDON_EXPORT_VERSION`

**type** — `AddonImportResult`

## Imports

- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.races]] — `src/domain/character/races.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`
- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`
- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`
- [[domain.simulation.sampleEncounters]] — `src/domain/simulation/sampleEncounters.ts`
- [[domain.talents.sampleTalents]] — `src/domain/talents/sampleTalents.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
