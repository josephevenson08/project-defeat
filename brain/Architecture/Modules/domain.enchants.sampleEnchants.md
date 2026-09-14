---
type: module
layer: domain
source: src/domain/enchants/sampleEnchants.ts
lines: 203
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.enchants.sampleEnchants

`src/domain/enchants/sampleEnchants.ts` · **domain** layer · 203 lines

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
> 
> A further 15 come from `tools/ingest/supplement-enchants.mjs`: enchants the Wowhead guides
> recommend that wowsims does not model, mostly healer ones. A BiS recommendation the gear popup
> cannot apply is worse than no recommendation at all.

## Exports

**function** — `dropIllegalEnchants`, `getEnchantById`, `getEnchantsForSlot`, `professionsGatingEnchantsForSlot`

**const** — `sampleEnchants`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.enchants.enchantTypes]] — `src/domain/enchants/enchantTypes.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.bis.BisPanel]] — `src/features/bis/BisPanel.tsx`
- [[features.gear.compareItems]] — `src/features/gear/compareItems.ts`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.ItemPopup]] — `src/features/gear/ItemPopup.tsx`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Enchants]]
- [[Phase 2 - Gear Gems Enchants]]
- [[Phase 3 - Character Systems]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
