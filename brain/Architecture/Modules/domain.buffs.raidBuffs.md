---
type: module
layer: domain
source: src/domain/buffs/raidBuffs.ts
lines: 212
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.raidBuffs

`src/domain/buffs/raidBuffs.ts` · **domain** layer · 212 lines

From the top of the file:

> Buffs from your raid (port step 6, the Buffs tab's design C): who in the raid brings each buff to
> you, from your seat in it, and what is missing.
> 
> The same counting as Raid Composition's coverage (`slotProvides`, each buff's reach from its
> tooltip), read from one seat: a party buff reaches you only from your own group; a buff cast on
> any group, a raid-wide one and a boss debuff reach you from anyone. One provider gives one buff of
> an exclusive set (one aura per Paladin, one air totem per Shaman, one shout per Warrior), and each
> Paladin gives the one Greater Blessing they are assigned.

## Exports

**function** — `assignBlessings`, `blessingOrder`, `defaultSeat`, `giveBlessing`, `raidBuffIds`, `raidCoverage`, `raidPaladins`, `seatIn`, `seatsWithYou`

**const** — `allBuffEntries`, `BLESSING_IDS`, `isBlessing`, `reachOf`, `seatKey`

**type** — `BuffEntry`, `RaidCoverage`, `RaidSeat`

## Imports

- [[domain.buffs.buffExclusivity]] — `src/domain/buffs/buffExclusivity.ts`
- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Imported by

- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.buffs.buffWords]] — `src/features/buffs/buffWords.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
