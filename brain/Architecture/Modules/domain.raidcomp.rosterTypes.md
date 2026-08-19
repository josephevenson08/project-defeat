---
type: module
layer: domain
source: src/domain/raidcomp/rosterTypes.ts
lines: 147
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raidcomp.rosterTypes

`src/domain/raidcomp/rosterTypes.ts` · **domain** layer · 147 lines

From the top of the file:

> One seat in a raid, identified only by what the player brings.
> 
> Deliberately not a *person*. A raid leader planning a composition is asking "do I have a Shaman in
> group 3 for totems", not "is Dave online" — and a name field would invite storing other people's
> details in a local-first app that has never held any.

## Exports

**function** — `addToGroup`, `clearSeat`, `emptyRoster`, `filledSlots`, `moveSeat`, `renameSeat`, `resizeRoster`, `seatAt`

**const** — `groupCountFor`, `PARTY_SIZE`, `RAID_SIZES`

**type** — `RaidGroup`, `Roster`, `RosterSlot`, `SeatRef`

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
