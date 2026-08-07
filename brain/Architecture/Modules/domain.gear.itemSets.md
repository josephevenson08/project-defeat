---
type: module
layer: domain
source: src/domain/gear/itemSets.ts
lines: 178
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.itemSets

`src/domain/gear/itemSets.ts` · **domain** layer · 178 lines

From the top of the file:

> A single set bonus, and — importantly — whether this simulator can act on it.
> 
> Of the sixteen Tier 5 bonuses researched so far, **not one is a flat stat addition.** They are
> ability-specific ("your Overpower grants 100 attack power", "Starfire damage increased by 10%"),
> resource-specific ("Bloodthirst and Mortal Strike cost 5 less rage"), or benefit the party rather
> than the wearer. Recording them as stats would therefore be inventing numbers, not approximating
> them — the same category error that had four healer relics carrying flat healing power.
> 
> So `modelled` is false everywhere for now, and `whyNotModelled` says what would need to exist
> first. That is deliberately visible rather than silent: a BiS ranking built from itemised stats
> undervalues tier pieces, and a reader deserves to see by how much and why.

## Exports

**function** — `getActiveSets`, `getItemSetById`

**const** — `sampleItemSets`

**type** — `ActiveSet`, `ItemSet`, `SetBonus`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.SetBonuses]] — `src/features/gear/SetBonuses.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
