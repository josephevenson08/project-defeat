---
type: module
layer: domain
source: src/domain/character/baseStats.ts
lines: 46
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.baseStats

`src/domain/character/baseStats.ts` · **domain** layer · 46 lines

From the top of the file:

> What a level-70 character has before a single item is equipped.
> 
> **Base stats are race *and* class in TBC, not class alone.** This app used to carry one block per
> class, hand-written, and the numbers were invented: its Druid had 52 Strength and 82 Intellect
> against a real Night Elf Druid's 73 and 120, and it granted 72 spell power and 86 healing power
> that no druid has ever had. `tools/ingest/ingest-base-stats.mjs` reads all 52 blocks from
> wowsims/tbc at the pinned commit instead.
> 
> Two upstream fields are deliberately absent: **Health and Mana**, because `StatBlock` has no field
> for either. Health is already derived from Stamina by `HEALTH_PER_STAMINA`, and base mana is
> approximated in `manaModel.ts`. The ingest reports both as skipped rather than dropping them
> quietly.

## Exports

**function** — `getBaseStats`

**const** — `baseStatsSource`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.races]] — `src/domain/character/races.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
