---
type: module
layer: domain
source: src/domain/gems/sampleGems.ts
lines: 52
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gems.sampleGems

`src/domain/gems/sampleGems.ts` · **domain** layer · 52 lines

From the top of the file:

> The gem catalogue, ingested from wowsims/tbc by `tools/ingest/ingest-gems-enchants.mjs`.
> 
> This was 11 hand-written gems against 4,528 items, which made every socket dropdown in the app
> offer the same dozen options regardless of colour. It is now the full 212.

## Exports

**function** — `getGemById`, `getGemsForSocket`, `socketBonusIsActive`

**const** — `sampleGems`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gems.gemTypes]] — `src/domain/gems/gemTypes.ts`

## Imported by

- [[features.bis.BisPanel]] — `src/features/bis/BisPanel.tsx`
- [[features.gear.ItemPopup]] — `src/features/gear/ItemPopup.tsx`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.UpgradesPanel]] — `src/features/simulator/UpgradesPanel.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Sockets and Gems]]
- [[Phase 2 - Gear Gems Enchants]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
