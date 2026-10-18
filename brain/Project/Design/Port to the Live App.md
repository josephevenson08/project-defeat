---
type: design
generated: true
tags: [brain/project, project/design]
---

# Port to the Live App

_Bringing the decided designs into src/: the look first, then one tab per commit, and the 3D scene last as an optional layer._

The plan the owner approved on 2026-10-12 (`docs/design/PORT-PLAN.md`). **Option C:** the prototypes' look first, with a still backdrop per tab; the 3D scene comes last, lazy-loaded and optional. Then the tabs in order: the foundation, Spec Tier Lists, Raids, Professions, Simulation, Raid Composition, and the Character Planner one sub-tab per commit. Each step is a rewrite into React against the app's own state and domain functions, works for all 27 specs, turns the prototype's hands-on check into Playwright tests, and is pushed only after the owner says so.

**Step 0, the foundation (2026-10-12):**
- **The tab is the theme.** `data-tab` on `<html>` gives each screen its colour and its still backdrop: Home and Raids teal, Planner sky blue, Simulation gold over violet, Raid Composition warm gold, Tier Lists emerald, Professions amber. The faction no longer recolours the page (the owner's call).
- **Every tab took the new look at once:** the old token names point at the new values, so un-ported tabs have glass panels and the new type before their layouts change.
- **Type:** Marcellus, Figtree and JetBrains Mono, vendored with their licences (64 KB against the old 94 KB).
- **The top bar:** the wordmark (back to the front door, keeping the character), the sections, and under the bar the phase chip and each tab's sources.
- **Shared parts:** `PhaseChip`, `Provenance`, `ViewSwitch`, `SpecIcon`.

**Step 1, Spec Tier Lists (2026-10-12):** the tier board with a card for any spec (its place on every list, archon.gg's DPS, what it brings to a raid, its signature ability, how many are in your saved raid), and "Against the logs" behind a switch. The standings come from `domain/tierlists/specStanding.ts`; the tier lists now record when they were fetched.

**Step 2, Raids (2026-10-13):** the boss journal (one boss at a time, "Loot for" any spec with its ranks, the fight, the raid's attunement), "For my raid" (who in your saved raid, or the labelled example, wants each drop, and what is contested), a search across all five raids, and the game-style item tooltip the planner tabs will share. The picker screen and the rail of raids are gone; the tab takes each raid's colour.

**The maps rework** has a plan of its own (`docs/design/MAPS-PLAN.md`). The Professions maps were retail, post-Cataclysm art under TBC coordinates, so nodes landed in the sea; the owner decided on 2026-10-13 to swap in Wowhead's TBC-era maps at once (Step A, done: all 42 zones, Alterac Mountains included, and a test that the spawns land on land), to keep routes covering a whole skill window, to draw ground routes as straight lines with a note, and to have the tbc-researcher confirm the missing nodes before they are ingested (Step B). Step B's research is done and the node ingest is rewritten for it (extra object ids per node, seven new nodes, zones kept by share or by a range naming them, no write unless every node resolves), but Wowhead began refusing scripted requests in October 2026 and the ingest does not get around that, so `nodeSpawns.json` is unchanged (the owner chose to wait and retry); the guide text that was wrong regardless was corrected. Step C, the route algorithm, is done on today's nodes (2026-10-14, `routeLoop.ts`): records merged into spawn points, clusters a rider takes in from one spot, a loop through the clusters worth their detour (2-opt and Or-opt, outliers dropped, no crossings), measured in each zone's 3:2 shape, and every map says how many spawn points its loop passes and how long a lap is, and whether the straight line is flown (Outland at 70) or ridden on the ground. **Step 3, Professions, is built** (2026-10-17): the profession window (recipes coloured at your skill from their own thresholds, now on each step of `craftingPaths.json`; trainer stops in the list; a recipe's reagents; a range's loop on its TBC map) with "Which two" behind a switch, whose pair is the character's two professions; the helpers are in `professionWindow.ts`.

**Step 4, Simulation (2026-10-17):** "What to do next": your stat priority from the real weights ("Gem and enchant for Strength, then…"), your best upgrades with Equip, then the estimate against what players of your spec average on archon.gg, with what it misses for you, the damage sources (which sum to it), how it was computed, and every DPS spec's best case against the logs. No Run button: the three are worked out while the tab is on screen and are always current. The best-case harness moved from the tests into `features/simulator/bestCase.ts`, so the trust panel and the calibration test read one function; the range (1.05× to 2.13× low) and the lowest spec are computed, which showed the prototype's hand-written "Demonology" was stale (it is Destruction).

**Step 5, Raid Composition (2026-10-17):** the planning table as decided. The live panel already had the palette, aiming, Move and drag, names and the PNG export, so they stayed and the page was rebuilt around the decided layout: a hero whose counts are the data's, the raid table with a roster tag, the folded raid details, the palette's next seat and "Fill in order", groups with a coverage ring, seats with a pencil and Move and Remove, Undo after anything that removes people, and the example roster labelled as the example (and as edited). Under it: role balance, what one more seat would add with a one-press seat, what is missing and who fixes it, and the coverage lists with each buff's reach tagged, from `domain/raidcomp/raidAdvice.ts`.

**Step 6, the Character Planner, began with Build (2026-10-18):** the share card for the build on screen (`features/builds/buildSummary.ts`), its link always current, named saves with their facts, and one box for a link, build text or the addon's export that reads first: a report of what came in, the spec question, and only then "Load into the planner". The port found that an addon load emptied the Buffs tab while the report promised it would keep its own; it keeps them now.

## Documents

- [[docs/design/PORT-PLAN|The port plan, with each step as built]] — `docs/design/PORT-PLAN.md`
- [[docs/design/MAPS-PLAN|The maps and routes rework plan]] — `docs/design/MAPS-PLAN.md`

## Live-app code it changed

- [[App]] — `src/App.tsx`
- [[components.layout.AppShell]] — `src/components/layout/AppShell.tsx`
- [[components.layout.SectionPicker]] — `src/components/layout/SectionPicker.tsx`
- [[components.ui.PhaseChip]] — `src/components/ui/PhaseChip.tsx`
- [[components.ui.Provenance]] — `src/components/ui/Provenance.tsx`
- [[components.ui.ViewSwitch]] — `src/components/ui/ViewSwitch.tsx`
- [[components.ui.SpecIcon]] — `src/components/ui/SpecIcon.tsx`
- [[domain.phase]] — `src/domain/phase.ts`
- [[domain.tierlists.specStanding]] — `src/domain/tierlists/specStanding.ts`
- [[features.tierlists.TierListsPanel]] — `src/features/tierlists/TierListsPanel.tsx`
- [[features.tierlists.TierBoard]] — `src/features/tierlists/TierBoard.tsx`
- [[features.tierlists.AgainstTheLogs]] — `src/features/tierlists/AgainstTheLogs.tsx`
- [[domain.raids.raidLoot]] — `src/domain/raids/raidLoot.ts`
- [[features.raids.RaidsPanel]] — `src/features/raids/RaidsPanel.tsx`
- [[features.raids.BossJournal]] — `src/features/raids/BossJournal.tsx`
- [[features.raids.ForMyRaid]] — `src/features/raids/ForMyRaid.tsx`
- [[components.ui.ItemTooltip]] — `src/components/ui/ItemTooltip.tsx`
- [[domain.professions.routeLoop]] — `src/domain/professions/routeLoop.ts`
- [[features.professions.FarmingRouteMap]] — `src/features/professions/FarmingRouteMap.tsx`
- [[domain.professions.professionWindow]] — `src/domain/professions/professionWindow.ts`
- [[features.professions.ProfessionsPanel]] — `src/features/professions/ProfessionsPanel.tsx`
- [[features.professions.ProfessionWindow]] — `src/features/professions/ProfessionWindow.tsx`
- [[features.professions.WhichTwo]] — `src/features/professions/WhichTwo.tsx`
- [[features.simulator.SimulationPanel]] — `src/features/simulator/SimulationPanel.tsx`
- [[features.simulator.bestCase]] — `src/features/simulator/bestCase.ts`
- [[features.simulator.TrustPanel]] — `src/features/simulator/TrustPanel.tsx`
- [[domain.raidcomp.raidAdvice]] — `src/domain/raidcomp/raidAdvice.ts`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`
- [[features.raidcomp.RaidAdvice]] — `src/features/raidcomp/RaidAdvice.tsx`
- [[features.builds.buildSummary]] — `src/features/builds/buildSummary.ts`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Related

- [[UI Refresh]]
- [[Step 2 Walkthrough]]
- [[Tab Prototypes]]

Up: [[UI Refresh]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
