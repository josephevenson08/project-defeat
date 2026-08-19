---
type: module
layer: domain
source: src/domain/raidcomp/buffCoverage.ts
lines: 206
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raidcomp.buffCoverage

`src/domain/raidcomp/buffCoverage.ts` · **domain** layer · 206 lines

From the top of the file:

> Whether a seat brings a given buff or debuff.
> 
> The whole reason `providedByClass` and `providedBySpec` are typed rather than parsed out of a
> display string: this comparison has to be exact. A near-miss here does not throw, it silently
> under-reports coverage, and a raid leader would go recruit a Shaman they already had.

## Exports

**function** — `computeCoverage`, `describeSuggestion`, `slotProvides`

**type** — `CoverageReport`, `CoverageSection`, `CoveredEntry`, `MissingEntry`, `Suggestion`

## Imports

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.rosterTypes]] — `src/domain/raidcomp/rosterTypes.ts`

## Imported by

- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
