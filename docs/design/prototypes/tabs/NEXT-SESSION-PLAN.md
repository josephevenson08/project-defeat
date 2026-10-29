# Next session plan: owner feedback on the tab prototypes

## ▶ Where we left off (2026-10-29): the owner's quick wins, committed; start here

The port is complete and live (origin/main at `8bccd3c`). The owner's quick wins are committed on main, not pushed: the roadmap's stale statuses (`c297464`), a dev-server warm-up before the test suite (`56411a3`), and the expressible talents (`f919045`: 80 effects to 94; Rogue Dual Wield Specialization tried and put back because Subtlety then read above its reference). A full run from a cold server passed 431 of 431. **Next:** push when the owner says so; then why Subtlety reads high with Dual Wield Specialization. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-24): the scene is in the app, and the port is done

**Step 7, the last, brought this folder's scene and motion into the app:** the crystal-and-water host every tab page carries (`window.SCENE`) and `tbc-kit.js`'s themes, ported to three 0.186 as `src/features/scene/waterScene.ts`, and the kit's DOM effects as Web Animations in `motionLayer.ts`, both loaded on demand. As the owner decided (2026-10-23): `three` plus the app's own anime.js, not GSAP; on by default with a "3D scene" switch; and the main bundle up at most 1.5 KB gzipped (it is 1,241 bytes). Each tab has its page's colour, numbers and detail, and each raid its own light; reduced motion, no WebGL or a weak device keep the still backdrop; the front door keeps its art and has no 3D. Left here: the portal ignition, the rune ring, the rebirth burst, the lift, the separate Motion switch and the scroll-driven text. Built, tested (`tests/scene.spec.ts`) and committed (`c3e2a7b`), waiting for the owner's OK to push. **Next:** push it; then Step B of the maps rework when Wowhead answers. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-22): Talents is in the app, and step 6 is done

**Step 6 finished with Talents:** `planner.html`'s Talents sub-tab (`talents-a.js`, the game's talent window, with `talent-common.js`'s "What's off" from design C) is now the live app's Talents tab for every class and spec, and `checks/talents-handson.mjs` became `tests/talents.spec.ts`. As the owner decided, it opens untalented, since the app starts clean; "Load the <spec> preset" puts in wowsims' preset as stored for the 17 specs that have one, and the rest say there is none. The hit cap line reuses Gear's helper (95 at Precision 3/3, 111 at 2/3). Built, tested and pushed (`4da2509`, 2026-10-22), as is Gear (`632d73c`). The guide's gem and enchant fix (a Hunter's off hand) is merged on top, waiting for the owner's OK to push. **Next:** step 7, the optional 3D scene. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-19, evening): Gear is in the app too

**Step 6 continued with Gear:** `planner.html`'s Gear sub-tab (`gear-planner.js`: design B's character sheet from `gear-b.js`, with `gear-c.js`'s checklist as "What's left") is now the live app's Gear tab for every spec, and `checks/gear-handson.mjs` became `tests/gear.spec.ts`. As the owner decided: the app's slot pane, restyled, opens beside the sheet instead of the flyout; the hit cap is a new helper for every spec, read from the simulator's tables, whose base miss against a level 73 boss is now TBC's 9% (it was 8%), so Fury reads 142, or 95 with Precision 3/3; the part-geared example is not ported. Committed and pushed (`632d73c`). **Next:** Talents, the last sub-tab. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-19, later): Buffs is in the app too

**Step 6 continued with Buffs:** `planner.html`'s Buffs sub-tab (`buffs-c.js` with `buffs-a.js`'s icon tiles) is now the live app's Buffs tab, and `checks/buffs-handson.mjs` became `tests/buffs.spec.ts`. It opens By hand with nothing on, where the prototype filled the example raid, since the app starts clean. Committed and pushed (`aa06c9a`). **Next:** Gear (`gear-planner.js`, `gear-b.js` with `gear-c.js`'s checklist, and the hit line) and Talents. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-19): Compare is in the app too

**Step 6 continued with Compare:** `planner.html`'s Compare sub-tab (`compare-a.js` with design B's one-sentence summary) is now the live app's Compare tab, scored by the app's simulator rather than the prototype's example weights, and `checks/compare-handson.mjs` became `tests/compare.spec.ts`. Committed and pushed (`ff62d37`). **Next:** Buffs (`buffs-c.js` with `buffs-a.js`'s icons), Gear and Talents, one commit each. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-18, later): Ranked Gear is in the app too

**Step 6 continued with Ranked Gear:** `planner.html`'s Ranked Gear sub-tab (`ranked-planner.js`: design A's guide slot by slot as tooltips, with design C's "Where it drops" behind the switch) is now the live app's Ranked Gear tab for all 27 specs, and `checks/ranked-handson.mjs` became `tests/ranked.spec.ts`. Committed and pushed (`efc6cac`). **Next:** Compare (`compare-*.js`), Buffs, Gear and Talents, one commit each. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-18): the planner's Build tab is in the app

**Step 6 began with Build:** `planner.html`'s Build sub-tab (design A's share card with design C's "What came in" report) is now the live app's Build tab, and `checks/build-handson.mjs` became `tests/build.spec.ts`. **Next:** Ranked Gear (`ranked-planner.js`), then Compare, Buffs, Gear and Talents, one commit each. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-17, evening): Raid Composition is in the app too

