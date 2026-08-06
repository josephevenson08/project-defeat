---
type: module
layer: domain
source: src/domain/gear/sampleItems.ts
lines: 3986
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.sampleItems

`src/domain/gear/sampleItems.ts` · **domain** layer · 3986 lines

From the top of the file:

> Hand-written item entries, now a **provenance layer** rather than the catalogue itself.
> 
> Read `src/domain/gear/itemCatalogue.ts` before trusting anything here. Reconciling these entries
> against ingested wowsims data and then against live Wowhead tooltips scored curated 0 / ingested 119
> across every verifiable conflict — so the stats, sockets and item levels below are superseded and no
> longer reach the UI. What survives the merge is the information wowsims has none of: drop location,
> roles, crafting materials, trinket effects.
> 
> Do not add mechanical data here. Re-run `node tools/ingest/ingest-items.mjs` instead.

## Exports

**const** — `sampleItems`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`

## Concepts & phases

- [[Phase 2 - Gear Gems Enchants]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
