---
type: module
layer: domain
source: src/domain/gear/itemSets.ts
lines: 290
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.itemSets

`src/domain/gear/itemSets.ts` · **domain** layer · 290 lines

From the top of the file:

> A single set bonus, and — importantly — whether this simulator can act on it.
> 
> Across all thirty-four Tier 5 bonuses — every one of them, now that the set list is complete —
> **not one is a flat stat addition.** They are ability-specific ("your Overpower grants 100 attack
> power", "Starfire damage increased by 10%"), resource-specific ("Bloodthirst and Mortal Strike
> cost 5 less rage"), pet or talent scaling, or they benefit the party rather than the wearer.
> Recording them as stats would therefore be inventing numbers, not approximating them — the same
> category error that had four healer relics carrying flat healing power.
> 
> The nearest miss is Cataclysm Harness 4-piece, "You gain 5% additional haste from your Flurry
> ability": haste is a stat this engine reads, but it arrives through a talent proc, so a flat 5%
> would be an invented uptime rather than an approximated one.
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
