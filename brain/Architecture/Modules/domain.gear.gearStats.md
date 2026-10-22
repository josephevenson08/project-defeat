---
type: module
layer: domain
source: src/domain/gear/gearStats.ts
lines: 76
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.gearStats

`src/domain/gear/gearStats.ts` · **domain** layer · 76 lines

From the top of the file:

> What the gear alone adds: every item's stats and armour, its gems (a meta only while its condition
> holds), its socket bonus when the gems match, its enchant, and procs and on-use effects at their
> average uptime. No base stats, race, talents or buffs.
> 
> `calculateStats` adds this to the character's base stats, and the Gear tab's character sheet shows
> it as "From this gear", so the sheet and the stat bar count an item the same way.

## Exports

**function** — `sumGearStats`

## Imports

- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.gear.armorValues]] — `src/domain/gear/armorValues.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gems.gemTypes]] — `src/domain/gems/gemTypes.ts`
- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`
- [[domain.stats.statUtils]] — `src/domain/stats/statUtils.ts`

## Imported by

- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`
- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
