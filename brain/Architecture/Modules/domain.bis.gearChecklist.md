---
type: module
layer: domain
source: src/domain/bis/gearChecklist.ts
lines: 201
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.bis.gearChecklist

`src/domain/bis/gearChecklist.ts` · **domain** layer · 201 lines

From the top of the file:

> The Gear tab's checklist (port step 6): every slot read against the spec's own Wowhead list and its
> gem and enchant guide. A slot is done when it holds the best item it can take, carries an enchant
> where the guide enchants it, and has every socket filled with its bonus on. The decided design
> (`docs/design/prototypes/tabs/gear-common.js`, `status`) was drawn for Fury; this is the same rule
> for every spec, with its own slots and lists.

## Exports

**function** — `bestPickFor`, `checklistTotals`, `checkSlot`, `equipBest`, `gearChecklist`, `withGuideEnchant`, `withGuideGems`

**type** — `ChecklistTotals`, `SlotCheck`, `SlotPick`

## Imports

- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.bis.rankedGear]] — `src/domain/bis/rankedGear.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.enchants.enchantTypes]] — `src/domain/enchants/enchantTypes.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`
- [[domain.gems.gemTypes]] — `src/domain/gems/gemTypes.ts`
- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`

## Imported by

- [[domain.bis.index]] — `src/domain/bis/index.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
