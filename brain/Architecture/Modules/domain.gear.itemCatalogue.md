---
type: module
layer: domain
source: src/domain/gear/itemCatalogue.ts
lines: 264
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.itemCatalogue

`src/domain/gear/itemCatalogue.ts` · **domain** layer · 264 lines

From the top of the file:

> The item catalogue: bulk data ingested from wowsims/tbc, enriched with the hand-written entries.
> 
> **Which source wins, and why.** The rebuild plan assumed the hand-curated entries were read off real
> tooltips and should override the bulk data. Reconciling them said otherwise: of 98 curated entries
> that matched an ingested item, 87 disagreed, and running all 119 verifiable field conflicts against
> live Wowhead tooltips scored **curated 0, ingested 119**. Not one curated stat, socket or item level
> survived a check. So the merge is the other way round from the original plan — ingested data is
> authoritative for everything mechanical.
> 
> The curated entries are still worth keeping, because they carry things wowsims has no data for at
> all: where an item drops, which roles want it, crafting materials, trinket procs. Those fields are
> layered on top. They have not been independently verified and several are known-suspect, so any
> `needsVerification` flag on the curated entry is carried through.
> 
> Reproduce the comparison with `node tools/ingest/reconcile-curated.mjs --check-wowhead`.

## Exports

**function** — `getItemById`, `getItemByWowItemId`, `getItemsForSlot`, `isWithinDefaultPhase`

**const** — `allItems`, `catalogueConflicts`, `catalogueMeta`, `defaultMaxPhase`

**type** — `ItemQueryOptions`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.catalogueTypes]] — `src/domain/gear/catalogueTypes.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gear.sampleItems]] — `src/domain/gear/sampleItems.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`

## Imported by

- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.gear.characterItemRules]] — `src/domain/gear/characterItemRules.ts`
- [[domain.gear.defaultGear]] — `src/domain/gear/defaultGear.ts`
- [[features.gear.gearData]] — `src/features/gear/gearData.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
