---
type: phase
number: 5
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 5 - Planner Workflows

**Status: partial**

Upgrade planning and the serialization foundation exist. Save/load UI and comparison do not.

## Done

- Upgrade finder: per-slot candidate scan scored against the live sim
- Build serialization foundation (types + encode/decode)

## Remaining

- Save/load builds in the UI — `buildSerialization` is written but nothing calls it yet
- Import/export surface
- Side-by-side gear comparison
- Source and cost planning
- Better responsive/mobile layout

## Key modules

- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.UpgradesPanel]] — `src/features/simulator/UpgradesPanel.tsx`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`

## Neighbours

- [[Phase 4 - Simulation|Previous phase]]
- [[Phase 6 - In-Game Import|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
