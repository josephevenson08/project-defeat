---
type: phase
number: 5
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 5 - Planner Workflows

**Status: partial**

Upgrade planning, side-by-side gear comparison, named saves, import/export, shareable build links, source-and-cost planning and a phone layout all work. There is no autosave, by design, and no account or cloud copy.

## Done

- Upgrade finder: per-slot candidate scan scored against the live sim
- Side-by-side gear comparison: two items for one slot, each swapped into the worn set so set and socket bonuses count, with the stat difference and the role metric delta. Item against item rather than build against build, and both sides gemmed alike — deliberately unlike the upgrade finder, which scores your baseline as-is
- Build serialization foundation (types + encode/decode)
- Export to a portable JSON snapshot and import it back, with per-slot issues reported
- Named build slots stored in the browser. The autosave they once sat beside was removed when a load started clean on purpose
- Shareable build links: the whole build, deflate-compressed, in the URL fragment so it never reaches a server. A link opens straight into the planner wearing the build; the fullest build fits a 2,000-character Discord message
- Empty slots round-trip. They used to import as eighteen "no longer in the catalog" warnings and come back filled from the default gear
- Planner split into six sub-tabs instead of one ~15-screen column, with the stat rail persisting across all six
- Stat rail scoped to the spec — 12 rows rather than 26 on a Fury Warrior — with a toggle that restores every stat
- Source planning: the guide Source column parsed into structured data and joined to raid loot and the catalogue, so 90.1% of recommended items say where they come from against 32.7% before
- Laid out for a phone: below 900px the rail becomes a band with the stats and professions behind one-line disclosures, both tab bars are a three-column grid that keeps every tab visible, every control in the rail, the tab bars, the gear popup, Raid Composition and the profession guides is a 44px target, the gear panel starts on the first screen, and no section scrolls sideways at 375px

## Remaining

- No account or cloud copy of a build — a link is how one crosses devices, by design, so a build nobody saved or shared is gone on reload
- Build-against-build comparison — the comparison panel is item against item, by choice; comparing two whole builds is a separate question it does not answer
- Moving a player between raid groups is drag-only, and HTML5 drag support on touch browsers is uneven — untested on a real phone, and a tap-to-move control is the fix if it fails
- The ranked-gear panel is still 9.4 screens on its own — sub-tabs fixed navigation, not that panel's length

## Key modules

- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.UpgradesPanel]] — `src/features/simulator/UpgradesPanel.tsx`
- [[features.gear.compareItems]] — `src/features/gear/compareItems.ts`
- [[features.gear.ComparePanel]] — `src/features/gear/ComparePanel.tsx`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.builds.shareLink]] — `src/domain/builds/shareLink.ts`
- [[features.builds.ShareNotice]] — `src/features/builds/ShareNotice.tsx`
- [[features.builds.buildStorage]] — `src/features/builds/buildStorage.ts`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Neighbours

- [[Phase 4 - Simulation|Previous phase]]
- [[Phase 6 - In-Game Import|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
