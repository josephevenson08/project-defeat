---
type: phase
number: 5
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 5 - Planner Workflows

**Status: partial**

Upgrade planning, side-by-side gear comparison, build save/load, import/export, source-and-cost planning and a phone layout that fits all work. Shareable builds do not, and fitting a phone is not the same as being designed for one.

## Done

- Upgrade finder: per-slot candidate scan scored against the live sim
- Side-by-side gear comparison: two items for one slot, each swapped into the worn set so set and socket bonuses count, with the stat difference and the role metric delta. Item against item rather than build against build, and both sides gemmed alike — deliberately unlike the upgrade finder, which scores your baseline as-is
- Build serialization foundation (types + encode/decode)
- Autosave to localStorage and restore on load, seeded through lazy state initializers
- Export to a portable JSON snapshot and import it back, with per-slot issues reported
- Named build slots stored separately from the autosave, so switching character cannot destroy a saved build
- Planner split into six sub-tabs instead of one ~15-screen column, with the stat rail persisting across all six
- Stat rail scoped to the spec — 12 rows rather than 26 on a Fury Warrior — with a toggle that restores every stat
- Source planning: the guide Source column parsed into structured data and joined to raid loot and the catalogue, so 90.1% of recommended items say where they come from against 32.7% before
- Laid out for a phone: below 900px the rail becomes a band with the stats and professions behind one-line disclosures, both tab bars are a three-column grid that keeps every tab visible, every control in the rail, the tab bars, the gear popup, Raid Composition and the profession guides is a 44px target, the gear panel starts on the first screen, and no section scrolls sideways at 375px

## Remaining

- Cloud/shareable builds — slots are browser-local, so they do not follow you to another machine
- Build-against-build comparison — the comparison panel is item against item, by choice; comparing two whole builds is a separate question it does not answer
- Moving a player between raid groups is drag-only, and HTML5 drag support on touch browsers is uneven — untested on a real phone, and a tap-to-move control is the fix if it fails
- The ranked-gear panel is still 9.4 screens on its own — sub-tabs fixed navigation, not that panel's length

## Key modules

- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.UpgradesPanel]] — `src/features/simulator/UpgradesPanel.tsx`
- [[features.gear.compareItems]] — `src/features/gear/compareItems.ts`
- [[features.gear.ComparePanel]] — `src/features/gear/ComparePanel.tsx`
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
