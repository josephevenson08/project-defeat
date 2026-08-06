---
type: module
layer: domain
source: src/domain/gear/catalogueTypes.ts
lines: 54
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.catalogueTypes

`src/domain/gear/catalogueTypes.ts` · **domain** layer · 54 lines

From the top of the file:

> The shape emitted by `tools/ingest/ingest-items.mjs`. Declared by hand rather than inferred from the
> JSON: the file is ~2 MB, and letting `resolveJsonModule` infer a literal type for it makes every
> typecheck crawl.

## Exports

**type** — `CatalogueConflict`, `RawCatalogue`, `RawCatalogueItem`

## Imports

- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
