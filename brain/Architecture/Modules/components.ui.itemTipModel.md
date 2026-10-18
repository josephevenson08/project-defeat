---
type: module
layer: components
source: src/components/ui/itemTipModel.ts
lines: 83
generated: true
tags: [brain/architecture, layer/components]
---

# components.ui.itemTipModel

`src/components/ui/itemTipModel.ts` · **components** layer · 83 lines

From the top of the file:

> What an item tooltip shows, in the order the game shows it. Built by each tab from its own data
> (Raids builds it from a loot entry and the catalogue), so the tooltip itself knows nothing about
> where an item came from.

## Exports

**function** — `catalogueTip`, `statLinesFrom`

**const** — `slotName`

**type** — `ItemTipModel`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.describeStats]] — `src/domain/stats/describeStats.ts`

## Imported by

- [[components.ui.ItemTooltip]] — `src/components/ui/ItemTooltip.tsx`
- [[features.bis.rankedTip]] — `src/features/bis/rankedTip.ts`
- [[features.raids.raidLootTip]] — `src/features/raids/raidLootTip.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
