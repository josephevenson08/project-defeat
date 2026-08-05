---
type: module
layer: domain
source: src/domain/gear/armorValues.ts
lines: 141
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.armorValues

`src/domain/gear/armorValues.ts` · **domain** layer · 141 lines

From the top of the file:

> Base armor on a TBC armour piece is **deterministic**, not a per-item designer choice. Two Plate
> helms of the same item level with completely different stat budgets carry identical armor to the
> integer, which is what makes deriving it legitimate rather than inventing precision.
> 
> It is linear in item level, per armour class and slot: `slope * itemLevel + intercept`. The fits
> below come from regressing real Wowhead listing data, and every one that had an independent
> reference point reproduces it exactly — Cloth Head 181 at item level 133, Leather Head 341, Mail
> Head 759, a shield 5279 at 125. Maximum residuals are under 1 armor point.
> 
> This exists because the catalog records armor on only 5 of ~143 armour pieces, which left the
> tank's Effective Health systematically understated. Deriving it fixes 138 items at once, where
> sourcing them one at a time would have taken many research passes.

## Exports

**function** — `deriveItemArmor`

## Imports

- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
