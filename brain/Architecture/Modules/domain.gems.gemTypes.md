---
type: module
layer: domain
source: src/domain/gems/gemTypes.ts
lines: 99
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gems.gemTypes

`src/domain/gems/gemTypes.ts` · **domain** layer · 99 lines

From the top of the file:

> A gem's colour, which is **not** the same vocabulary as a socket's.
> 
> Sockets are only ever Red, Yellow, Blue or Meta. Gems add the three hybrid colours, and they are
> the majority: of 212 TBC gems, 46 are Orange, 37 Purple and 35 Green — 118 hybrids against 74
> single-colour gems. Modelling gem colour with `SocketColor`, as this originally did, left more than
> half the gems with no representable colour at all.

## Exports

**function** — `countGemColors`, `gemFitsSocket`, `metaGemIsActive`, `socketColorsForGem`

**type** — `Gem`, `GemColor`, `MetaGemRequirement`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`
- [[features.gear.ItemPopup]] — `src/features/gear/ItemPopup.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Sockets and Gems]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
