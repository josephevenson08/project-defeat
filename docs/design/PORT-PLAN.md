# Bringing the decided designs into the live app: plan

**Status: approved 2026-10-12, not started.** The owner's decisions: **option C** for the look (the new look first, the 3D scene last and optional); **Spec Tier Lists first** after the foundation; **ask before each push**; and the zone maps are to be **reworked, with a plan of their own** (see Decision 2). Nothing has been built yet: the next step is step 0, the foundation.

The Step 2 walkthrough decided a design for every tab (see
[`prototypes/tabs/README.md`](prototypes/tabs/README.md)). Only one has reached the live app so far: the
front door (`SectionPicker.tsx`, 2026-10-11). This plan covers the rest: one decision about the look, the order the
tabs go in, what each step changes in `src/`, and how each one ships.

## What was decided, and what the live app has now

| Tab | Decided design (prototype) | Live app today (`src/features/`) |
| --- | --- | --- |
| Front door | Doors with a glimpse, with goal lines | **Done** (`SectionPicker.tsx`) |
| Character Planner · Gear | The character sheet with game tooltips, plus a "What's left" checklist (`planner.html`) | `gear/GearPanel.tsx` (a slot list and a side pane) |
| · Compare | Side-by-side tooltips with a one-sentence summary | `gear/ComparePanel.tsx` |
| · Talents | The game's talent window, plus a "What's off" list with one-press fixes | `talents/TalentsPanel.tsx` (147 lines) |
| · Buffs | Filled in from your raid and your seat, as icons, with a Blessing per Paladin | `buffs/BuffsPanel.tsx` (switches) |
| · Ranked Gear | Wowhead's order slot by slot as tooltips, plus a "Where it drops" view | `bis/BisPanel.tsx` |
| · Build | A share card, plus a read-first "What came in" report on the paste box | `builds/BuildPanel.tsx` |
| Simulation | What to do next (stat priority, upgrades, the estimate and how far to trust it), with a damage-source table (`simulation.html`) | `simulator/` (three panels: run, weights, upgrades) |
| Raid Composition | The planning table, dark, with a click-to-fill palette and a pencil for names (`raid-composition.html`) | `raidcomp/RaidCompositionPanel.tsx` (already has the palette the prototype copied) |
| Spec Tier Lists | The tier board with a spec card, and a chart of Wowhead's tiers against the logs (`tier-lists.html`) | `tierlists/TierListsPanel.tsx` (129 lines, three plain lists) |
| Raids | The boss journal, and a "For my raid" view of who wants each drop (`raids.html`) | `raids/` (picker, rail, boss cards, loot list) |
| Professions | The profession window, and "Which two" to take (`professions.html`) | `professions/` (picker, then a page per profession) |

**Two facts shape everything below:**
- **The prototypes are vanilla JavaScript building HTML strings; the app is React.** Each step is a rewrite into
  components against the app's own state and domain functions, not a copy. The prototypes' value is the decided
  layout, the interactions and the checks, which become Playwright tests.
- **The Character Planner prototypes were built on Fury Warrior data only; the app serves all 27 specs.** Every
  ported planner design has to work for any class and spec. The data is there (talent trees for all nine classes,
  BiS lists for all 27 specs, buffs by spec), so this is work, not a blocker. Raids, Spec Tier Lists and
  Professions already work for any spec.

## Decision 1: the look

The prototypes use a new look: glass panels, Marcellus and Figtree type, a colour per tab, a 3D crystal-and-water
scene (Three.js) and GSAP motion. The live app uses its own: square dark panels with metal frames, Cinzel
headings, muted section colours and anime.js. The front door went in using the app's own look, without 3D.

| Option | What it means | Cost |
| --- | --- | --- |
| **A. The app's own look** | Port each decided layout and its interactions, and keep the app's current style. | Least work and risk. The app keeps looking like it does now, so the redesign shows only in layouts. |
| **B. The prototypes' look, in full** | New tokens, type and panels, plus the 3D scene and motion on every tab. | Largest: Three.js and GSAP add roughly 200 KB gzipped to a 591 KB bundle (most of which is item data). The scene also needs tuning on low-end machines. |
| **C. The prototypes' look, with the scene last** (recommended) | Bring in the look (tokens, type, glass panels, a colour per tab, tooltips) as the foundation, with a static backdrop per tab in the scene's colour. Add the 3D scene at the very end as one optional, lazy-loaded layer. It would be off with reduced motion and weak hardware, and the owner can drop it then if it doesn't earn its weight. | Medium. Each tab ships in its final look early, and the scene's cost and risk are kept apart from the layouts. |

## Decision 2: zone maps in the live Professions tab

The prototypes draw gathering routes on a plain grid, because the owner kept Blizzard's zone maps out of the
prototypes (2026-10-12). The live app already ships those maps (`public/maps`, credited), and its Professions tab
draws routes over them today.

**The owner's answer (2026-10-12): rework the maps.** They should show current TBC maps and node locations, and the
route algorithm should be redone. This needs **its own plan**, written before step 3 starts. That plan should
research:
- **Maps:** where current TBC Classic zone maps come from (the app's 41 come from Wowhead's map images), and how
  closely they match.
- **Nodes:** whether the recorded nodes (`nodeSpawns.json`, from Wowhead object pages, thinned to each node's three
  busiest zones) are current, complete and correct for TBC.
- **Routes:** the routing itself. Today it is a 16 × 16 density grid, a circuit through the densest cells, 2-opt
  smoothing, then snapping each stop to a real spawn (`farmingRoutes.ts`).
Until then, step 3 ports the profession window and "Which two" and leaves the route view as it is.

