# Bringing the decided designs into the live app: plan

**Status: approved 2026-10-12; steps 0 (the foundation) and 1 (Spec Tier Lists) done 2026-10-12, step 2 (Raids) done 2026-10-13, steps 3 (Professions), 4 (Simulation) and 5 (Raid Composition) done 2026-10-17; step 6 (the Character Planner) under way, Build done 2026-10-18. Next: step 6's Ranked Gear. Step B of the maps rework (the node data) slots in when Wowhead answers the ingest again (see MAPS-PLAN.md).** The owner's decisions: **option C** for the look (the new look first, the 3D scene last and optional); **Spec Tier Lists first** after the foundation; **ask before each push**; and the zone maps are to be **reworked, with a plan of their own** ([`MAPS-PLAN.md`](MAPS-PLAN.md), see Decision 2). With step 0 the owner also chose: **the tab's colour replaces the faction theme**, **every tab takes the new look at once** (the old token names point at the new values until each tab is ported), and **the fonts are vendored** (Marcellus, Figtree and JetBrains Mono, with their licences).

**What step 0 put in** (see "Step 0, as built" below): the tokens and a colour and still backdrop per tab (`data-tab` on `<html>`), glass panels, the three faces, a top bar with the wordmark (back to the front door), the phase chip on every screen and a line for each tab's sources, the shared `PhaseChip`, `Provenance`, `ViewSwitch` and `SpecIcon`, the page title and link previews, and character creation fitting a phone. The game-style item tooltip moved to step 2, where its first user (the Raids loot) is.

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
- **Routes:** the routing itself. Until 2026-10-14 it was a 16 × 16 density grid, a circuit through the densest cells,
  2-opt smoothing, then snapping each stop to a real spawn; since then it is the maps plan's Step C (`routeLoop.ts`).
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

## Step 0, as built (2026-10-12)

| Part | Where | Notes |
| --- | --- | --- |
| Tokens | `src/styles/global.css` (top) | The prototypes' names (`--glass`, `--ink`, `--glow`, `--rim`, `--f-head` and so on) and a `--tab-*` colour per tab. The old names (`--surface-*`, `--line`, `--text-*`, `--metal-*`, `--accent`, `--font-*`) point at the new values, so every tab looks new before its layout is ported. |
| A colour per tab | `:root[data-tab=…]` rules; `useScreenTheme` in `App.tsx` | Home and Raids teal, Planner sky blue, Simulation gold over violet, Raid Composition warm gold, Tier Lists emerald, Professions amber. Creation takes the colour of the section it leads into. The faction theme is gone. |
| Still backdrop | `body::before` | Each tab's prototype WebGL-off fallback and veil. Step 7's scene paints over it. |
| Glass | `.panel`, the front door's cards, the professions grid, the creator | Rounded glass with the tab's rim and a wash from the top-left; the role accent still sits on a panel's top edge. |
| Type | `src/styles/fonts.css`, `public/fonts`, `tools/ingest/vendor-fonts.mjs` | Marcellus, Figtree, JetBrains Mono, latin, 64 KB, each with its OFL licence. The first two are preloaded. |
| Top bar | `AppShell.tsx` | The wordmark (a button back to the front door, keeping the character), the sections, and under the bar the phase chip and the tab's sources (the `provenance` prop). |
| Shared parts | `src/components/ui/` | `PhaseChip` (from `src/domain/phase.ts`), `Provenance` (sources with their read dates), `ViewSwitch` (the prototypes' pill switch), `SpecIcon` (a spec's icon in a ring of its class colour). |
| Page | `index.html`, `public/social-preview.jpg`, `tools/publish/readme-screenshots.mjs` | Title, description, Open Graph and Twitter tags; the README's screenshots and the link preview retaken from the new look. |
| Fixes on the way | `global.css` | Character creation stacks on a phone (it scrolled sideways by 77px before); talent names keep to two lines; buttons are the prototypes' outlined pills; the phone top bar keeps every target at 44px. |

