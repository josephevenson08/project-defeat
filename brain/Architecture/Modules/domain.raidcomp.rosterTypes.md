---
type: module
layer: domain
source: src/domain/raidcomp/rosterTypes.ts
lines: 30
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raidcomp.rosterTypes

`src/domain/raidcomp/rosterTypes.ts` · **domain** layer · 30 lines

From the top of the file:

> One seat in a raid, identified only by what the player brings.
> 
> Deliberately not a *person*. A raid leader planning a composition is asking "do I have a Shaman
> for Bloodlust", not "is Dave online" — and a name field would invite storing other people's
> details in a local-first app that has never held any. Seats are interchangeable within a spec, so
> the roster is a plain list and two Fury Warriors are genuinely identical entries.

## Exports

**const** — `emptyRoster`, `RAID_SIZES`

**type** — `Roster`, `RosterSlot`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