## The order, and what each step changes

Smallest and most self-contained first, so the look and the shared parts are proven on easy tabs before the
Character Planner. One commit per step (one per sub-tab in step 6).

| Step | What ports | Changes in `src/` | Tests |
| --- | --- | --- | --- |
| **0. Foundation** | The look (if C or B): tokens, type, panels, a colour per tab. Shared parts: a game-style item tooltip, a spec icon chip, a view switch, a provenance line, and a "TBC Classic · Phase 2" chip on every screen. | `styles/global.css` (7,592 lines; the new tokens go in alongside and replace the old ones tab by tab), `components/` (new shared parts), `AppShell.tsx`, `index.html` (title and preloads). | Screens look different, so screenshot tests move. Behaviour tests should not. |
| **1. Spec Tier Lists** | The tier board with the spec card, and the chart against the logs behind a switch. | `tierlists/TierListsPanel.tsx` rewritten. All the data is in `src` already: `tierlists/`, `simulation/dpsReference.ts`, `raidcomp` (spec icons, `seatContributions`), `abilities/`. | Light: about 17 lines of the suite touch this tab. The prototype check (`tiers-handson.mjs`) becomes new tests. |
| **2. Raids** | The boss journal (boss list with art, loot as tooltips, "Loot for" any spec with ranks), "For my raid" behind a switch, and the search across all five raids. | `raids/` rewritten around a journal component. New domain helpers: each drop's rank on every spec's list (from `bisRankings.json`), and who in the saved roster wants it (reads `project-defeat:roster:v1`). | About 57 lines touch Raids; the picker, rail and boss-card tests change with the layout. `raids-handson.mjs` becomes new tests. |
| **3. Professions** | The profession window (skill bar, recipes coloured at your skill, reagents and vendor prices, gathering ranges), and "Which two" behind a switch. The maps and routes follow the separate rework plan (Decision 2). | `professions/` reworked. Data: `compute-leveling-paths.mjs` writes each step's skill colours into `craftingPaths.json` (today they live only in the 2 MB ingest file). New domain helpers: who feeds whom, and each profession's items on every spec's list. | About 182 lines touch Professions; the picker and page tests change. `profs-handson.mjs` becomes new tests. |
| **4. Simulation** | What to do next: stat priority, best upgrades with Equip, then the estimate with the trust panel and the damage-source table. | `simulator/` panels recomposed. The engine doesn't change (the prototype already runs the app's own simulator). | About 280 lines touch simulation, most of them engine tests that don't move. The layout tests change. |
| **5. Raid Composition** | The planning table as decided (dark, the palette, aiming at a group, the pencil). | `raidcomp/RaidCompositionPanel.tsx`: compare it with the prototype first. Much of the decided design came from the app, so this may be small. | About 176 lines touch it; most should hold. |
| **6. Character Planner**, one sub-tab per commit | In order: Build, Ranked Gear, Compare, Buffs, Gear, Talents. Build first because it touches least; Talents last because it's the largest rewrite. Buffs needs "your raid and seat" from the saved roster. Gear's "What's left" and Ranked Gear's "Where it drops" need each spec's own list, not Fury's. | `builds/`, `bis/`, `gear/`, `buffs/`, `talents/`, `stats/`. Each design generalised from Fury to every spec. | The heaviest: gear, talents, buffs and builds touch over 1,500 lines of the suite. Keeping the existing `data-testid`s where the element survives cuts the churn. |
| **7. The scene** (option C) | The crystal-and-water scene and motion as one optional, lazy-loaded layer, with each tab's colour and detail. | A `Scene` component loading `three` and `gsap` on demand; reduced motion and weak hardware get the static backdrop. | New tests: the backdrop renders with WebGL off, nothing moves with reduced motion, and the bundle without the scene is unchanged. |

## What carries over from the 2 October plan

[`UI-REFRESH-PLAN.md`](UI-REFRESH-PLAN.md) was never started. Most of it folds into this plan:
- **1.1 page title and link previews, 1.2 font preload, 1.3 colours as tokens** go into step 0.
- **1.4 "Import your character" in the empty planner** goes into step 6 (the front door already has the import).
- **2.1 and 2.2 the provenance chip, with fetch dates from the ingest scripts** go into step 0 and are then used by
  every tab. The prototypes already print where each number comes from.
- **2.3 the phase chip on every screen** goes into step 0.
- **2.5 a plain-language hit line on the stat strip** goes into step 6 (the prototype's stat bar shows the hit cap).
- **2.4 counts in tab labels:** dropped, since the decided designs don't use them.
- **3.1 search across the whole app (Ctrl K):** after the port. Raids' search covers loot only.

## How each step ships

1. **Built in React against the app's own state and domain functions.** A prototype's generated data file is
   never copied in.
2. **Works for every spec.** Where a spec's data is missing, the page says so, as the prototypes did.
3. **Tested:** the prototype's hands-on check becomes Playwright tests in `tests/`, existing tests are updated
   where the page changed, and then the full suite, `tsc -b`, lint and build all run.
4. **Checked in the browser** at desktop and phone width, with reduced motion, and screenshots before and after.
5. **Committed, then pushed after the owner says so**, since a push changes the live site. A "Refresh the daily
   log" commit follows each one.

## The owner's decisions (2026-10-12)

1. **The look:** C, the new look first and the 3D scene last as an optional layer.
2. **Zone maps:** rework them to show current TBC maps and nodes, and redo the route algorithm; plan that
   separately before step 3.
3. **Order:** the foundation, then Spec Tier Lists, then the rest as listed.
4. **Pushing:** ask before each push.