**Tests:** `tests/look.spec.ts` (each screen's colour, the phase on every screen, the wordmark's way home, the faces and their licences, the page's title and preview, creation on a phone). The keyboard test now passes the wordmark on its way to the sections. The full suite passed 308 of 308 on Edge.

## Step 1, Spec Tier Lists, as built (2026-10-12)

| Part | Where | Notes |
| --- | --- | --- |
| Standings | `src/domain/tierlists/specStanding.ts` | Per spec: its place on each Wowhead list, archon.gg's observed DPS, rank and tier, its signature ability, and what it brings to a raid (`seatContributions`, as Raid Composition counts). "Against the logs": each disagreement in a sentence, the counts (agree 9 of 20, logs higher 3, Wowhead higher 5, Wowhead's D-tier 3) and the two notes (Feral 10th by DPS in Wowhead's C; Elemental 13th yet archon A). |
| The tab | `src/features/tierlists/` | `TierListsPanel` (the hero, the facts, "These rank specs, not items", the switch), `TierBoard` (the three boards, a class filter, arrow keys, the sticky card), `SpecCard`, `SpecTip` with `useSpecTip` (hover, focus, Escape; a sheet on a phone), `AgainstTheLogs` (the summary, the chart sortable either way, only the disagreements, healers and tanks as Wowhead's opinion alone), `tierFormat.ts`. |
| State | `App.tsx` | The view and the open card are kept for the session (a visit to another tab keeps them); the card opens on your spec when you have one, and waits to be asked when you don't. Your saved Raid Composition roster is counted on the card; without one the line is left out. |
| Sources | `tierLists.json` `fetchedAt`, `ingest-tier-lists.mjs` | The line under the top bar: Wowhead's lists (ingested 12 Aug 2026, the commit that generated them; the ingest now writes the date from its cached pages) and archon.gg (read 23 Aug 2026). |
| Letters | `global.css` | Still neutral: rank reads through the letter box (boldest at the top; C dashed, D dotted). |

**Not ported:** the prototype's motion (tiles landing row by row) waits for step 7 with the scene. **Tests:** `tests/tierlists.spec.ts` (the prototype's hands-on check with its numbers, plus the roster count, the tooltip, arrow keys and a phone check), and the three older tier tests in `planner.spec.ts` follow the new markup.

## Step 2, Raids, as built (2026-10-13)

| Part | Where | Notes |
| --- | --- | --- |
| Loot helpers | `src/domain/raids/raidLoot.ts`, `exampleRaids.ts`, `raidSources.ts` | Each drop's rank on every spec's Wowhead list (from `bisRankings.json`), what kind of drop it is, where it drops, the set pieces a tier token buys, a search across all five raids, a raid's seats as raiders, and who wants a drop (a token through its set pieces; contested when three or more rank it first). The example raids are the prototype's. |
| The tab | `src/features/raids/` | `RaidsPanel` (the hero with the raid buttons by phase and the loot search with its "/" shortcut, the "For me / For my raid" switch, the item tooltip), `BossJournal` (the rail, the banner with previous and next, the Loot and The fight tabs, "Loot for" any spec), `RaidAbout` (facts, the way in, the attunement chain, which other chain passes through), `ForMyRaid`, `LootSearchResults`, `LootIcon`, `raidLootTip.ts`, `raidsSession.ts`. |
| Shared parts | `src/components/ui/` | The game-style item tooltip (`ItemTooltip`, `itemTipModel.ts`), and the tooltip base it shares with Spec Tier Lists (`FloatingTip`, `useHoverTip`), so the two tabs no longer each place their own. `SpecIcon` takes a raid build's own icon (the bear paw). |
| Colour | `global.css`, `App.tsx` | Raids follows the raid: `data-raid` on `<html>` gives Serpentshrine teal, Tempest Keep the Simulation tab's gold over violet, and the Phase 1 raids warm torchlight. |
| State | `App.tsx` | The raid, the view, the open page in each raid and the "Loot for" spec are kept for the session; choosing Raids again goes back to Serpentshrine's first boss. Without a character the journal shows every drop unranked. |
| Gone | | The "Which raid?" picker screen, the rail of raids (the shell has no rail at all now) and the boss cards, with their styles. |
| Sources | `bisRankings.json` `fetchedAt`, `ingest-bis.mjs`, `bis-fetch.mjs` | The line under the top bar: Wowhead's loot tables (ingested 13 Sept 2026, checked against the ingest's files by a test), the 27 lists (7 Aug 2026; the BiS ingest now writes the date from its cached guides), and the attunement sources. |

