---
type: module
layer: domain
source: src/domain/simulation/attackTable.ts
lines: 282
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.attackTable

`src/domain/simulation/attackTable.ts` · **domain** layer · 282 lines

_No doc comment at the top of this file._

## Exports

**function** — `applyDualWieldMissPenalty`, `applyMeleeCritSuppression`, `buildDefenderAvoidanceBaseline`, `buildIncomingAttackTable`, `buildRangedAttackTable`, `buildSpecialAttackTable`, `buildWhiteAttackTable`, `computeAttackerBaseCritChance`, `computeBaseMissChance`, `computeDodgeChance`, `computeGlanceChance`, `computeGlanceDamageRange`, `computeParryChance`, `computeSkillDiff`, `computeTargetBlockChance`

**type** — `DefenderAvoidanceBaseline`, `GlanceDamageRange`, `IncomingAttackTable`, `IncomingAttackTableInputs`, `SpecialAttackTable`, `WhiteAttackTable`, `WhiteAttackTableInputs`

## Imports

- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

- [[Attack Table]]
- [[Tank Avoidance]]
- [[Phase 4 - Simulation]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
