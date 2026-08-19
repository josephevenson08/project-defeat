---
type: module
layer: domain
source: src/domain/buffs/buffTypes.ts
lines: 109
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.buffTypes

`src/domain/buffs/buffTypes.ts` · **domain** layer · 109 lines

From the top of the file:

> Who brings a buff or debuff, as data rather than as prose.
> 
> This was a single `providedBy: string` reading "Warrior" or "Feral Druid", which was fine while
> the only consumer printed it. The raid composition planner has to *match* a roster against it, and
> matching on a display string is the trap this repo already has a section about — a renamed spec or
> a stray space silently stops a buff being credited, and the tool would under-report coverage with
> nothing looking wrong.
> 
> `providedBySpec` is set only where the source genuinely is spec-specific: Leader of the Pack needs
> a Feral Druid, Totem of Wrath an Elemental Shaman. Left undefined, any spec of the class brings it.
> 
> The display string is **derived** from these by `describeProvider`, so the two cannot drift.

## Exports

**function** — `describeProvider`

**type** — `Buff`, `BuffProvider`, `TargetDebuff`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`

## Imported by

- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

- [[Buffs Debuffs and Consumables]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