**Step 5, Raid Composition:** this folder's `raid-composition.html` (design A's planning table, dark) is now the live app's Raid Composition tab, built around the live panel's own mechanics, and `checks/rc-handson.mjs` became `tests/raidcomp.spec.ts`. **Next:** step 6, the Character Planner, one sub-tab per commit, starting with Build (`planner.html`). The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-17, later): Simulation is in the app too

**Step 4, Simulation:** this folder's `simulation.html` (design C's "What to do next" with design A's damage sources and breakdown) is now the live app's Simulation tab, and `checks/sim-handson.mjs` became `tests/simulation.spec.ts` (its live-app step no longer presses Run: the app has no Run button now). **Next:** step 5, Raid Composition (`raid-composition.html`, `checks/rc-handson.mjs`). The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-17): Professions is in the app too

**Step 3, Professions** (`e319d2c` and the 2026-10-17 finish): this folder's `professions.html` (design A's profession window with design B's "Which two") is now the live app's Professions tab, and `checks/profs-handson.mjs` became `tests/professions.spec.ts`. **Next:** step 4, Simulation (`simulation.html`, `sim-*.js`, `checks/sim-handson.mjs`). The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-14): the new routes are in

**Step C of the maps plan, the route algorithm** (`a1ffce6`), is built on today's nodes: spawn points instead of Wowhead's duplicate records, clusters, a loop through the clusters worth their detour with no crossings, and every map saying how many spawn points its loop passes and how long a lap is. This folder's `prof-data.js` was regenerated, so the Professions prototype's plain-grid routes are the new loops. **Next:** step 3 (Professions) or step 4 (Simulation); Step B's node data whenever the ingest works again. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-13, later): the maps rework is half done

**The maps plan's decisions are made** ([`docs/design/MAPS-PLAN.md`](../../MAPS-PLAN.md)). Step A, the TBC-era zone maps (`4d83fd3`), is live. Step B, the gathering nodes (`151f12a`), is researched and its ingest is ready, but Wowhead now refuses scripted requests and we do not get around its bot check, so the node data stays as it is and the owner chose to wait and retry the ingest now and then. **Next:** Step C (the route algorithm) on today's nodes, or step 4 (Simulation), which does not wait on the maps; then step 3 (Professions). The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-13): Raids is in the app too

**Step 2, Raids** (`65d84b0`): this folder's `raids.html` (design A's boss journal with design C's "For my raid", the search, the item tooltip) is now the live app's Raids tab, and `checks/raids-handson.mjs` became `tests/raids.spec.ts`.

## Where we left off (2026-10-12, night): the port has begun

**The decided designs are going into the live app** ([`docs/design/PORT-PLAN.md`](../../PORT-PLAN.md)). Done and pushed on 2026-10-12:
- **Step 0, the look** (`fca3cfe`): glass panels, Marcellus and Figtree, a colour and a still backdrop per tab, the phase chip on every screen, the wordmark back to the front door, and the shared parts (`PhaseChip`, `Provenance`, `ViewSwitch`, `SpecIcon`). The tab's colour replaced the faction theme (the owner's call).
- **Step 1, Spec Tier Lists** (`edfe2fb`): this page's design A with design B's "Against the logs", in React on the app's own data; `checks/tiers-handson.mjs` became `tests/tierlists.spec.ts`.
- **The maps plan** (`9ee4d7f`, [`docs/design/MAPS-PLAN.md`](../../MAPS-PLAN.md)): the live app's zone maps are post-Cataclysm retail art under TBC coordinates. Four decisions wait for the owner.

**Next: step 2, Raids** (`raids.html`: design A's boss journal with design C's "For my raid"), then the owner's maps decisions before step 3. Ask before each push. The full brief is at the top of [`docs/dev-log/HANDOFF.md`](../../../dev-log/HANDOFF.md).

## Where we left off (2026-10-12, end of day): the port plan is approved

**Next: build step 0 of [`docs/design/PORT-PLAN.md`](../../PORT-PLAN.md)**, the foundation, then Spec Tier Lists. The owner approved the plan on 2026-10-12:
- **Look:** option C. The prototypes' look comes first (glass panels, Marcellus and Figtree, a colour per tab, game tooltips) with a still backdrop in each tab's colour. The 3D scene is the last step, as an optional lazy-loaded layer.
- **Order:** step 0 foundation, then Spec Tier Lists, Raids, Professions, Simulation, Raid Composition, the Character Planner (one sub-tab per commit), then the scene.
- **Pushing:** ask before each push.
- **Maps:** the owner wants the zone maps reworked to show current TBC maps and nodes, and the route algorithm redone. Write that as its own plan before step 3 (the port plan's Decision 2 lists what to research).
- The old `UI-REFRESH-PLAN.md` is folded into the port plan.

Nothing was built from the plan: the owner was close to their usage limit.

## Where we left off (2026-10-12, late): Professions decided and built, the walkthrough complete

**The Professions tab is decided and built into `professions.html`:** design A, the profession window (every recipe on the path to 375 coloured at your skill, its reagents and vendor prices; each gathering range with its route on a plain grid), with design B's comparison behind a "Level it / Which two" switch (every profession by what it gives a level 70 character and makes for your spec, and a pair to pick). C, the road to 375, was not picked. Details are in the [README](README.md#professions-the-profession-window-and-which-two-to-take-2026-10-12).
- **It reads the live app's data:** `gen-prof-data.mjs` → `prof-data.js`. No live-app change. Routes on a plain grid, no zone map art (the owner's choice).
- `checks/profs-handson.mjs a|b|c|p` pass at 1280px, 400px and reduced motion; `check-bg.mjs` is clean; the brain is updated; `published.mjs` passed every page on a local build (1,563 icons).
- **Committed and pushed** (2026-10-12): `206c0a7`, then "Refresh the daily log" `9b0e0e9`.

