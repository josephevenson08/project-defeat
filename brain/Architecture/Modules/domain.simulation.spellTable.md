---
type: module
layer: domain
source: src/domain/simulation/spellTable.ts
lines: 36
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.spellTable

`src/domain/simulation/spellTable.ts` · **domain** layer · 36 lines

From the top of the file:

> Base spell miss chance (0 spell hit rating) by attacker-to-target level difference. The +2 level
> anchor is less firmly sourced than the others (flagged); the +3 anchor is the one that matters
> for standard raid-boss encounters (level 70 caster vs. level 73 boss).

## Exports

**function** — `computeBaseSpellMissChance`, `computeSpellCritChance`, `computeSpellHitChance`

## Imports

_None._

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

- [[Spell Table]]
- [[Phase 4 - Simulation]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
