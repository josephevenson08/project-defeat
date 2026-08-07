---
type: module
layer: domain
source: src/domain/enchants/sampleEnchants.ts
lines: 61
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.enchants.sampleEnchants

`src/domain/enchants/sampleEnchants.ts` · **domain** layer · 61 lines

From the top of the file:

> The enchant catalogue, ingested from wowsims/tbc by `tools/ingest/ingest-gems-enchants.mjs`.
> 
> This was 22 hand-written entries covering a handful of slots — glove and boot enchants existed for
> one role each — and is now the full 79.
> 
> What the ingested data does *not* carry is the old hand-written role and spec tagging, which used
> to hide, say, spell-power enchants from a warrior. That filtering is gone deliberately: the game
> does not restrict enchants by role, and with 3-14 options per slot the list is short enough to
> read. What survives is the filtering the game really does impose — class restrictions, and shield
> or two-hand only weapon enchants.

## Exports

**function** — `getEnchantById`, `getEnchantsForSlot`

**const** — `sampleEnchants`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.enchants.enchantTypes]] — `src/domain/enchants/enchantTypes.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[features.bis.BisPanel]] — `src/features/bis/BisPanel.tsx`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.ItemPopup]] — `src/features/gear/ItemPopup.tsx`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Enchants]]
- [[Phase 2 - Gear Gems Enchants]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