**With it, every tab of the walkthrough is decided.** Next is the owner's call.

**Then two data cleanups (2026-10-12, committed and pushed as `b806f06`, then "Refresh the daily log" `40bc023`):** the gloves' stale note, flag and made-up stats are gone from `sampleItems.ts`, and the crafting paths now know which recipes a trainer teaches (Wowhead's code 2 is a drop; a training cost, code 6 or a skill-1 starter counts), which swapped a few recipes in five paths. Tests added; the full suite passed 302 of 302.

**Still open:** the app's buff data leaves out caster-side debuffs and mana (Shadow Priest's, for one).

## Where we left off (2026-10-12, later): Spec Tier Lists decided and built

**The Spec Tier Lists tab is decided and built into `tier-lists.html`:** design A, the tier board (Wowhead's three lists as rows of spec icons, a card for any spec), with design B's chart behind a "The board / Against the logs" switch (the 20 damage specs by archon.gg's observed DPS, with Wowhead's and archon's tiers; they agree on 9). C, what each spec brings, was not picked. Details are in the [README](README.md#spec-tier-lists-the-tier-board-and-the-logs-beside-it-2026-10-12).
- **It reads the live app's data:** `gen-tier-data.mjs` → `tier-data.js`. No live-app change in this step.
- `checks/tiers-handson.mjs a|b|c|p` pass at 1280px, 400px and reduced motion; `check-bg.mjs` is clean; the brain is updated; `published.mjs` passed every page on a local build (1,353 icons).
- **Committed and pushed** (2026-10-12): `0b6e00f`, then "Refresh the daily log" `e509e9e`.
- **To raise with the owner:** the app's buff data leaves out caster-side debuffs and mana (Shadow Priest's, for one).

**Next: Professions,** the only tab left; the owner said it comes later, so ask first.

## Where we left off (2026-10-12): Raids decided, built, committed and pushed

**The Raids work is committed and pushed** (2026-10-12): the work commit `4ced560`, then "Refresh the daily log" `d30a8b8`. Next: Spec Tier Lists.

**The Raids tab is decided and built into `raids.html`:** design A, the boss journal (one boss at a time with the owner's art, the loot as tooltips, your spec's picks ranked from Wowhead's Phase 2 lists), with design C's raid view behind a "For me / For my raid" switch (who in your Raid Composition raid wants each drop, contested drops marked). B, the attunement tracker, was not picked. Details are in the [README](README.md#raids-the-boss-journal-with-your-raids-loot-2026-10-11).
- **It reads the live app's raid data:** `gen-raid-data.mjs` bundles it from `src/` into `raid-data.js` (469 drops, each with its rank on all 27 specs' lists). Regenerate after the raid data, the catalogue or the BiS rankings change.
- **Live-app fixes with it,** checked by the tbc-researcher, with a test: Al'ar's Gloves of the Searing Grip are Physical DPS and Tank, Netherbane is Physical DPS, Tempest Keep's heroic keys need Revered, and the attunements say they are account-wide on Anniversary realms.
- `checks/raids-handson.mjs a|b|c|p` pass at 1280px, 400px and reduced motion; `check-bg.mjs`, `tsc -b`, lint and build are clean; the brain is updated. **The app's whole Playwright suite passed 301 of 301 on Edge** (2026-10-11, with the new test), and `published.mjs` passed every page against a local build, with all 1,304 icon requests returning images.

**Next: Spec Tier Lists** (`tier-lists.html`, Step 1 baseline), then Professions later.

**Still open:** the gloves' overlay in `sampleItems.ts` keeps a stale "stats are approximate" note and its `needsVerification` flag; clear it if the owner agrees.

## Where we left off (2026-10-11, later): Raids research half done

**The owner stopped the session mid-research ("stop for now, I have to leave").** Nothing was built then; the step was finished later the same day (above). The notes from then:
- **Read so far:** the prototype `raids.html` (its loot is a hand-pasted `DATA` blob; no generator exists yet) and the live app's `src/features/raids/` plus `raidTypes.ts`.
- **Real data the designs can use:** `bisRankings.json` holds all 27 specs' Wowhead Phase 2 lists by `wowItemId`, so each drop can say which specs rank it and how high. The Raid Composition roster is in sessionStorage `pd-raidcomp-a:v1`, read by `savedRoster()` in `buff-common.js`, which also has the example rosters (`EX`).
- **Three directions, drafted but not yet put to the owner:** A · the Adventure Guide (one boss at a time, art, loot as tooltips, a spec filter); B · the way in (an attunement tracker like the Attune addon); C · from your raid (who in your roster wants each drop).
- **Next steps, in order:** (1) ask the tbc-researcher about the two role tags and whether SSC and TK still need attunement on Anniversary realms (design B depends on the answer); (2) put the three directions to the owner with an AskUserQuestion; (3) the rest of "How a walkthrough step is done".
- **Role tags, found in our own data (nothing changed):** the Wowhead lists rank Gloves of the Searing Grip (29947) only for physical specs: Feral #1, Retribution #1, Arms #1, Protection Warrior #2, Enhancement #2, Fury #3. Netherbane (29924) is ranked for Survival Hunter #1, Beast Mastery and Marksmanship #4, and Fury off hand #4 (Orc), with no tank. So "Caster DPS" and "Tank" both look wrong. Check with the tbc-researcher before changing anything.

## Where we left off (2026-10-11)

**The Simulation tab is decided and built into `simulation.html`:** design C, what to do next (stat priority, best upgrades, then the estimate with how far to trust it), with design A's damage-source table and breakdown under the estimate. Details are in the [README](README.md#simulation-what-to-do-next-on-the-real-model-2026-10-11).
- **It runs the live app's real simulator** in the page: `gen-sim-engine.mjs` bundles it from `src/` into `sim-engine.js` and writes `sim-data.js`. Regenerate both after the simulator or its data change.
- `checks/sim-handson.mjs a|b|c|p` pass; with the dev server up (`APP=`), the app gives the same estimate to the decimal.

**A live-app fix with it:** the upgrade finder (`findUpgrades.ts`) scored two-handers with the off hand still equipped (Twinblade of the Phoenix promised +145.8 DPS and cost 177). Each trial swap now goes through `applyWeaponSlotRules`, with a test.

**The live app's front door is decided and built into the app (2026-10-11):** design A, doors with a glimpse, with design B's goal line on each door, in `src/components/layout/SectionPicker.tsx` and `src/styles/global.css`. Details are in the [README](README.md#the-live-apps-front-door-2026-10-11-built-into-the-app). Two new tests in `tests/planner.spec.ts` cover it; the prototypes are `front-a/b/c.html`.

**Everything is committed and pushed (last commit `442bc3c`).** The handoff's top section was rewritten on 2026-10-11 as one current brief; read it first.

**Next: the walkthrough,** with Raids (research only just begun, nothing built; what's known is in the handoff), then Spec Tier Lists. Professions comes later.

**Still to check with the tbc-researcher, not changed:** the live app tags Gloves of the Searing Grip as Caster DPS and Netherbane as Tank, yet Wowhead's Fury list ranks both.

## Where we left off (2026-10-10, late night)

**Every Character Planner sub-tab is now decided and built into `planner.html`.** Today added the last two:
- **Ranked Gear** (committed, `4a49d96`): design A, the guide slot by slot as tooltips, with design C's "Where it drops" view behind a switch. See the [README](README.md#character-planner-the-ranked-gear-tab-2026-10-10).
- **Build**: design A, the share card, with design C's read-first "What came in" report on its paste box. B (character select) wasn't picked. See the [README](README.md#character-planner-the-build-tab-2026-10-10).
  - It uses the live app's own build format, so its share link opens the same character in the live app, and the example `/pdexport` loads in the app's own importer. `checks/build-handson.mjs` checks both against the dev server (`APP=` its address, or `APP=off`).
  - `gen-gear-data.mjs` now carries enchant effect ids and gem item ids, which the addon's export uses.

**To check with the tbc-researcher, not changed:** the live app tags Gloves of the Searing Grip as Caster DPS and Netherbane as Tank, yet Wowhead's Fury list ranks both.

**Next: the Simulation tab** (three designs, then the owner picks), then Raids and Spec Tier Lists. Professions comes later.
- Same pattern: copy `make-build-pages.mjs` and `checks/build-handson.mjs`, but for a whole tab (`simulation.html`) rather than a planner sub-tab.
- After each pick, update `DESIGN_NOTES` in `tools/brain/generate-brain.mjs` (Step 2 Walkthrough and the Tab Prototypes table) and run `npm run brain`.

## Where we left off (2026-10-10, afternoon)

**The live-app fixes are committed and pushed.** They cover talents, raid reach and totems, loot, notes and the credit, and are listed in the README's "Data corrections". The app's whole Playwright suite passed 297 of 297 on Edge first. To run it again: `npx playwright test -c playwright.edge.config.ts`.

**The owner's answered items, in order:**
1. ~~**Text accents follow each tab's colour**~~ **Done 2026-10-10:** Planner sky blue, Tier Lists emerald, Professions amber. See the [README](README.md#text-accents-follow-each-tab-2026-10-10).
2. ~~**The gallery is always dark**~~ **Done 2026-10-10.**
3. ~~**Publish the prototypes on GitHub Pages**~~ **Done 2026-10-10:** the gallery is at https://josephevenson08.github.io/project-defeat/prototypes/. See the [README](README.md#published-on-github-pages-2026-10-10); `checks/published.mjs` checks it.
4. ~~**Obsidian notes on the prototype work**~~ **Done 2026-10-10:** five notes under `brain/Project/Design/` (UI Refresh, Tab Prototypes, Step 2 Walkthrough, TBC Motion Kit, Prototype Publishing), written from `DESIGN_NOTES` in `tools/brain/generate-brain.mjs`. When a step is decided, update `Step 2 Walkthrough` and the `Tab Prototypes` table there and run `npm run brain`.
5. **Next: the walkthrough,** with the planner's Ranked Gear, then Build, then Simulation, Raids and Spec Tier Lists.

## Where we left off (2026-10-09, night)

**The Buffs tab is decided and built into `planner.html`:** design C, from your raid, with design A's icon tiles. Committed and pushed (`cd78079`).
- **A · Buff bar** (`buffs-a.html`): icons you click on and off, a row of Paladins with their Blessings, and four consumable slots.
- **B · What it adds up to** (`buffs-b.html`): switches beside a running total (attack power, crit, haste, the boss's armor, the hit cap).
- **C · From your raid** (`buffs-c.html`): pick the raid and your seat; every buff says who brings it or what's missing.
- The gallery shows the decision. Every check passes; details are in [`README.md`](README.md#character-planner-the-buffs-tab-2026-10-09).
- A fresh planner now opens at 140 / 48: the example 25-man raid's Balance Druid brings Improved Faerie Fire.
- **The owner's rules, built into all three:**
  - Heroism is raid-wide (Anniversary patch 2.5.5).
  - Shamans bring totems by spec.
  - Each Paladin is assigned a Blessing on this screen.
- **Next (as of then): the live-app fixes,** now done.

## Where we left off (2026-10-09, evening)

**The Talents tab is decided and built into `planner.html`:** design A, the talent window, with design C's "What's off" list (one-press fixes and "Show where").
- The three design pages stay as references, and the gallery shows the decision.
- Every check passes; details are in [`README.md`](README.md#character-planner-the-talents-tab-2026-10-09).
- Committed and pushed (work commit `7e1bc21`).

**Also done in the same step:**
- **The hit cap follows Precision:** 142 rating without it, 95 at 3/3, so the recommended set is 45 over the cap. The Compare tab no longer calls hit past the cap "wasted".
- **"Change character"** no longer shows its picker open on load.

**Next:**
1. **The Step 2 walkthrough continues with the planner's Buffs sub-tab:** three designs, then the owner picks. Then Ranked Gear and Build, then Simulation, Raids and Spec Tier Lists.
   - Same pattern: copy `make-talent-pages.mjs` and `checks/talents-handson.mjs`.
   - Buffs could feed the hit cap too: Improved Faerie Fire and a Draenei's Heroic Presence each lower it.
2. **The owner's answers (2026-10-09), to do after the Buffs design:**
   - **The five live-app fixes:** start them once the Buffs tab is done.
   - **Text accents follow each tab's colour:** yes.
   - **The gallery is always dark:** yes.
   - **Publish the prototypes on GitHub Pages:** yes. Plan the build change first and show the plan.
   - **Obsidian notes on the prototype work:** yes, with the brain-sync skill.
3. **The fix-it tasks in the live app** now number five. The two talent ones:
   - The stored presets skip Enrage and the filler points, so they break the game's row rules (it's not just Flurry).
   - `canRemovePoint` lets a point out from under a deeper talent.

## Where we left off (2026-10-09, later)

**The Character Planner's Gear and Compare tabs are both decided and built into `planner.html`.** Everything is committed and pushed (last work commit `3659a74`).
- **Gear:** B, the character sheet, with C's "What's left" checklist.
- **Compare:** A, side-by-side tooltips, with B's one-sentence summary.
- The design pages stay as references, and the gallery shows both decisions.
- Every check passes, with full details in [`README.md`](README.md).

**Next (as of then):**
1. **The Step 2 walkthrough continues with the planner's Talents sub-tab:** three designs, then the owner picks. Then Buffs, Ranked Gear and Build, then Simulation, Raids and Spec Tier Lists. Professions waits until later.
   - The pattern so far: copy `planner.html` with only that sub-tab swapped (see `make-compare-pages.mjs`), test with a `checks/*-handson.mjs`, show the three side by side, then build the pick into `planner.html`.
   - Ranked Gear could read the shared character too, as Compare does.
2. **The fix-it tasks** (see the list further down).
3. **Open question:** should the text accents follow each tab's colour, as Raid Composition's gold does?

**Offered, not yet answered: Obsidian notes for the newer work.** The owner asked on 2026-10-08 whether the vault (`brain/`) is up to date. Running `npm run brain` changed nothing: it matches the code. It has no notes on the design prototypes, the UI refresh plan or the Discord bot plan, though. Add those (with the brain-sync skill) if the owner wants them.

**Waiting on the owner's go-ahead: publish the prototypes on GitHub Pages.**
- **Today:** the live site (`josephevenson08.github.io/project-defeat/`) is only the real app, which is unchanged since 2026-09-30. The prototypes aren't published, and github.com shows them as code.
- **The idea:** have the deploy build copy `docs/design/prototypes/` to `/prototypes/`, and point the prototypes' icon path at the site's own `/icons/` instead of `../../../../public/icons/`.
- **Status:** the owner asked to wait (2026-10-08). Plan it and get approval before changing the build.

## Where we left off (2026-10-08)

**Done on 2026-10-08:**
- **Raid Composition** is dark, adds players from a click-to-fill palette of spec icons, and names them with a pencil. See the [README](README.md#raid-composition-the-planning-table-2026-10-07).
- **The curtain between tabs is gone.** The owner didn't like it, so tab links are plain links on all seven tabs. See the [README](README.md#no-curtain-between-tabs-2026-10-08).
- **The gallery** (`../index.html`) now shows the current tabs first, with each tab's colour in its description. The dropped designs follow with the reasons: the three portal Homes and Raid Composition B, plus a note that C was dropped. The gallery also gained a doctype and UTF-8, so "·" no longer shows as "Â·", and all 40 of its links open.

**To view the prototypes in the in-app browser pane,** start the `prototypes` server from `.claude/launch.json` (Python on port 8765). Then open `http://localhost:8765/docs/design/prototypes/index.html`. The pane opens local files as static snapshots, so icons and `tbc-kit.js` don't load that way.

**Next:**
1. **The Step 2 walkthrough:** three designs per step, and the owner picks one. Home and Raid Composition are settled, so it picks up at the Character Planner's sub-tabs (Gear, Compare, Ranked Gear, Talents, Buffs, Build). Then Simulation, Raids and Spec Tier Lists. Professions waits for a later update.
2. **The fix-it tasks** (see the list below).
3. **Open question:** should the text accents follow each tab's colour, as Raid Composition's gold now does? They are teal on the other dark tabs.
4. **Minor:** the gallery page itself follows the system's light or dark setting. Make it always dark if the owner wants.

## Where we left off (2026-10-07, night)

**Steps 1 and 2 of the list below are done.** Every tab has its own background, and Raid Composition
has its chosen planning table.

**Raid Composition (decided 2026-10-07):**
- **The owner picked design A, the Terrace of Light.** It is now `raid-composition.html`, so every tab's link reaches it.
- **Its background is A's own white-gold terrace,** with one ring of light per group that fills as that group's buffs are covered.
- **The `raidcomp` kit theme was removed.** It was the white-gold water with five lights, built earlier that day.
- **B** (`raid-comp-b.html`, Hellfire) is kept for reference.
- **C was dropped** unbuilt, and its unfinished copy deleted.
- **Testing:** both tables passed a hands-on browser test of every control, and phone tap targets were fixed on both. Details are in [`README.md`](README.md#raid-composition-the-planning-table-2026-10-07).

**Next, in order:**
1. ~~**Raid Composition: click-to-fill, a pencil for names, and a dark page**~~ **Done 2026-10-08** (the owner's feedback on design A, 2026-10-07).
   The owner prefers how adding worked before to pressing "+ Add" on a seat and using the picker dialog.
   - **A palette of every class and spec, always on screen.** Clicking one seats that spec in the next open seat automatically, filling group 1 first, then 2, through to 5.
   - **A small pencil icon on each player's tag** to type their name. It replaces the "Name" button.
   - **Make the page dark, like the other tabs.** The owner prefers dark to A's light page. A was light only because of its "Terrace of Light" concept. This means:
     - Swap A's light colours (page, panels, ink, chips, picker) for the dark ones the other tabs use. The table layout stays.
     - Give it a dark background that keeps the warm white-gold. Two ways to do that, to put to the owner:
       - (a) Darken A's terrace scene and keep its per-group rings, which fill as buffs are covered.
       - (b) Restore the dark white-gold water theme with five orbiting lights. It was removed today and is in git at `2ec0e64` (`tbc-kit.js`: `raidcomp` in `EXTRA_HEX`, `AUC` and `ROCK_HEX`, plus `buildGroupLights`).
     - Re-check contrast on the dark version.
   - **Keep:** Move and drag, Remove, Undo, 10/25, example, Clear, and the results.
   - **The live app already does this.** Port it:
     - `src/features/raidcomp/RaidCompositionPanel.tsx`: the "Add a spec" palette is lines 501–537, grouped by class in class colours. `place()` and `targetGroup` are lines 320–330: the selected group if it has room, else the first group with room.
     - `addToGroup` in `src/domain/raidcomp/rosterTypes.ts`.
     - The app also lets you click a group to make it the target. Worth keeping.
   - **Open question before building: icons.** The app uses real spec icons (`raidcompIcons.json`). The prototypes have used no Blizzard art so far. Either reuse the app's icons, which the live app already ships, or draw stand-ins (class-colour gems with the spec's initial). Ask the owner.
   - **Then** re-run `checks/rc-handson.mjs a`. Its Add steps use the dialog, so update them to the palette and the Name steps to the pencil.
2. **Gallery** (`../index.html`):
   - Mark the three portal Home designs and Raid Composition B as superseded.
   - Note that C was dropped.
   - Make sure the seven tabs show their current look.
3. **The Step 2 walkthrough:** resume it for the remaining tabs. Professions waits for a later update.
4. **The fix-it tasks** (see the list below).
5. **Open question:** should the text accents (links, headings, buttons) follow each tab's colour? They are teal on every dark tab.

**`tabs/checks/`** holds the test scripts. Run each from the repo root; they use Playwright on system Edge.
- `rc-handson.mjs a|b`: the table test. Set `WIDTH=400` for a phone and `RM=1` for reduced motion.
- `rc-taps.mjs`: phone tap sizes.
- `check-bg.mjs`: every tab in 4 modes.
- `scene-only.mjs`: background screenshots. It needs the `OUT` environment variable set to a folder.

## Where we left off (2026-10-07, earlier)

**Step 1 of the list below is done: every tab has its own background.** The owner approved the colour
list as proposed, and decided two things about Home:
- The fel-green portal ignition is replaced by one soft crystal swell per browser session.
- Home's Serpentshrine/Tempest Keep backdrop switch is removed, so Home always shows its own teal.

What was built and how it was checked is in [`README.md`](README.md#per-tab-backgrounds-2026-10-07). In
short: four new themes in `tbc-kit.js`, one line per page to pick one, and a matching WebGL-off fallback
on each page.

**Two values differ slightly from the approved swatches:**
- Raid Composition's crystal and water are warmer (`#ffe2a6` over `#1a1610`, not `#fff3d6` over
  `#17161c`). The first version rendered silver-grey rather than white-gold.
- Professions' pillars are dark brown stone instead of violet, so the ore veins read.

Both are easy to revert.

**Next, in order** (steps 2 to 5 of the list below):
1. **Raid Composition:** finish C or skip it, re-test A's and B's tables hands-on (Move, drag, Remove, Rename, Clear), and let the owner pick one. B's Hellfire orange sits near Professions' amber, which is worth weighing.
2. **Gallery:** update it.
3. **Step 2 walkthrough.**
4. **Fix-it tasks.**

**Open question for the owner:** the text accents (links, headings, buttons) are still teal on every
tab. On Professions (amber) and Tier Lists (emerald), they could follow the tab's colour too. This was
out of scope, so it was left alone.

## Where we left off (2026-10-05)

Work stopped on purpose ahead of the weekly usage limit. The original plan from 2026-10-04 follows
further down, for reference.

### The owner's new direction for the background (decided 2026-10-05)

- **Drop the Dark Portal designs and keep it simple.** Of the three portal Home pages, the owner liked **Home B, The Approach**, best. But the decision is to drop the portal concept altogether rather than build on it.
- **Go back to the original crystal look:** the naaru-like crystal over the cool, light teal-blue water from Round 4 and the Step 1 tabs.
- **Give every tab its own version of that background.** Each tab gets its own background scene and **its own colour**, so the tabs feel related but no two match.
- **Scope:** this is about the background scenes only (the 3D model and colour behind each page). The layouts and content of the tabs stay as they are.

**What to build next session:** one simple background per tab. For each one:
- The same crystal-and-water family as the original.
- Its own colour palette.
- Its own small signature detail.

These are only starting points. Propose them to the owner before building:

| Tab | Starting idea for colour and detail |
| --- | --- |
| Home | The original light teal-blue crystal, the "signature" look |
| Character Planner | Deep sea blue, with slow rising bubbles |
| Simulation | Gold over violet (it already has this, and the owner likes it) |
| Raid Composition | Warm white-gold light |
| Spec Tier Lists | Emerald green |
| Raids | Changes per raid (it already does this, and the owner likes it) |
| Professions | Amber, with ore-vein glints |

Keep the existing rules: no Blizzard assets, the Motion and 3D toggles, reduced motion, the WebGL
fallback, AA text and no sound. Build each background as a theme in `tbc-kit.js`, or as a small shared
background module, so every page reuses one scene with a different palette and detail. That keeps it simple.

### What is done (and pushed)

- **Step 1:** all seven tab pages, in `tabs/`.
- **The TBC motion kit:** `tabs/tbc-kit.js`.
- **Character Planner:** the row hover and keyboard-focus highlight, checked in a browser.
- **Raids:** loot search across all five raids, which filters loot and narrows the boss list. Checked in a browser: "destroyer" finds 8 drops in 2 raids.
- **Three Home designs around the Dark Portal:** `home-a.html`, `home-b.html`, `home-c.html`. All three passed the checks, but they are **now superseded** by the decision above. They are kept for reference.

### What is in progress

**Raid Composition: three designs, each with its own theme and a working raid table.**
- **A, Terrace of Light** (`raid-comp-a.html`, Shattrath gold-white): built, and it passed the standard checks.
  - A hands-on browser test confirmed that **adding a player** (an Enhancement Shaman named "Thrallson") and **loading the example roster** both work.
  - The **Move** step timed out in the test. That may be the test's own button selector rather than a page bug. Re-test Move, drag, Remove, Rename and Clear before showing it to the owner.
- **B, Hellfire War Camp** (`raid-comp-b.html`, torchlit iron and orange): built and logic-tested by its designer in node. It has **not yet** been through the browser checks or the hands-on test.
- **C, Arcane Tactical Board** (`raid-comp-c.html`): **not done.** The usage limit stopped its designer just after it copied the old page. The file is an unfinished copy, left uncommitted. Rebuild it next time.

With the new direction, Raid Composition's backgrounds should follow the "own colour per tab" idea too.
Its **planning table** stays the priority: the owner needs to be able to actually plan a raid. When
it's shown to the owner, focus on picking the best table, not the scenery.

### What is left, in order

1. ~~**Backgrounds:** confirm the per-tab colour and detail list with the owner, then build one simple background per tab. Drop the portal from Home.~~ **Done 2026-10-07.**
2. ~~**Raid Composition:**~~ **Done 2026-10-07: the owner picked A, and C was skipped.**
   - finish C (or skip it if the owner is happy with A or B);
   - re-test the table hands-on in a browser;
   - show the owner the tables, and let them pick.
3. **Gallery:** update it. Mark the portal Home designs as superseded, and add the Raid Composition designs.
4. **Step 2 walkthrough:** resume it for the remaining tabs. Professions waits for a later update.
5. **Separate fix-it tasks** that came out of the prototype work:
   - the Felguard doc contradiction;
   - the incomplete Fury Warrior talent preset;
   - Lady Vashj's helm token;
   - the zone-map attribution wording.

---

## The original plan (2026-10-04)

**Written 2026-10-04 from the owner's review of the seven tab pages (with the TBC motion kit). Nothing
here is built yet.** This is the starting point for the next session, and it folds into the Step 2
walkthrough (three designs per step).

## The big theme: every tab gets its own look

The owner wants **each tab to have its own style of animation, design and colour**, rather than one
shared Serpentshrine look across most of them. The shared base stays the same on every tab: the top
navigation, the Motion and 3D toggles, the fallbacks, accessibility, and the `tbc-kit.js` building
blocks. What should differ per tab is the scene, the palette and the motion personality.

These are suggested identities to confirm when Step 2 starts. The owner's words decide.

| Tab | Owner's verdict | Proposed identity |
| --- | --- | --- |
| Home | Change the aesthetic (see below) | **The Dark Portal:** a fel-green portal under a nether sky |
| Character Planner | Looks good | Serpentshrine water, as now |
| Simulation | Liked | Tempest Keep crystalline fortress, as now |
| Raid Composition | Needs its own theme, and the planner is incomplete | Something new, e.g. a war-room table, or Shattrath's naaru gold-white light. To pick in Step 2. |
| Spec Tier Lists | Liked | Keep, but give it a colour of its own so it doesn't repeat Planner |
| Raids | Looks good | Per-raid scenes, as now |
| Professions | Bland, but can wait for a later update | Later, e.g. Zangarmarsh or Nagrand. Not in this pass. |

## Tab by tab

### Home: rebuild the scene around the Dark Portal

The owner shared a reference screenshot of the Dark Portal in Hellfire Peninsula. The screenshot is
Blizzard game art, so it is **not stored in the repo** and must not be used or traced. It is described
here so the look can be rebuilt in our own code, following `docs/research/wow-tbc-motion/usage-rules.md`:

- **Portal:** a tall rectangular gateway, glowing bright fel green at its edges. The green is a churning, swirling energy, with a dark starry void inside that holds orange and brown nebula flecks. **This green is what should animate:** the swirling fel energy and the starfield drifting inside it.
- **Sky:** a night sky of deep purple, magenta and violet, with scattered stars, warm orange and brown dusty clouds lower down, and a fel-green light beam slanting across the top right. **The sky should be part of the animation too:** slowly drifting nebula and twinkling stars.
- **Surroundings:** a massive carved stone arch with spikes and two hooded guardian statues, and red-brown rock cliffs on the left. These set the mood only. Build our own simplified, stylized arch silhouette, not a copy of the in-game model or statues.

**Build plan:**
- Replace Home's Serpentshrine water with this scene.
- The portal surface is a shader built from the kit's K1 vortex: a fel-green swirl at the edges and a starfield inside.
- The sky is a nether shader (K2's aurora, pushed toward purple and magenta) with a star layer and one slanted fel beam.
- The intro (K1 ignition) becomes the portal opening.
- All the existing must-haves still apply: WebGL fallback, reduced motion, Motion and 3D toggles, contrast checked against the brightest frame.
- In Step 2, make three Home designs that each take this scene in a different direction.

### Character Planner: add a row hover highlight

The page is approved as it is. Add a clear **hover highlight on the row under the pointer** in the gear
list, and wherever rows appear (Compare, Ranked Gear, Buffs). Give keyboard focus a matching
highlight, so the highlight isn't mouse-only.

### Simulation: keep it

Liked as is. No changes planned.

### Raid Composition: a new theme, and make raid planning fully work

1. **Its own theme.** Different animation, design and colour from the other tabs (see above).
2. **The raid table must be complete.** The owner couldn't find a way to actually plan a raid. The
   prototype shows an example roster, but the planning surface is missing. It needs:
   - **The seating chart as a table:** five groups of five for 25-player, two groups for 10-player, with empty seats shown as empty.
   - **Adding players:** a class and spec picker to put a real spec into an empty seat, plus an optional player name. This mirrors what the live app already supports.
   - **Changing seats:** move or swap seats with both press-to-move and drag, and remove a player.
   - **Live results as seats change:** per-group buffs, role balance, and the "missing, and who fixes it" list (these exist today).
   - **Clear and reset:** start from an empty raid, or load the example roster.
   - **Export:** the "Export image" action. The prototype can still stub the real file.
   - **Keeping work:** optionally, keep the roster for the session.
   - **Check it against the live app** (`src/features/raidcomp`) so the prototype covers everything the real tab does.

### Spec Tier Lists: keep it

Liked. Only the tab's own colour, as part of the per-tab identities.

### Raids: add search

Looks good. Add a **search bar** that filters loot by item name across the selected raid, and also
**narrows the boss list** to the bosses that drop a match. Ideally it can search all five raids at once
and show which raid each match belongs to. Matches should be highlighted, the result count announced
to screen readers, and clearing the search should restore everything.

### Professions: later

Bland right now, but it's fine to leave for a later update. Not part of this pass.

## Order for next session

1. **Home:** three designs around the Dark Portal scene.
2. **Raid Composition:** three designs, each with its own theme and a fully working raid table.
3. **Raids:** add the search bar.
4. **Character Planner:** row hover highlight.
5. **Per-tab colour and motion identities** for Spec Tier Lists, and anywhere else two tabs still look
   alike.
6. **Then resume the Step 2 walkthrough** in the agreed order. Professions waits for a later update.

Same process as before:
- Build in parallel, in small pieces.
- Check every page at 400px and 1280px, with reduced motion and with WebGL off, and review screenshots.
- Document and update the gallery.
- Commit and push once the owner says go.
