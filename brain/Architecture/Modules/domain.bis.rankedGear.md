---
type: module
layer: domain
source: src/domain/bis/rankedGear.ts
lines: 258
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.bis.rankedGear

`src/domain/bis/rankedGear.ts` · **domain** layer · 258 lines

From the top of the file:

> Ranked Gear (port step 6): a spec's Wowhead list read against what the character wears.
> 
> The decided design (`docs/design/prototypes/tabs/ranked-common.js`) was drawn for Fury; this is
> the same logic over any spec's own list. One list per slot, except that rings and trinkets each
> share one, as the guides publish them. Every item stands as worn, ranked above what you wear, or
> not; and every item knows where it comes from, for "Where it drops".

## Exports

**function** — `bestSlotFor`, `equipBlock`, `guideFitting`, `rankedItems`, `rankedListsFor`, `standingOf`, `whereFrom`, `whereText`, `wornItem`, `wornRank`

**const** — `listForSlot`, `raidShortName`, `raidsInOrder`, `slotsWearing`, `upgradesLeft`

**type** — `EquipBlock`, `RankedItem`, `RankedList`, `RankedWhere`, `Standing`

## Imports

- [[domain.bis.acquisition]] — `src/domain/bis/acquisition.ts`
- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`
- [[domain.gear.slotVisibility]] — `src/domain/gear/slotVisibility.ts`
- [[domain.raids.index]] — `src/domain/raids/index.ts`

## Imported by

- [[domain.bis.index]] — `src/domain/bis/index.ts`

## Concepts & phases

- [[Best in Slot]]
- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
