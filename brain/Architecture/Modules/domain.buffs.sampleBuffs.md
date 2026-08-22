---
type: module
layer: domain
source: src/domain/buffs/sampleBuffs.ts
lines: 381
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.sampleBuffs

`src/domain/buffs/sampleBuffs.ts` · **domain** layer · 381 lines

From the top of the file:

> The thirty-three raid buffs of TBC Phase 2.
> 
> Every number below was read by hand off the Wowhead tooltip of the spell rank named in `spellId`,
> then cross-checked against wowsims/tbc `sim/core/buffs.go` @3301fca5 — the same commit the item,
> gem and enchant catalogues come from. Nothing here is inferred. This replaces fourteen entries
> that were all flagged `needsVerification`, and rightly so: five of them were materially wrong.
> 
> **Why this was done by hand.** Three automated routes were tried and abandoned before this
> (recorded in HANDOFF.md), and the tooltips show exactly why: Mana Spring Totem reads "Summons a
> Mana Spring Totem with 5 health ... that restores 20 mana every 2 seconds", so a parser takes 5,
> a careful reader takes 20-per-2s and converts it to 50 mp5. The ambiguity is only ambiguous to a
> regex. What made the by-hand pass tractable was resolving each spell through Wowhead's *listing*
> page first, which carries rank, level and required class — enough to pick the max rank a raid
> actually uses and to reject the NPC copies that made id selection ambiguous before.
> 
> **Where the two sources disagree, the tooltip wins.** wowsims models Blessing of Wisdom at 42 mp5;
> spells 27142 and 27143 both say "restoring 41 mana every 5 seconds". 41 is used here. That is the
> only outright conflict — everything else agreed to the digit.
> 
> **Base ranks, not talented ranks.** Values are the untalented tooltip figure, which is what can be
> cited. Where a talent or an idol raises it, the improved value is named in `notes` and attributed,
> rather than being silently baked into a number nobody can check.
> 
> **Fifteen of the thirty-three carry `notModelled` instead of stats** — threat, maximum health,
> resistances, damage multipliers, weapon procs and timed cooldowns have nowhere to go in
> `StatBlock`. They are listed anyway, with their real effect, because a raid planner that silently
> omits Bloodlust reads as an oversight rather than a stated limit.

## Exports

**function** — `getBuffById`

**const** — `modelledBuffs`, `sampleBuffs`, `unmodelledBuffs`

## Imports

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Buffs Debuffs and Consumables]]
- [[Phase 3 - Character Systems]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
