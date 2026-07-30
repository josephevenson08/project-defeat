---
type: phase
number: 5
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 5 - Planner Workflows

**Status: partial**

Upgrade planning, build save/load and import/export all work. Comparison and cost planning do not.

## Done

- Upgrade finder: per-slot candidate scan scored against the live sim
- Build serialization foundation (types + encode/decode)
- Autosave to localStorage and restore on load, seeded through lazy state initializers
- Export to a portable JSON snapshot and import it back, with per-slot issues reported

## Remaining

- Named build slots — there is exactly one autosaved build, so switching characters overwrites it
- Side-by-side gear comparison
- Source and cost planning
- Better responsive/mobile layout

## Key modules

- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.UpgradesPanel]] — `src/features/simulator/UpgradesPanel.tsx`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[features.builds.buildStorage]] — `src/features/builds/buildStorage.ts`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Neighbours

- [[Phase 4 - Simulation|Previous phase]]
- [[Phase 6 - In-Game Import|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
