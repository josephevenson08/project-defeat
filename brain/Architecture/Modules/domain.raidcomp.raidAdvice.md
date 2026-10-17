---
type: module
layer: domain
source: src/domain/raidcomp/raidAdvice.ts
lines: 107
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raidcomp.raidAdvice

`src/domain/raidcomp/raidAdvice.ts` · **domain** layer · 107 lines

From the top of the file:

> The advice under the raid table (port step 5, from the decided Raid Composition design): what one
> more seat would add to each group, and what the raid is missing with who fixes it. Both read the
> same "someone here can cast it" counting as `computeCoverage`, so the advice and the coverage lists
> can never disagree.

## Exports

**function** — `bestAddition`, `buffReach`, `lackingPartyBuffs`, `raidGaps`

**const** — `partyBuffCount`

**type** — `BuffReach`, `GroupGaps`, `RaidGap`, `SeatSuggestion`

## Imports

- [[domain.buffs.buffScope]] — `src/domain/buffs/buffScope.ts`
- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[domain.raidcomp.raidBuilds]] — `src/domain/raidcomp/raidBuilds.ts`
- [[domain.raidcomp.rosterTypes]] — `src/domain/raidcomp/rosterTypes.ts`

## Imported by

- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
