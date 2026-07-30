---
type: phase
number: 4
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 4 - Simulation

**Status: partial**

Real TBC attack-table and spell-table mechanics, plus per-spec signature abilities. No rotation model yet.

## Done

- Real attack table: miss/dodge/parry/glance/block/crit with skill differentials
- Real spell table: level-based miss, rating conversions, spell crit
- Armor mitigation and per-weapon damage dice
- Target model that active debuffs actually modify
- Per-spec signature abilities feeding the caster and healer estimates
- Configurable encounter settings and computed stat weights

## Remaining

- Multi-ability rotation priority and cooldown usage
- Proc modelling and talent scaling
- Multi-iteration variance
- Result charts

## Key modules

- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.spellTable]] — `src/domain/simulation/spellTable.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.simulator.calculateStatWeights]] — `src/features/simulator/calculateStatWeights.ts`

## Neighbours

- [[Phase 3 - Character Systems|Previous phase]]
- [[Phase 5 - Planner Workflows|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
