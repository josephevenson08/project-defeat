---
type: module
layer: domain
source: src/domain/character/racialTypes.ts
lines: 37
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.racialTypes

`src/domain/character/racialTypes.ts` · **domain** layer · 37 lines

From the top of the file:

> Why a racial is or isn't part of the stat/simulation model.
> 
> `passive` traits are always-on stat effects and are the only kind folded into stats.
> `conditional` traits are passive but only apply with a specific weapon type equipped (Human Sword
> Specialization, Orc Axe Specialization, Dwarf Gun Specialization...).
> `on-use` traits are cooldown abilities (Blood Fury, Berserking, Arcane Torrent). Their throughput
> depends on when they're pressed and what they're lined up with, which this simulator doesn't model.
> `utility` traits have no throughput effect at all (Shadowmeld, Escape Artist, profession bonuses).
> 
> On-use and utility traits are still listed rather than omitted: a race's page showing nothing is
> indistinguishable from a race having nothing, and Orcs and Trolls in particular give up real
> throughput that this model can't price.

## Exports

**type** — `RacialKind`, `RacialTrait`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[domain.character.applyRacialTraits]] — `src/domain/character/applyRacialTraits.ts`
- [[domain.character.sampleRacialTraits]] — `src/domain/character/sampleRacialTraits.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
