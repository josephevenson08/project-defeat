---
type: module
layer: domain
source: src/domain/gear/defaultGear.ts
lines: 32
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.defaultGear

`src/domain/gear/defaultGear.ts` · **domain** layer · 32 lines

From the top of the file:

> The starting gear set.
> 
> Slots are filled in order, and any unique item already placed is withheld from later slots. Without
> that, the paired slots both take the single highest-item-level option and the app opens in a state
> it will not let you create by hand — two copies of a unique ring, trinket or weapon.

## Exports

**const** — `defaultGear`

## Imports

- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gear.obtainability]] — `src/domain/gear/obtainability.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`

## Imported by

- [[features.gear.gearData]] — `src/features/gear/gearData.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
