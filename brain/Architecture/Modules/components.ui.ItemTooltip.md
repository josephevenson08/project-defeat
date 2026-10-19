---
type: module
layer: components
source: src/components/ui/ItemTooltip.tsx
lines: 88
generated: true
tags: [brain/architecture, layer/components]
---

# components.ui.ItemTooltip

`src/components/ui/ItemTooltip.tsx` · **components** layer · 88 lines

From the top of the file:

> A game-style item tooltip: our own markup and wording in the game's layout and colours (quality
> name, yellow item level, white base stats, the enchant in green, sockets or the gems in them, the
> socket bonus, green bonuses, the set, a yellow kind line). The icons are the files the app already
> ships. Drawn inside a `FloatingTip`, or straight on the page where a tab shows items as tooltips
> (Ranked Gear).

## Exports

**function** — `ItemTooltip`

## Imports

- [[components.ui.itemTipModel]] — `src/components/ui/itemTipModel.ts`
- [[domain.gear.qualityColors]] — `src/domain/gear/qualityColors.ts`

## Imported by

- [[features.bis.SlotBySlot]] — `src/features/bis/SlotBySlot.tsx`
- [[features.bis.WhereItDrops]] — `src/features/bis/WhereItDrops.tsx`
- [[features.gear.ComparePanel]] — `src/features/gear/ComparePanel.tsx`
- [[features.raids.RaidsPanel]] — `src/features/raids/RaidsPanel.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
