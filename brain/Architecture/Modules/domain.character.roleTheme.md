---
type: module
layer: domain
source: src/domain/character/roleTheme.ts
lines: 22
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.roleTheme

`src/domain/character/roleTheme.ts` · **domain** layer · 22 lines

From the top of the file:

> A muted hue per role, used for the hairline that tells you which role a panel is showing.
> 
> These are deliberately desaturated. Role is real information, so it keeps a colour — but item
> quality is the signal a player reads first, and the previous saturated set (amber-500, violet-500,
> teal-400, blue-400) competed directly with epic purple and rare blue for attention. Muting them
> keeps the four roles distinguishable from each other while leaving quality the loudest colour on
> the page, which is the whole point of an otherwise near-monochrome interface.

## Exports

**function** — `getRoleAccentColor`

**const** — `roleAccentColors`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[features.bis.RankedGearPanel]] — `src/features/bis/RankedGearPanel.tsx`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`
- [[features.character.CharacterCreator]] — `src/features/character/CharacterCreator.tsx`
- [[features.character.CharacterStrip]] — `src/features/character/CharacterStrip.tsx`
- [[features.gear.ComparePanel]] — `src/features/gear/ComparePanel.tsx`
- [[features.simulator.SimulationPanel]] — `src/features/simulator/SimulationPanel.tsx`
- [[features.stats.StatsPanel]] — `src/features/stats/StatsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
