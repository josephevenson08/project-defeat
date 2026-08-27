---
type: module
layer: features
source: src/features/simulator/SimulatorPanel.tsx
lines: 153
generated: true
tags: [brain/architecture, layer/features]
---

# features.simulator.SimulatorPanel

`src/features/simulator/SimulatorPanel.tsx` · **features** layer · 153 lines

From the top of the file:

> How many specs have a real multi-ability rotation, **computed rather than written down**.
> 
> This sentence said "two specs" while the answer was five, and it had been wrong since the day
> Affliction, Shadow and Destruction gained their rotations. A test in `planner.spec.ts` already
> asserted the real figure and its own comment even quoted the panel's stale number — so the count
> was known to be wrong and nothing connected the two, which is this repo's recurring failure in its
> purest form: prose describing code, updated by hand, on a surface a player reads.
> 
> Derived at module scope because the ability catalogue is static data. Nothing here can drift now:
> adding a rotation moves the number on screen in the same commit.

## Exports

**function** — `SimulatorPanel`

## Imports

- [[components.layout.Panel]] — `src/components/layout/Panel.tsx`
- [[components.ui.Button]] — `src/components/ui/Button.tsx`
- [[domain.abilities.index]] — `src/domain/abilities/index.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.roleTheme]] — `src/domain/character/roleTheme.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[features.simulator.simulationTypes]] — `src/features/simulator/simulationTypes.ts`
- [[lib.animations]] — `src/lib/animations.ts`

## Imported by

- [[App]] — `src/App.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
