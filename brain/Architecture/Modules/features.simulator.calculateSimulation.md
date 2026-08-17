---
type: module
layer: features
source: src/features/simulator/calculateSimulation.ts
lines: 905
generated: true
tags: [brain/architecture, layer/features]
---

# features.simulator.calculateSimulation

`src/features/simulator/calculateSimulation.ts` · **features** layer · 905 lines

_No doc comment at the top of this file._

## Exports

**function** — `calculateSimulation`

## Imports

- [[domain.abilities.index]] — `src/domain/abilities/index.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`
- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`
- [[domain.simulation.damageFormulas]] — `src/domain/simulation/damageFormulas.ts`
- [[domain.simulation.encounterTypes]] — `src/domain/simulation/encounterTypes.ts`
- [[domain.simulation.manaModel]] — `src/domain/simulation/manaModel.ts`
- [[domain.simulation.rageModel]] — `src/domain/simulation/rageModel.ts`
- [[domain.simulation.sampleEncounters]] — `src/domain/simulation/sampleEncounters.ts`
- [[domain.simulation.specialAttacks]] — `src/domain/simulation/specialAttacks.ts`
- [[domain.simulation.spellTable]] — `src/domain/simulation/spellTable.ts`
- [[domain.talents.talentModifiers]] — `src/domain/talents/talentModifiers.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`
- [[features.simulator.simulationTypes]] — `src/features/simulator/simulationTypes.ts`
- [[features.stats.statsTypes]] — `src/features/stats/statsTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.simulator.calculateStatWeights]] — `src/features/simulator/calculateStatWeights.ts`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`

## Concepts & phases

- [[Tank Avoidance]]
- [[Signature Abilities]]
- [[Phase 4 - Simulation]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
