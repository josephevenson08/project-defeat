---
type: module
layer: domain
source: src/domain/stats/statRelevance.ts
lines: 99
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.stats.statRelevance

`src/domain/stats/statRelevance.ts` · **domain** layer · 99 lines

From the top of the file:

> Which stats actually mean something for a given spec.
> 
> The rail shows 26 rows. On a Fury Warrior roughly half of them carry nothing — the entire Spell
> group, Feral attack power, and six defensive rows reading 0 — on the one surface that is always on
> screen. Worse than uninformative: a Warrior showing **Healing Power 411** reads as a bug rather
> than as an irrelevant row.
> 
> Two rules keep this honest rather than opinionated:
> 
> 1. **Nothing is deleted, only defaulted away.** The rail has a "show all" toggle, so a spec where
>    this file's judgement is arguable — Enhancement Shaman does get something from spell power —
>    costs one click, not a missing number.
> 2. **Attributes and Armor are never hidden.** The in-game character sheet shows all five
>    attributes and Armor to every class, so hiding them would be a bigger surprise than the noise
>    it saves.

## Exports

**function** — `relevantStats`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[features.stats.StatsRail]] — `src/features/stats/StatsRail.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