**Not ported:** the scene that re-lights for each raid and the panels' motion wait for step 7; the link that carried the raid and boss in the address (the app's address does not change). **Tests:** `tests/raids.spec.ts` (the prototype's check with its numbers: 469 drops, Hydross 2 for Fury, Gloves of the Searing Grip #1 for Feral, the example 25's Belt of One-Hundred Deaths wanted by 11 with 8 first, Dragonspine Trophy contested 9 and 9; plus search, the tooltip, the saved roster, the phone), and the older Raids, image and keyboard tests follow the journal.

## Step 3, Professions, as built (2026-10-15 to 17)

| Part | Where | Notes |
| --- | --- | --- |
| Data | `tools/ingest/compute-leveling-paths.mjs`, `craftingPaths.json` | Each step now carries its recipe's colour thresholds and the skill it is learned at, from the recipe ingest; the paths are otherwise unchanged (checked step by step). The prototype read them from the 2 MB ingest file. |
| Helpers | `src/domain/professions/professionWindow.ts` | A recipe's colour at a skill; the step a skill is on; trainer stops placed in the list where the bar stops; who gathers what (Mining's ores, bars and stones); feed shares (Mining 97% of Blacksmithing's farmed materials); the 165 profession-made places on 27 spec lists. |
| The tab | `src/features/professions/` | `ProfessionsPanel` (the "Level it / Which two" switch), `ProfessionWindow` (icons by category, the skill bar with trainer ticks, the recipe or range list with "You", the detail: a recipe's colours and reagents, or a range's zones and loop), `WhichTwo` (your two, the spec select, a card per profession with what it makes for that spec and who feeds whom). `ZoneRoutes` and `FarmingRouteMap` carry over. |
| Your two | `WhichTwo.tsx`, `ProfessionsPanel.tsx` | **The owner's call, made in the build:** the pair is the character's two professions, the same two the planner reads for Enchanting's ring enchants, so there is one place they are chosen; the prototype kept its own pair for the session. A third pick replaces the older of the two (the app's long-standing rule), shown as "Swap in" with what it replaces. Without a character the pair is held for the visit. |
| Maps | `ZoneRoutes`, `FarmingRouteMap` | A range's loop is drawn on the zone's TBC map with the maps plan's Step C loops, not on the prototype's plain grid (a prototype-only rule). |
| State | `App.tsx`, `professionsSession.ts` | The view, the profession, your skill in each, the picked step and the spec are kept for the session, as Raids keeps its place; choosing Professions again puts each list back on your step. The hash is not used: it carries share links. |
| Gone | | The grid of thirteen cards, the per-profession page, the profession picker, the two progressions, the plan tables and the payoff panel, and about 720 lines of their styles. |
| Sources | `professionSources.ts` | The line under the top bar: recipes and paths, gathering spawns, the TBC zone maps (ingested 13 Oct 2026), the Phase 2 lists (7 Aug 2026), the payoffs. |

