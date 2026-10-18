---
type: module
layer: features
source: src/features/builds/buildSummary.ts
lines: 106
generated: true
tags: [brain/architecture, layer/features]
---

# features.builds.buildSummary

`src/features/builds/buildSummary.ts` · **features** layer · 106 lines

From the top of the file:

> A build in one line of facts (port step 6, the decided Build tab's share card): who it is, how many
> of their slots are filled, the average item level, the talent split, buffs and consumables, and the
> set pieces. Read from the saved-build format, so the card, a saved build's row and a pasted build's
> report all describe a build the same way.

## Exports

**function** — `readPaste`, `summarizeBuild`

**type** — `BuildSummary`, `PasteRead`

## Imports

- [[domain.builds.addonImport]] — `src/domain/builds/addonImport.ts`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`
- [[domain.builds.shareLink]] — `src/domain/builds/shareLink.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.itemSets]] — `src/domain/gear/itemSets.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`
- [[domain.talents.sampleTalents]] — `src/domain/talents/sampleTalents.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[features.gear.gearData]] — `src/features/gear/gearData.ts`
- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`

## Imported by

- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
