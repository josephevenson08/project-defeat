---
type: design
generated: true
tags: [brain/project, project/design]
---

# Step 2 Walkthrough

_Three designs per step, built as the whole page with one part swapped; the owner picks one, often borrowing from another._

**How a step is done:** research the live app's version and its real data; build three designs, each a copy of the whole page with only that part swapped (`make-*-pages.mjs`); test each hands-on in a browser (`checks/*-handson.mjs`); show them side by side; then build the pick into the tab's page. The designs that lost stay as references, and the gallery shows the decision.

**Decided so far:**
- **Home (2026-10-05):** none of the three Dark Portal designs. Back to the original crystal over teal water, with every tab getting its own colour.
- **Raid Composition (2026-10-07, 08):** design A's planning table, made dark, filled from a palette of spec icons, with a pencil to name players. B is kept for reference; C was dropped unbuilt.
- **Planner · Gear (2026-10-09):** B, the character sheet, with C's "What's left" checklist.
- **Planner · Compare (2026-10-09):** A, side-by-side tooltips, with B's one-sentence summary.
- **Planner · Talents (2026-10-09):** A, the game's talent window, with C's "What's off" list.
- **Planner · Buffs (2026-10-09):** C, the buffs your raid brings, with A's icon tiles and a Blessing per Paladin.
- **Planner · Ranked Gear (2026-10-10):** A, Wowhead's order slot by slot as tooltips, with C's "Where it drops" (by raid and boss, upgrades marked) as a second view. B, sorted by an example score, was left out: illustrative weights can't price procs, and the Simulation tab already ranks swaps with the simulator.
- **Planner · Build (2026-10-10):** A, the share card, with C's read-first "What came in" report on its paste box. It speaks the live app's own build format, so its share link opens the same character in the live app.
- **Simulation (2026-10-11):** C, what to do next (stat priority, best upgrades, then the estimate and how far to trust it), with A's damage-source table. It runs the live app's own simulator in the page (`gen-sim-engine.mjs` bundles it from `src/`), so its numbers match the app's to the decimal.

- **The live app's front door (2026-10-11):** A, doors with a glimpse, with B's goal line on each door ("Gear my character →"), built straight into the live app's section picker: each door named by its title, a real glimpse and a counted fact on each, Simulation with a door of its own, and the import beside the Character Planner.

**Next:** Raids, then Spec Tier Lists. Professions comes later.

**Rules the owner set along the way,** now in the live app too (2026-10-10): Heroism is raid-wide (Anniversary patch 2.5.5); Shamans bring totems by spec; Gift of the Wild, Fortitude and Arcane Brilliance reach any group. Building against real data also found wrong data in the app: talent presets that break the game's row rules, a point that could be removed from under a deeper talent, tank loot tagged for DPS, and stale Felguard text. All are fixed. The Simulation workbench then found the upgrade finder scoring two-handers with the off hand still equipped (fixed 2026-10-11).

## Documents

- [[docs/design/prototypes/tabs/README|Each decision, with its checks]] — `docs/design/prototypes/tabs/README.md`
- [[docs/dev-log/HANDOFF|Handoff: where this is right now]] — `docs/dev-log/HANDOFF.md`

## Live-app code it changed

- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[domain.buffs.buffScope]] — `src/domain/buffs/buffScope.ts`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[domain.raids.serpentshrineCavernBosses]] — `src/domain/raids/serpentshrineCavernBosses.ts`
- [[domain.simulation.warlockPet]] — `src/domain/simulation/warlockPet.ts`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[components.layout.SectionPicker]] — `src/components/layout/SectionPicker.tsx`

## Related

- [[UI Refresh]]
- [[Tab Prototypes]]
- [[Buffs Debuffs and Consumables]]
- [[Content Phases]]
- [[Stat Weights]]

Up: [[UI Refresh]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
