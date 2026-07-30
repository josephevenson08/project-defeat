---
type: phase
number: 1
status: complete
generated: true
tags: [brain/project, project/phase, status/complete]
---

# Phase 1 - Local Foundation

**Status: complete**

A local React/Vite app with every class and spec, the full slot model, and prototype stat calculation.

## Done

- Local React + TypeScript + Vite app
- All nine classes and 27 specs represented
- Faction-aware race selection with real TBC race/class legality
- Full 18-slot TBC gear model
- Prototype stat calculation with role-aware results
- Anime.js polish with reduced-motion support
- Playwright flow coverage

## Remaining

_None._

## Key modules

- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.character.races]] — `src/domain/character/races.ts`
- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Neighbours

- [[Phase 2 - Gear Gems Enchants|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
