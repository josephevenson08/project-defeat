---
type: module
layer: domain
source: src/domain/builds/buildTypes.ts
lines: 41
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.builds.buildTypes

`src/domain/builds/buildTypes.ts` · **domain** layer · 41 lines

From the top of the file:

> Bumped whenever the shape below changes incompatibly. Import refuses anything it doesn't
> recognise rather than silently half-loading a build from a future or ancient version.

## Exports

**const** — `BUILD_FORMAT_VERSION`

**type** — `BuildImportIssue`, `BuildImportResult`, `SavedBuild`, `SavedGearSlot`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.simulation.encounterTypes]] — `src/domain/simulation/encounterTypes.ts`

## Imported by

- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`

## Concepts & phases

- [[Build Serialization]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
