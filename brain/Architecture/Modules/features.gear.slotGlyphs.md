---
type: module
layer: features
source: src/features/gear/slotGlyphs.ts
lines: 35
generated: true
tags: [brain/architecture, layer/features]
---

# features.gear.slotGlyphs

`src/features/gear/slotGlyphs.ts` · **features** layer · 35 lines

From the top of the file:

> Two-letter glyph standing in for an item icon, so a slot still has something to anchor the eye
> even with no art assets in the repo and no network calls at runtime.
> 
> Shared between the gear paperdoll and the ranked-gear list so a slot looks the same wherever it
> appears. Sized in CSS to the icon it will eventually become, so dropping real icons in later is a
> swap rather than a layout change.

## Exports

**function** — `slotGlyph`

## Imports

- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`

## Imported by

- [[features.bis.BisPanel]] — `src/features/bis/BisPanel.tsx`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.raids.RaidLootList]] — `src/features/raids/RaidLootList.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
