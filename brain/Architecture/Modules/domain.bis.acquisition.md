---
type: module
layer: domain
source: src/domain/bis/acquisition.ts
lines: 141
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.bis.acquisition

`src/domain/bis/acquisition.ts` · **domain** layer · 141 lines

From the top of the file:

> Everything the app knows about how you actually get one item, gathered from every dataset that
> holds a piece of the answer.
> 
> **This is a join, not a new dataset.** Three places already held part of it and none held all of
> it: the Wowhead guide column says which instance (parsed by `parseRankedSource`), the raid loot
> tables say which boss, and the item catalogue says what a crafted one costs in reagents. On their
> own each answers a third of "where do I get this"; together they answer it for most of the list.

## Exports

**function** — `findRaidDrop`, `resolveAcquisition`

**const** — `raidDropIndexSize`

**type** — `ItemAcquisition`

## Imports

- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.raids.index]] — `src/domain/raids/index.ts`

## Imported by

- [[domain.bis.index]] — `src/domain/bis/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
