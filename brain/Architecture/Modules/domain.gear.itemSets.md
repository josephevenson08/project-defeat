---
type: module
layer: domain
source: src/domain/gear/itemSets.ts
lines: 522
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.itemSets

`src/domain/gear/itemSets.ts` · **domain** layer · 522 lines

From the top of the file:

> A single set bonus, and — importantly — whether this simulator can act on it.
> 
> Across all seventy-one bonuses of Tier 4 and Tier 5 — every one of them, now that both set lists
> are complete — **not one is an unconditional flat stat addition.** They are ability-specific
> ("your Overpower grants 100 attack power", "Starfire damage increased by 10%"), resource-specific
> ("Bloodthirst and Mortal Strike cost 5 less rage"), pet, talent or form scaling, cooldown
> reductions, or they benefit the party rather than the wearer. Recording them as stats would
> therefore be inventing numbers, not approximating them — the same category error that had four
> healer relics carrying flat healing power.
> 
> Three come close, and each fails for a different reason worth keeping in view:
> - Cataclysm Harness 4-piece grants haste, which the engine reads, but through Flurry — a talent
>   proc, so a flat 5% would be an invented uptime rather than an approximated one.
> - Malorne Harness 4-piece grants 1400 armor, but only in Bear Form.
> - Malorne Harness 4-piece also grants 30 Strength, but only in Cat Form. This is the single
>   nearest miss in either tier: the app already treats Feral as a cat-form physical DPS, so this
>   one would be applicable if form were a first-class concept rather than an implicit assumption.
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
