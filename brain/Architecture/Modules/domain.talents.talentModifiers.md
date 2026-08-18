---
type: module
layer: domain
source: src/domain/talents/talentModifiers.ts
lines: 236
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.talents.talentModifiers

`src/domain/talents/talentModifiers.ts` · **domain** layer · 236 lines

From the top of the file:

> What a talent build changes about the character, collapsed into one record.
> 
> Shaped after `aggregateTargetDebuffs` rather than after `StatBlock`, and that is the load-bearing
> choice. `StatBlock` holds flat amounts and *ratings*; almost nothing a talent does fits there. A
> talent grants crit **chance**, not crit rating — the conversion only runs one way — and multiplies
> damage, attack speed and rage income, none of which is a stat at all. The debuff record already
> solved the same problem: a small typed set of fields, each applied at one named point in the
> calculation, where a field with nothing to apply to contributes nothing by construction.
> 
> Every field is an identity value when no points are spent, so an empty tree — which is the default
> — has to reproduce the previous numbers exactly. A test pins that.

## Exports

**function** — `classHasTalentEffects`, `deriveTalentModifiers`, `flurrySpeedMultiplier`, `unmodelledTalentsInBuild`

**const** — `classesWithTalentEffects`, `noTalentModifiers`, `unmodelledTalents`

**type** — `TalentModifiers`

## Imports

- [[domain.talents.sampleTalents]] — `src/domain/talents/sampleTalents.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
