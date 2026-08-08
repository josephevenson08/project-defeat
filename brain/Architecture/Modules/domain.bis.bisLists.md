---
type: module
layer: domain
source: src/domain/bis/bisLists.ts
lines: 151
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.bis.bisLists

`src/domain/bis/bisLists.ts` · **domain** layer · 151 lines

From the top of the file:

> Phase 2 BiS rankings, generated from the Wowhead class guides by `tools/ingest/ingest-bis.mjs`.
> 
> These replace 27 hand-written files that were one item deep — nearly every slot offered a single
> option while the panel labelled it "1 ranked", presenting one guess as a considered ranking. The
> guides carry four or five real options per slot, which is what the feature was missing.
> 
> Entries are keyed by `wowItemId` in the generated data and resolved to catalogue ids here, so a
> ranking survives the catalogue being re-ingested under different slugs. An entry whose item is not
> in the catalogue is dropped rather than rendered as a dead id — `tools/ingest/supplement-items.mjs`
> exists to keep that count at zero, and the test suite asserts it.

## Exports

**function** — `getBisListForSpec`, `requireBisList`

**const** — `bisLists`

## Imports

- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.slotVisibility]] — `src/domain/gear/slotVisibility.ts`

## Imported by

- [[domain.bis.index]] — `src/domain/bis/index.ts`

## Concepts & phases

- [[Best in Slot]]
- [[Phase 2 - Gear Gems Enchants]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