**Not ported:** the scene and motion wait for step 7. **Tests:** `tests/professions.spec.ts` (the prototype's check with its real numbers: 33 recipes and four stops, Rough Sharpening Stone orange at 1 and green at 40, Mining's 9 ranges with Adamantite at 325-350, Mining 97%, Dragonstrike #1 for Fury, a phone at 44px); the planner suite's Professions tests follow the new layout. 340 of 340.

## Step 4, Simulation, as built (2026-10-17)

| Part | Where | Notes |
| --- | --- | --- |
| The tab | `src/features/simulator/` | `SimulationPanel` (the hero with the fixed encounter, "What to do next" with who the character is and a way back to the planner), `StatPriority` (step 1: "Gem and enchant for …", the weights as bars, a line for stats the engine does not read yet), `BestUpgrades` (step 2: the finder's best eight with Equip, "Show all"), `TheEstimate` (step 3: the number against archon.gg, what it misses for your spec and talents, the damage sources, how it was computed), `TrustPanel` (every DPS spec's best case against the logs, yours marked), `WhatIsModelled`, `simFormat.ts`. The three old panels are gone. |
| No Run button | `App.tsx` | **A call made in the build:** the design runs the model on arrival, and the stat weights and the finder already re-ran it on every change, so the estimate is always current too. All three are worked out only while the tab is on screen; until now the finder re-ran over the whole catalogue on every gear change in the planner as well. |
| The missing weapon | `SimulationPanel` | **A call made in the build:** said first, above the three steps, rather than in the caveats under the number as in the prototype. The 2026-09-21 usability study is why the app moved it above the number; on this tab it is also plainly the first thing to do next. |
| The trust panel | `bestCase.ts` | `tests/planner.spec.ts`'s best-case harness moved into `src`, unchanged, so the panel and the calibration test read one function. Twenty runs, once per visit. The range (1.05× to 2.13× low) and the lowest spec are computed, which showed the prototype's hand-written "Worst today: Demonology Warlock" was stale: it is Destruction (1,838 against 864). The rotation count in "What is and isn't modelled" is the ability catalogue's. |
| Equip | `BestUpgrades` | Works for every item (the prototype could equip only items on Wowhead's Fury list). A line says what was equipped and focus goes back to the step's heading, since the row leaves the list. |
| Sources | `simFormat.ts`, `dpsReference.ts` | The line under the top bar: the fixed encounter, wowsims' coefficients and talent builds, archon.gg (read 23 Aug 2026). The read date and the address now live once in `dpsReference.ts`, and Spec Tier Lists reads them from there. |

**Not ported:** the scene and motion wait for step 7. **Tests:** `tests/simulation.spec.ts` (the prototype's check with its numbers: the estimate equals the engine's for the exported build, 2,053 for Fury, the damage sources sum to the estimate, it leads with Strength and the best upgrade, 20 specs with Fury marked, 1.05× to 2.13×, Fury's best case 1,348.3; plus Equip, the sources line, a healer through `?simulation=1`, and a phone); the planner suite's simulation tests no longer press Run, and read grouped numbers. 348 of 348.

## Step 5, Raid Composition, as built (2026-10-17)

The comparison came first, as this plan asked: the live panel already had the palette, aiming, Move and drag, names, the export and the hover cards, so this step kept every one of them (and every `data-testid`) and rebuilt the page around the decided layout, adding what only the prototype had.

| Part | Where | Notes |
| --- | --- | --- |
| Advice | `src/domain/raidcomp/raidAdvice.ts` | What one more seat would add to a group (the build bringing the most party buffs it lacks; ties to the palette's order), what the raid is missing with who fixes it (each group's gaps grouped by the build that would bring them), and each buff's reach (Party, Any group, Raid, Single, on the boss). Same "someone here can cast it" counting as `computeCoverage`. |
| The tab | `src/features/raidcomp/` | `RaidCompositionPanel` (the hero, whose counts and buff names are the data's; the raid table with the roster tag, the caveat, the toolbar, the folded raid details, the palette with its next seat and "Fill in order", the how-to, groups with a coverage ring and their party buffs as icons, seats with a pencil and Move and Remove, the status line with Undo), `RaidAdvice` (role balance as bars, one more seat with a one-press seat, missing and who fixes it, the coverage lists with reach tags), `raidcompFormat.ts`, `raidcompSources.ts`. |
| Undo and the example | `RaidCompositionPanel`, `rosterTypes.ts`, `rosterStorage.ts` | Remove, a 25 → 10 resize that drops players, Clear, and loading the example over a raid each offer Undo. The example (the raids' own `exampleRaid`) is labelled as the example and as edited once a seat moves; the label is stored with the roster, and Raids' "For my raid" calls it the example too. Clear keeps the raid details now. |
| Kept from the app | | The group buffs stay icons with hover cards (Wowhead's shape, the owner's call of 2026-09-12) under the prototype's "Receives n of 18 · Party" line; the time zone stays a picker; the export is the real PNG, not the prototype's stub. |
| Sources | `raidcompSources.ts` | The line under the top bar: each buff's reach from its Wowhead tooltip, the buffs checked against wowsims. No dates: neither records one. |

**Not ported:** the scene's light per group and the motion wait for step 7. **Tests:** `tests/raidcomp.spec.ts` (the prototype's check with its numbers: group 1 first then group 2, aiming at group 3, Undo after Remove, 10-player and Clear, the example's 25 of 25 and 8, 7, 4, 5 and 3 of 18 party buffs, Winter's Chill and a Frost Mage, an Enhancement Shaman for group 1, the edited label across a reload, the articles, a full raid disabling the palette, a phone); three planner tests follow the new markup. 355 of 355 (one timing-sensitive image test failed once in the full run and passed on its own).

## Step 6, Character Planner · Build, as built (2026-10-18)

| Part | Where | Notes |
| --- | --- | --- |
| Summary and reading | `src/features/builds/buildSummary.ts` | A build in facts, from the saved-build format (title, spec icon, the spec's own slots and what fills them, average item level, the talent split, buffs and consumables, set pieces), so the card, a save's row and a paste's report agree; and `readPaste`, one box for a share link (the whole address or its fragment), build text or the addon's export, applying nothing. Works for every spec: slots and trees come from the character. |
| The tab | `src/features/builds/BuildPanel.tsx` | The share card first, then Copy share link, Share… and Copy build text, with the link always on screen; named saves with their facts; "Load a build" with Read it, the example export, and the report (what came in slot by slot or why a slot is empty, the spec question, Load into the planner, Clear); the build text folded away. |
| The link | `BuildPanel` | Made again whenever the build changes, so the field always holds the build on screen. It used to appear only after pressing Copy and vanish once the build changed. |
| Buffs on an addon load | `BuildPanel` | **Found in the port:** the report says the addon cannot read your raid's buffs so the Buffs tab keeps its own, but loading an export emptied them. An addon load now keeps the buffs, consumables and target debuffs already set. |
| The example | `addon/verify/fixture-export.json` | The addon's own synthetic Orc Fury Warrior fixture (no name, realm or id), labelled as an example. |
| Not ported | | The card's hit line against the cap: the app has no hit-cap helper for every spec yet, and this plan puts the hit line with Gear (2.5 above). |

**Tests:** `tests/build.spec.ts` (the prototype's check on the app's data: the card for the recommended set, 17 of 17 slots; the link always the build and reading back clean as a link; a broken paste changes nothing; the example reads as an Orc Fury Warrior at 21 / 40 / 0 and changes nothing until loaded, and the buffs stay; no talents asks the spec and waits; a named save loads back; a phone); the planner suite's import tests press Load into the planner after Read it, and the link test follows the always-current link. The image test now waits for each screen's icons before measuring (it had failed two full runs on the Raids journal's lazy icons). 362 of 362.

## Step 6, Character Planner · Ranked Gear, as built (2026-10-18)

| Part | Where | Notes |
| --- | --- | --- |
| The lists, read against your gear | `src/domain/bis/rankedGear.ts` | The prototype's `ranked-common.js` over any spec's own list (`getBisListForSpec`): one list per slot in paperdoll order, rings and trinkets one each (15 lists over 17 slots for every spec), each item worn, ranked above what you wear in the slot it would replace (the weaker of a pair), or not; why an item can't go in a slot (a unique already in the other ring or trinket slot, or a two-hander in the main hand); which ring or trinket slot Equip uses (the weaker one); every item once with every list that ranks it; and the upgrades left. |
| Fitted the guide's way | `guideFitting`, `getGuideRecommendation` (`bisLists.ts`) | The spec's enchant for the slot and its gem for each socket colour, from Wowhead's gem and enchant guides, on every item, not only rank 1 (the advice is per spec, so it fits any item in the slot). What you wear is shown as worn. An enchant the character may not use (a ring enchant without Enchanting) is left off. Equip applies exactly what the card shows. |
| Where it drops | `whereFrom`, `whereText` | `resolveAcquisition`'s raid and boss, matched to the app's five raids by name or spelling (Tempest Keep's loot is recorded as "Tempest Keep: The Eye"). **Found in the port:** many classes' tier pieces are not listed under a boss in the loot tables (Cataclysm Helm, Warbringer Battle-Helm), but the raid's token for that slot is, so a tier piece takes the boss whose token buys it and is tagged "T5 token" or "T4 token". World bosses, crafting, and everything else in the guide's own words, cleaned ("Vendor: 41 Badges of Justice"); a column with nothing left in it ("Quest: /", "25x") falls back to the structured source. |
| The tab | `src/features/bis/` | `RankedGearPanel` (the list's title as the eyebrow, the view switch with the upgrades left as its count, the status line after Equip), `SlotBySlot` (design A: the slot picker of your own gear, a heading with the rank you wear and the shared-list note, a card per item with rank, note, "You wear this" or "In your Finger 2", the item as its tooltip, the crafting recipe or the price, Equip or why not; a slot the guide leaves empty says so, and why when the data shows it), `WhereItDrops` (design C: the summary with each raid's upgrades, Only upgrades, groups by raid and boss in kill order then world bosses, crafted and everything else, rows with their ranks, ticks, upgrades and Equip, and a floating tooltip per row), `rankedTip.ts`, `rankedSession.ts` (the view, slot and Only upgrades, kept by `App` for the session; the sources line under the top bar names the spec's own Wowhead list). Replaces `BisPanel.tsx`; `bis-panel`, `bis-empty-state` and `bis-cost-*` stay. |
| Shared parts | `src/components/ui/` | `ItemTooltip` draws the game's order (base stats, the enchant, the gem in each socket, the socket bonus green when the gems match, green stats, the set and its bonuses), and can stand on the page as well as float. `catalogueTip` (`itemTipModel.ts`) builds the part the catalogue decides, for Raids and Ranked Gear alike. `ViewSwitch` takes a count. **Found in the port:** `FloatingTip` now draws into the body: inside a glass panel (`backdrop-filter`) a fixed box is placed against the panel, which put the tips hundreds of pixels off screen. |
| Not ported | | The prototype's "Try the part-geared example" (the app has the recommended set, and a fresh character, whose 56 upgrades are every ranked item). The old panel's two-per-slot cap and "Show all", which one slot at a time makes unnecessary. |

**Tests:** `tests/ranked.spec.ts` (the prototype's check with its numbers, on the app's data: 57 Fury entries over 15 lists, 56 items, Rod of the Sun King on both hands; every spec's 15 lists cover its 17 slots and the three empty ones are named; Head's three in order as tooltips with what you wear marked; the goggles fitted with the Relentless Earthstorm Diamond and Glyph of Ferocity; rings and trinkets sharing a list with a unique one blocked; Equip reaching the Gear tab and a Gear-tab change showing here; "Where it drops" as SSC 20, TK 12, Karazhan 4, Gruul 3, Magtheridon 2, world bosses 5, crafted 5, everything else 5, Al'ar first in Tempest Keep, tier pieces under their token's boss; the recommended set with no upgrades, Head on #3 leaving two, Only upgrades and Equip clearing them; a fresh character's 56; the row tooltip on screen; the view and slot kept across tabs; a Shaman's Totem, a Feral's and a Holy Paladin's empty slots; the sources line; a phone); the planner suite's ranking helpers pick the slot first, and its Enhancement, trinket, cost and "one slot at a time" tests follow the new markup. 375 of 375.

## Step 6, Character Planner · Compare, as built (2026-10-19)

| Part | Where | Notes |
| --- | --- | --- |
| The tab | `src/features/gear/ComparePanel.tsx` | Design A with design B's sentence: the slot picker of your gear, "Compare with" (the spec's Wowhead list for the slot as icons with their rank, yours marked "worn" and not pickable, a unique ring already in the other hand left out) and "Or any item for this slot" (every legal item, best item level first), the trade in one sentence with the simulated score, your item's tooltip as you wear it beside the other's as it is scored, the stats that change under it, Equip, the gem note, and your totals with each folded underneath. Opens on Head and on the guide's best item you do not wear (the highest item level the slot takes where the guide ranks nothing). |
| Candidates and the default | `compareCandidates`, `defaultCompareItem` (`compareItems.ts`) | The list's entries for the slot, legal for the character now, plus what you wear when the list does not rank it. Every spec's own list. |
| The score | `compareItems` (unchanged) | The app's simulator, not the prototype's example weights: each side swapped into the set you wear, both gemmed with the best gem of each socket colour for you and the slot's current enchant where it stays legal. Shown for the roles the Simulation tab is shown for; the stat changes are for every role. The sentence lists the stats the stat bar shows for the spec, in the stat sheet's order (points of different stats are not worth the same). Equip applies exactly what the score assumed. |
| Shared parts | `src/features/gear/SlotStrip.tsx`, `fittedItemTip.ts` | Ranked Gear's slot picker and its tooltip builder moved to the gear feature so both tabs use them (`.slot-strip` replaces `.ranked-slots`). `whereFrom` takes an item with no list entry, for "any item". |
| Session | `compareSession.ts` | The slot and the item held against yours, kept by `App` for the session; the sources line under the top bar names the spec's own list and that the scores are the app's simulator. |
| Not ported | | The prototype's hit-cap clause ("keeps you 37 over the hit cap"): the app has no hit-cap helper for every spec yet, and this plan puts the hit line with Gear (2.5 above); the simulated score already counts the cap. The old panel's two free pickers, which compared two items you do not wear: the decided design compares against what you wear. Its stat table stays, folded. |
| The owner's call (2026-10-19) | | Compare scores and equips with the simulator's best gem of each colour, which for a Fury Warrior's blue socket is a Stamina gem (Solid Azure Moonstone), where the prototype used Wowhead's gems (Sovereign Nightseye) as Ranked Gear does. The rule predates the port and is tested, and the owner kept it as it is. |

**Tests:** `tests/compare.spec.ts` (the prototype's check with its numbers: the Head swap to the goggles is −8 Hit and +6 Crit in one sentence, Hit Rating 140 → 132, the score adding up; Main Hand's four ranked items and Equip reaching the Gear tab; a Gear-tab change showing here; a unique ring not offered twice; any item sorted by item level, one off the list saying so; an empty slot against the guide's #1; the slot and item kept across tabs; a healer without the score; the sources line; a phone); the planner suite's comparison tests follow the new markup (the totals folded, the guide's pick as the default, the gem note's wording). 385 of 385.

## Step 6, Character Planner · Buffs, as built (2026-10-19)

| Part | Where | Notes |
| --- | --- | --- |
| Buffs from your raid | `src/domain/buffs/raidBuffs.ts` | Your seat (the first seat of your own build, else the first empty one), the raid with you sitting in it, and who gives you what: a party buff from your group only, a buff cast on any group, a raid-wide one and a boss debuff from anyone (`slotProvides` and each buff's reach, as Raid Composition counts them). One provider gives one buff of an exclusive set, handed out in the set's order (`buffExclusivity.ts`), so one Enhancement Shaman drops Windfury and Grace of Air goes missing. The Paladins' Blessings: kept by seat, else Kings and then your role's in order (Might, then Salvation for melee; Wisdom, then Salvation for casters and healers; Might, then Sanctuary for tanks); a taken one swaps. What is missing says what it needs or who is busy. |
| The tab | `src/features/buffs/BuffsPanel.tsx` | Design C with design A's icons: the five sources (Your raid only once Raid Composition has a roster), the message line, the raid as groups of spec icons with your seat marked (press a seat to sit there), the Paladin rows, then From your group, From the raid, On the boss and Missing (with a line per gap), each buff a tile with a floating game-style tooltip; By hand lays the same tiles out by reach with no raid. Consumables as one chip per slot. `buffWords.ts` says what each buff does; `buffsSession.ts` keeps the source, seat and Blessings for the session. |
| The build's lists stay the truth | `App.tsx` | A raid fills `activeBuffIds` and `activeTargetDebuffIds` with the counted buffs that reach you for your role; a switch by hand writes the one it flips (marked "by hand" against the raid); a Blessing change moves only the Blessings. A saved or loaded build is unchanged. |
| Opens By hand | `buffsSession.ts` | **A decision in the port, which the owner kept (2026-10-19):** the prototype filled the example raid on a first visit; the app starts every character clean, so the tab opens By hand with nothing on and a raid is chosen, not applied by opening a tab. |
| Consumables | | One per slot now, as the game allows (the old checkboxes took two foods); a flask empties both elixir slots and an elixir empties the flask, and the message says what came out. Test ids kept (`consumable-toggle-*`), now on chips. |
| Not ported | | The prototype's hit-cap lines (Improved Faerie Fire moving the cap): the app has no hit-cap helper for every spec yet, and this plan puts the hit line with Gear. By hand's Paladin rows with Add and Remove: By hand switches Blessings like any buff; the rows are the raid's. The Alliance name Heroism (the data's spell is Bloodlust). |

**Tests:** `tests/buffs.spec.ts` (the prototype's check on the app's data: it opens By hand with nothing on and Your raid disabled; the example 25-man puts a Fury Warrior in group 2 with 15 of 20 counted buffs and debuffs, Grace of Air missing behind Windfury and Trueshot needing a Marksmanship Hunter, with the tooltip on screen; group 1 loses Strength of Earth; four Paladins on Kings, Might and Salvation, a taken Blessing swapping and an unassigned one going missing; a buff switched by hand and undone by choosing the raid again; an uncounted buff saying why; an elixir taking out the flask; Just you; a saved roster; the raid and seat kept across tabs with the attack power moving; a healer's Kings then Wisdom; a phone); the Build test clicks the Battle Shout tile. The three new specs' 44px checks allow 43.5, after one Compare button measured a hair short under a full run's load. 397 of 397.

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
