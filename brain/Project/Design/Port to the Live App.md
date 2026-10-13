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

**The maps rework** has a plan of its own (`docs/design/MAPS-PLAN.md`). The Professions maps were retail, post-Cataclysm art under TBC coordinates, so nodes landed in the sea; the owner decided on 2026-10-13 to swap in Wowhead's TBC-era maps at once (Step A, done: all 42 zones, Alterac Mountains included, and a test that the spawns land on land), to keep routes covering a whole skill window, to draw ground routes as straight lines with a note, and to have the tbc-researcher confirm the missing nodes before they are ingested (Step B).

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

## Related

- [[UI Refresh]]
- [[Step 2 Walkthrough]]
- [[Tab Prototypes]]

Up: [[UI Refresh]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
