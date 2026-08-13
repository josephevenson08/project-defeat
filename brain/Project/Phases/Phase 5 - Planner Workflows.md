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
- Named build slots stored separately from the autosave, so switching character cannot destroy a saved build
- Planner split into four sub-tabs instead of one ~15-screen column, with the stat rail persisting across all four
- Stat rail scoped to the spec — 12 rows rather than 26 on a Fury Warrior — with a toggle that restores every stat

## Remaining

- Cloud/shareable builds — slots are browser-local, so they do not follow you to another machine
- Side-by-side gear comparison
- Source and cost planning
- Better responsive/mobile layout
- The ranked-gear panel is still 9.4 screens on its own — sub-tabs fixed navigation, not that panel's length

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
