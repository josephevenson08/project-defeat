# Tab prototypes

**Step 1, the baseline (done 2026-10-04).** One page per tab of the site, all in the chosen
[Round 4](../round4/) style. They link to each other through the top navigation, so the seven work as
one clickable prototype of the whole site. Start at [`home.html`](home.html). Brief:
[`TABS-BRIEF.md`](TABS-BRIEF.md).

**Next session:** start from the top of [`NEXT-SESSION-PLAN.md`](NEXT-SESSION-PLAN.md). The Character Planner's Gear and Compare tabs are decided (see [Compare](#character-planner-the-compare-tab-2026-10-09) and [Gear](#character-planner-the-gear-tab-2026-10-09)). So is [Talents](#character-planner-the-talents-tab-2026-10-09). So is [Buffs](#character-planner-the-buffs-tab-2026-10-09), and so are [Ranked Gear](#character-planner-the-ranked-gear-tab-2026-10-10) and [Build](#character-planner-the-build-tab-2026-10-10), so every planner sub-tab is decided. So is [Simulation](#simulation-what-to-do-next-on-the-real-model-2026-10-11). The live-app fixes are committed, and [the text accents follow each tab](#text-accents-follow-each-tab-2026-10-10). So is the [live app's front door](#the-live-apps-front-door-2026-10-11-built-into-the-app), now built into the app. So is [Raids](#raids-the-boss-journal-with-your-raids-loot-2026-10-11), so is [Spec Tier Lists](#spec-tier-lists-the-tier-board-and-the-logs-beside-it-2026-10-12), and so is [Professions](#professions-the-profession-window-and-which-two-to-take-2026-10-12): **every tab of the walkthrough is decided.** **The decided designs are now going into the live app** ([port plan](../../PORT-PLAN.md)): the look (step 0) and Spec Tier Lists (step 1) are in, 2026-10-12.

**Step 2.** Go tab by tab, with three parallel designs per step. The owner picks one per step.
Agreed order:
1. Home
2. Gear
3. Compare
4. Ranked Gear
5. Talents
6. Buffs
7. Build
8. Simulation
9. Raids
10. Raid Composition
11. Spec Tier Lists
12. Professions

## The TBC motion kit (added 2026-10-04)

All seven pages share [`tbc-kit.js`](tbc-kit.js), the motion kit from
[`docs/research/wow-tbc-motion/recommendations.md`](../../../research/wow-tbc-motion/recommendations.md).
It is built once and exposed as `window.TBCKit`. Every effect is procedural, with no Blizzard art and no
sound. Each page connects its Three.js scene through a documented `window.SCENE` contract (the top of
`tbc-kit.js`), and all pages now load GSAP 3.13.0 with DrawSVG and SplitText.

| Page | How it uses the kit |
| --- | --- |
| Home | A crystal swell once per browser session (until 2026-10-07 this was the portal ignition, blue to fel green). Shattered sky over Coilfang water. Entry rings on tab cards. A rune ring and naaru swell on import. |
| Character Planner | Calm deep-sea-blue water with rising bubbles (originally Coilfang teal). Entry rings between sub-tabs. A swell on equip, share and import. A taint tint on the hit-cap warning. A rebirth burst on "Reset to recommended set". A one-time lift when all 17 slots match. |
| Simulation | Crystalline fortress (Tempest Keep). On Simulate: fel embers and a rune ring while it charges, then a swell and entry rings when the result lands. |
| Raid Composition | Calm warm white-gold water. One light per raid group circles the crystal and brightens as that group's party buffs are covered, through `TBCKit.groups()`. Entry rings on placed and swapped seats and on 10/25. A swell when a change gives a group a buff it was missing. |
| Spec Tier Lists | Emerald water with rank rings (originally Coilfang teal). Entry rings on the boards and panels as they arrive, and the spec tiles land row by row. (Step 1 had 3D shelves on a rune-ring base; the 2026-10-12 design replaced them with the tier board.) |
| Raids | The scene follows the raid: Serpentshrine water, Tempest Keep crystal, Magtheridon's Hellfire embers and red sky, Gruul's Blade's Edge dusk, Karazhan arcane violet. Entry rings on the boss page and the raid's panels as they arrive. (Step 1 also drew a rune ring beside each attunement chain; the 2026-10-11 design moved the chain into "About the raid" without it.) |
| Professions | Calm amber water with ore veins (originally teal). Entry rings on the panels as they arrive, and a gathering route draws itself along its circuit. (Step 1 had fel embers and a rune ring behind Mining's Fel Iron route; the 2026-10-12 design draws every range's route without them.) |

**Kit fixes made during the rollout:**
- Motion off now ends embers that a user action started, while a raid theme's embers stay in the still frame.
- The naaru glow now hides with the crystal.
- The contract now states that the kit owns the crystal's, halo's and lamp's brightness.

**Checks:** all seven were checked with Playwright on Edge at 1280px, at 400px, with reduced motion and with WebGL disabled. There were no script errors, failed loads, sideways scroll or invisible content. Screenshots confirm the ignition and the per-raid themes.

The automated browser renders 3D in software, so it always picked the low performance tier. The medium and high tiers haven't been seen yet.

## Per-tab backgrounds (2026-10-07)

The owner's direction from 2026-10-05: drop the Dark Portal, keep the original crystal over water, and
give every tab its own colour. The layouts, content and text colours are unchanged.

Each colour is a theme in `tbc-kit.js`. A page picks it with one line, such as
`KIT.theme("planner",{instant:true})`. The four new themes each add one small detail. The kit builds a
detail the first time its theme is shown, and the detail fades in and out with its theme. Each page's
WebGL-off fallback gradient uses the same colour.

| Tab | Theme | Colour | Signature detail |
| --- | --- | --- | --- |
| Home | `ssc` | Teal, the original | Light shafts and the water pulse. The fel-green portal ignition is gone: the crystal now swells softly once per browser session. The Serpentshrine/Tempest Keep backdrop switch was removed, so Home always shows its own teal. |
| Character Planner | `planner` | Deep sea blue | Slow rising bubbles |
| Simulation | `tk` | Gold over violet (unchanged) | Crystal pillars |
| Raid Composition | `raidcomp` | Warm white-gold | One light per raid group circling the crystal, each as bright as its group is covered (two lights at 10-player). Design A first kept its own light terrace; the owner asked for dark on 2026-10-08, so the page now uses this theme, with the shared scene warmed to match. |
| Spec Tier Lists | `tiers` | Emerald | Three dashed rings of light stepping up under the crystal, like a podium |
| Raids | follows the raid (unchanged) | Per raid | As before |
| Professions | `profs` | Amber | Veins of ore up the dark stone pillars, with a glint running up each one now and then, and ore glints on the floating rocks |

- **Contract change:** a page may list its pillars as `SCENE.three.pillars` (optional). Professions does this so the ore veins can follow them.
- **Accessibility:** no detail flashes. Each glint, light and bubble moves on its own slow cycle, and reduced motion shows a still frame.
- **Checks:** Playwright on Edge for all seven pages, at 1280px, at 400px, with reduced motion and with WebGL off. There were no script errors, failed loads or sideways scroll. The only console message is Three.js reporting that WebGL is off, in the WebGL-off runs, where it's expected. Scene-only screenshots were reviewed for every tab. In review, the bubbles and ore veins were too faint to see and were made larger, and Raid Composition read silver rather than gold and was warmed.

## The live app's front door (2026-10-11, built into the app)

The owner asked to rework the live app's front door, the 5-card section picker (`src/components/layout/SectionPicker.tsx`).
Three standalone prototype pages were built (`make-front-pages.mjs`), over `front-common.js` and `front-data.js`
(`gen-front-data.mjs` counts everything from `src/`). **The owner picked A, doors with a glimpse, with B's goal line on
each door,** and it is built into the live app.

| Design | Page | What it is |
| --- | --- | --- |
| **A · Doors with a glimpse (picked)** | [`front-a.html`](front-a.html) | The cards stay, each with a real glimpse of what's behind it (the recommended set's icons, a raid's buffs, the top tier, the raids' own art, the professions) and a counted fact; Character Planner is the big door, with the simulator and the import beside it. |
| B · What are you here to do? (goal lines merged in) | [`front-b.html`](front-b.html) | Goal first, since the goal chose the first click in the usability study: one list of jobs, each naming the section it opens, with the import as the seventh. |
| C · Game menu (not picked) | [`front-c.html`](front-c.html) | A rail of big entries over the backdrop, with a large preview that follows the entry you point at or move to with the arrow keys. |

- **What the study found, kept and fixed:** the cards say what they do (kept); each door is now named by its title alone, with its sentence, goal and fact as its description (the screen-reader user heard five paragraph-long names); Simulation has a door (the theorycrafter found nothing that mentioned it); there is a source link (the developer found none).
- **In the live app** (`SectionPicker.tsx`, `src/styles/global.css`): the app's own metal-framed cards and muted section colours, Character Planner as the big door with Simulation and the import panel beside it, then the other four. Every glimpse and fact comes from the modules the sections read: the Fury rank-1 list's icons, the 21 raid buffs the app counts, Wowhead's S tier, the raids' art and 5 raids, 24 bosses and 464 drops, and the 13 professions' icons. The test ids are unchanged, so the suite's front-page tests still run; two new tests check the names, descriptions and counts, and that the Simulation door leads through character creation into the simulator.
- **The prototypes:** the import really works there too (it reads the paste the way the Build tab does and opens the planner wearing it). They use the owner's own `backdrop.jpg` and raid art (ChatGPT generations, settled in the handoff); `backdrop.webp` is a different picture, the five-raid collage. `checks/front-handson.mjs a|b|c` pass at 1280px, at 400px and with reduced motion.

## Professions: the profession window, and which two to take (2026-10-12)

The last step of the walkthrough. Three designs were built from `professions.html` with only the picker and profession
page swapped (`make-prof-pages.mjs`), over `profs-common.js`: the amber scene and motion, profession icons, payoff tags,
each recipe's skill colour at a skill, routes on a plain grid, the shopping-list maths and your skill in each profession
for the session. **The owner picked A, the profession window, with B's comparison behind a switch ("Level it / Which
two").** That is now `professions.html` (built with `make-prof-pages.mjs --tab`).

| Design | Page | What it is |
| --- | --- | --- |
| **A · The profession window (picked)** | [`profs-a.html`](profs-a.html) | Like the game's own: pick a profession's icon, set your skill on the bar (trainer stops marked) and every recipe on the path to 375 takes its colour at that skill, orange, yellow, green or grey. Pick one for its reagents (who gathers them, what a vendor charges), what it makes and its colour thresholds. A gathering profession lists its ranges, with the zones, the guidance and the computed route. The hash carries the profession. |
| B · Which two to take (merged in as "Which two") | [`profs-b.html`](profs-b.html) | Every profession by what it gives a level 70 character, led by what it makes for your spec from Wowhead's lists (for Fury: Blacksmithing's Dragonstrike, the #1 main hand, bind on pickup). Pick two primary professions to see the pair: places on your list, the one stat bonus, and whether one feeds the other (Mining supplies 97% of Blacksmithing's farmed materials). |
| C · The road to 375 (not picked) | [`profs-c.html`](profs-c.html) | From your skill to 375 as one road, trainer stops as waypoints and passed steps folded away, beside the shopping list from the start of your step: vendor reagents priced, farmed ones counted with who gathers them. |

- **The data is the live app's.** `gen-prof-data.mjs` bundles `src/domain/professions` into `prof-data.js`: the 13 profiles, trainer stops and payoffs, the nine crafting paths (201 recipes with counts, reagents, vendor prices, and each recipe's skill colours from `tools/ingest/data/professionRecipes.json`, the source the paths were computed from), the four gathering guides (32 ranges with up to three zone routes each, as zone percentages), the 165 profession-made places on Wowhead's lists, and a material-to-gatherer map.
- **No zone map art:** the live app ships Blizzard's zone maps, but the owner kept the prototypes to icons only (2026-10-12), so routes are drawn on a plain grid.
- **In the tab,** the switch is remembered for the session (`pd-prof-view`); `#which` opens the comparison and a profession's name (`#mining`) the window. Your skill in each profession (`pd-prof-skill:<name>`) is shared with the other designs.
- **Real numbers the checks pin:** Rough Sharpening Stone is orange at 1 and green at 40 (its colours are 1/15/35/55); Blacksmithing has 33 path recipes and four trainer stops; Mining has 9 ranges, with Adamantite at 325-350; Blacksmithing from 1 needs 34s from vendors.
- **Checks:** `checks/profs-handson.mjs a|b|c|p` pass at 1280px, at 400px (44px targets) and with reduced motion; `p` runs A's steps, the switch, then B's. All three work with WebGL off, and `check-bg.mjs` passes all seven tabs.

## Spec Tier Lists: the tier board, and the logs beside it (2026-10-12)

Three designs were built from `tier-lists.html` with only the lists swapped (`make-tier-pages.mjs`), over
`tiers-common.js`: the emerald scene and motion, spec chips with the live app's spec icons in class colours, a spec
tooltip, a full spec card, and the Raid Composition raid for the session. **The owner picked A, the tier board, with
B's chart behind a switch ("The board / Against the logs").** That is now `tier-lists.html` (built with
`make-tier-pages.mjs --tab`).

| Design | Page | What it is |
| --- | --- | --- |
| **A · The tier board (picked)** | [`tiers-a.html`](tiers-a.html) | Wowhead's three lists as the familiar board: S to D rows of spec icons in class colours, damage on top, healing and tanking side by side. Press any spec for its card: its place on every list, what the logs say, what it brings to a raid and its signature ability. Your spec starts selected (remembered for the session); a class filter dims the rest. |
| B · Two opinions (merged in as "Against the logs") | [`tiers-b.html`](tiers-b.html) | The 20 damage specs ranked by archon.gg's observed DPS, each with Wowhead's tier and archon's, the disagreements spelled out; sort by Wowhead's tier (with Flip motion), or show only where they disagree. Healers and tanks are Wowhead's opinion alone, and say so. |
| C · What each spec brings (not picked) | [`tiers-c.html`](tiers-c.html) | Spec cards with the buffs and debuffs each brings; pick one of the 40 to light who brings it; the specs in your Raid Composition raid are counted, and "Would add" names who would bring something the raid lacks. |

- **The data is the live app's.** `gen-tier-data.mjs` bundles `src/domain` into `tier-data.js`: Wowhead's three Phase 2 lists (28 placements over 27 specs), archon.gg's observed average DPS and tier for the 20 damage specs (`dpsReference.ts`, read 2026-08-23), and per spec its role, class colour, spec icon, signature ability and what it brings to a raid (the same `seatContributions` Raid Composition counts: 86 links to 40 buffs and debuffs).
- **Real numbers the checks pin:** Retribution Paladin is B on Wowhead and 5th by observed DPS (1,785); Fury Warrior is S on Wowhead, A on archon, 3rd (2,053); Wowhead and archon agree on 9 of the 20 (the logs rate 3 higher, Wowhead 5, and Wowhead's three D-tier specs are archon C); Feral averages the 10th-highest DPS yet sits in Wowhead's C.
- **In the tab,** the switch is remembered for the browser session (`pd-tiers-view`), and `#logs` and `#board` link to each view. The tier letters stay neutral, as in the live app; the colour on a spec is its class colour.
- **Found, not changed:** the app's buff data (Raid Composition's) is built around what a raid gives its damage dealers, so caster-side debuffs and mana are not in it: Shadow Priest brings only its raid buffs there. Design C said so on the page; it is open for the owner.
- **Checks:** `checks/tiers-handson.mjs a|b|c|p` pass at 1280px, at 400px (44px targets) and with reduced motion; `p` runs A's steps, the switch, then B's. All three work with WebGL off, and `check-bg.mjs` passes all seven tabs.

## Raids: the boss journal, with your raid's loot (2026-10-11)

Three designs were built from `raids.html` with only the content area swapped (`make-raids-pages.mjs`), over
`raids-common.js`, which keeps the shell every design shares: the raid picker that re-lights the scene and keeps the
raid in the hash, the loot search across all five raids (whose results now open a drop where it drops), game-style
item tooltips and the motion. **The owner picked A, the boss journal, with C's raid view behind a switch ("For me /
For my raid").** That is now `raids.html` (built with `make-raids-pages.mjs --tab`).

| Design | Page | What it is |
| --- | --- | --- |
| **A · The Adventure Guide (picked)** | [`raids-a.html`](raids-a.html) | One boss at a time, like the game's boss journal: the raid's bosses down the side with the owner's art, the chosen boss's loot as icons with tooltips, and "Loot for" any of 27 specs (Fury Warrior first) putting that spec's picks on top with their rank. "About the raid" holds the facts, the way in and the attunement chain; "The fight" holds the mechanics. The hash carries the boss. |
| B · The way in (not picked) | [`raids-b.html`](raids-b.html) | Progression first, like the Attune addon: five doors that open as you tick off the attunement steps you've done (kept in the browser), the chosen raid's next step and which other raid it needs, then what waits inside for your spec. |
| C · From your raid (merged in as "For my raid") | [`raids-c.html`](raids-c.html) | A loot plan for the raid built on Raid Composition (or its example): every drop with who in the raid wants it, as spec icons with their rank, most wanted first, contested drops marked (three or more raiders rank it first). A tier token counts for whoever wants a set piece it buys. Press a raider for their wishlist. |

- **The data is the live app's.** `gen-raid-data.mjs` bundles `src/domain` (raids, the item catalogue, icons, the raid builds and `bisRankings.json`) into `raid-data.js`: 5 raids, 24 bosses, 469 drops (399 distinct items, 345 with stats, 228 on at least one Wowhead list). The Step 1 page's pasted copy of the loot (462 drops) is gone. Regenerate after any of those change.
- **The ranks:** every drop carries its rank on each of the 27 specs' Wowhead Phase 2 lists. Rogue's three specs share one guide and so do Priest's two healers. Wowhead's Feral list is cat DPS, so a Feral (Bear) tank has no list, and the raid view says so rather than guessing.
- **In the tab,** the switch is remembered for the browser session (`pd-raids-view`), `#raid/raid` links to the raid view and `#raid/boss` to a boss, and the search opens a drop in whichever view is showing. The raid view reads Raid Composition's raid for the session (`pd-raidcomp-a:v1`) when it is the raid's size, and the example 25 or 10 otherwise, and says which.
- **Real numbers the checks pin:** Hydross has 2 drops on the Fury list; Gloves of the Searing Grip are #1 on the Feral list; Dragonspine Trophy is on 10 lists, wanted by 9 of the example 25, all as their first pick; Belt of One-Hundred Deaths is wanted by 11 (8 first).
- **Live-app fixes from this step** (in `src/`, with a test): see "Data corrections" below.
- **Checks:** `checks/raids-handson.mjs a|b|c|p` pass at 1280px, at 400px (44px targets) and with reduced motion; `p` runs A's steps, the switch, then C's. All three work with WebGL off, and `check-bg.mjs` passes all seven tabs (its only messages are the expected WebGL-off ones).

## Simulation: what to do next, on the real model (2026-10-11)

The first whole-tab step after the Character Planner. Three designs were built from `simulation.html` with only the
result area swapped, over `sim-common.js`. **The owner picked C, guidance first, with A's damage-source table and
breakdown under the estimate.** That is now `simulation.html`.

| Design | Page | What it is |
| --- | --- | --- |
| A · The log (table merged in) | [`sim-a.html`](sim-a.html) | Press Run: the estimate against what Fury warriors average, the damage sources as a table with bars, how the number was computed, and what it misses for you; stat priority and the upgrade finder in tabs underneath. |
| B · The workbench (not picked) | [`sim-b.html`](sim-b.html) | Your character as the baseline; switch buffs, debuffs and consumables or try the finder's upgrades on a copy, and the model re-runs on every change with the difference in DPS, % and per damage source. |
| **C · What to do next (picked)** | [`sim-c.html`](sim-c.html) | Your stat priority from the real weights, your best upgrades by real DPS gain with Equip, then the estimate with a panel on how far to trust it: every DPS spec's best case by this model against what players average. |

- **The numbers are the live app's.** `gen-sim-engine.mjs` bundles the app's own simulator from `src/` (stats, the estimate, stat weights, the upgrade finder) into `sim-engine.js`, about 2.2 MB with the item catalogue, using the rolldown Vite ships. It also writes `sim-data.js`: archon.gg's observed averages and each DPS spec's best case by the same model, the way the app's tests measure it (1.05× to 2.13× low, as the tests pin). The page loads the planner's shared stores and `build-common.js`, so it simulates the planner's character: the recommended set with the default buffs reads **1,106.4 DPS**, 1.86× below Fury's 2,053.
- **Checked against the app:** with the dev server up, the planner character's share link opened in the app and simulated there gives the same estimate to the decimal.
- **An upgrade can be equipped here** when it is on Wowhead's Fury list (the planner's catalogue); any other opens the live app with the swap made, through a share link.
- **The Step 1 page's example machinery is gone:** the hand-written per-spec notes (the engine supplies the real ones), the spec picker and the fake 1,480 DPS run.
- **Checks:** `checks/sim-handson.mjs a|b|c|p` pass at 1280px, at 400px and with reduced motion (`APP=` the dev server's address for the app comparison, or `APP=off`).

## Character Planner: the Build tab (2026-10-10)

The sixth and last Character Planner step. Three designs were built, each as the whole planner with only its Build
tab changed, over `build-common.js`. **The owner picked A, the share card, with C's "What came in" report on its paste
box.** That is now the Build tab of `planner.html`, so every planner sub-tab is decided.

| Design | Page | What it is |
| --- | --- | --- |
| **A · Share card (picked)** | [`build-a.html`](build-a.html) | The build you're about to share comes first, as a card (slots, item level, talents, hit against the cap, buffs, set pieces, gear icons). Then the link, Share… and the build text, named saves in this browser, and one box to load a link, build text or the addon's export. |
| B · Character select (not picked) | [`build-b.html`](build-b.html) | Your builds in a column like the game's character select, the selected one beside it with a paperdoll of its gear, and Load, Save over, Share and Delete. A paste becomes a new entry without touching the planner. |
| **C · Bring your character in (report merged in)** | [`build-c.html`](build-c.html) | Paste-first: reading a paste changes nothing; a report shows what came in slot by slot and asks the spec when the talents can't say; only "Load into the planner" wears it. |

- **The live app's own build format** (version 1, `src/domain/builds`): the share link is the app's `#build=1.` link on the live site, deflated exactly as `shareLink.ts` does it, and the build text is the app's export. The addon's `/pdexport` is read as `addonImport.ts` reads it (game slot numbers, item ids, enchant effect ids, gem item ids, talents as `[id, tree, row, column, rank]`). `gen-gear-data.mjs` now carries each enchant's effect id and each gem's item id for this.
- **Checked against the real app:** with the dev server up, a link from the prototype opens in the app as a Human Fury Warrior wearing the same gear with no notes, and the example `/pdexport` (written from the Gear tab's part-geared example) loads in the app's own importer with "Every slot resolved cleanly".
- **Only Wowhead's Fury list is known here,** so an item off it is reported and its slot left empty, never guessed, and a build for another class is refused by name. An addon export leaves the Buffs tab alone, since the addon doesn't read your raid's buffs; a link or build text sets the Buffs tab "By hand".
- **The Step 1 Build panel's code** (a fake link and an Import button that only printed a message) is gone from `planner.html`. The Gear tab's "Import your character" now lands in the paste box.
- **Checks:** `checks/build-handson.mjs a|b|c|p` pass at 1280px, at 400px and with reduced motion (with `APP=` the dev server's address for the two real-app steps, or `APP=off`). The other planner checks and `check-bg.mjs` still pass.

## Character Planner: the Ranked Gear tab (2026-10-10)

The fifth Step 2 walkthrough step. Three designs were built, each as the whole planner (with its chosen Gear, Compare,
Talents and Buffs tabs) with only its Ranked Gear tab changed, over `ranked-common.js`. **The owner picked A, the guide
slot by slot, with C as a second view, "Where it drops".** That is now the Ranked Gear tab of `planner.html`, behind a
"Slot by slot" / "Where it drops" switch like the Gear tab's.

| Design | Page | What it is |
| --- | --- | --- |
| **A · The guide, slot by slot (picked)** | [`ranked-a.html`](ranked-a.html) | Pick a slot from your gear; its ranked items stand in Wowhead's order as the game's tooltips, fitted out with the gems and enchant the guide uses, each with the guide's note, where it drops, and Equip. Rings and trinkets share one list, and a unique one can't go in twice. |
| B · What each one does for you (not picked) | [`ranked-b.html`](ranked-b.html) | Every ranked item you don't wear, sorted by Compare's example score, with what it replaces, the stats traded and the hit against the cap. Left out: its order rests on illustrative weights, which can't price procs (Tsunami Talisman, Wowhead's #4 trinket, topped the list at +92 because the trinket it replaces has only a proc), and the Simulation tab already ranks swaps with the simulator. |
| **C · Where to get it (merged in as a view)** | [`ranked-c.html`](ranked-c.html) | The 56 items grouped by where they come from: Serpentshrine Cavern and Tempest Keep boss by boss in kill order, last tier's raids, world bosses, crafted, everything else. What you wear is ticked, upgrades are tagged, and "Only upgrades" hides the rest. |

- **Every design reads the Gear tab's character** (the shared `planner` store), so what you wear is always marked correctly, and Equip changes the Gear tab too. The Step 1 list, which read "equipped" from the old hidden list and covered six slots, is gone, along with the old Compare code that read the same data.
- **In the planner:** `ranked-planner.js` owns the heading and the view switch (kept for the browser session), and the switch shows how many upgrades are left. A and C draw into `#rkui-a` and `#rkui-c`.
- **On a fresh planner you wear the top pick everywhere,** so C (and B) offer the Gear tab's part-geared example, which leaves 13 upgrades.
- **Checks:** `checks/ranked-handson.mjs a|b|c|p` pass at 1280px, at 400px (44px targets) and with reduced motion; `p` runs both views and checks the switch is remembered. The Gear, Compare, Talents and Buffs checks still pass, and so does `check-bg.mjs`.

## Published on GitHub Pages (2026-10-10)

The owner approved this on 2026-10-10. The deploy publishes the prototypes beside the app, so the gallery is at
https://josephevenson08.github.io/project-defeat/prototypes/ and each tab is under `/prototypes/tabs/`. The app
stays at `/project-defeat/`, unchanged, and doesn't link to them.

- **The copy:** `tools/publish/copy-prototypes.mjs` runs in `deploy.yml` after `npm run build`. It copies this folder into `dist/prototypes/` (about 3.2 MB), leaving out `tabs/checks/`, the `.mjs` generators, the `.md` notes and hidden folders.
- **Icons:** the four places that load icons (`buff-common.js`, `gear-common.js`, `talent-common.js`, `raid-composition.html`) pick their folder from where the page is opened: `../../../../public/icons/` in the repo, and the app's own published `/icons/` on the site. No icons are copied twice.
- **Checking it:** `checks/published.mjs` opens the gallery and every page it links to (53), as the site serves them. It checks each page loads with no script errors or failed requests, that every icon comes back as an image (618), and that the app still loads. Run it after `npm run build && node tools/publish/copy-prototypes.mjs` with the `project-defeat-preview` server up. Set `BASE=https://josephevenson08.github.io/project-defeat/` to check the live site.

## Text accents follow each tab (2026-10-10)

The owner said yes on 2026-10-09: links, headings and buttons take each tab's colour, as Raid Composition's gold does.
Simulation (gold) and Raids (per raid) already did. Home keeps its own teal. Three tabs changed, each taking the
colour from its scene in `tbc-kit.js`:

| Tab | Accent | Note |
| --- | --- | --- |
| Character Planner | Sky blue `#7cc4ff` | Paler than rare-item blue (`#4ba3ff`), so links don't read as item names. Also on the twelve Gear, Compare, Talents and Buffs design pages, which are copies of the planner. |
| Spec Tier Lists | Emerald `#3ee0a0` | |
| Professions | Amber `#ffb547` | The map's spawn-density cells stay teal (`--map-cell`), so they still read apart from the amber route. |

- **What changed:** each page's `--glow`, `--glow-ink`, `--glow-soft`, `--rim`, `--rim-2` and `--focus`. The planner's row highlights and two design-B scripts had teal written in directly; those now mix from `--glow`.
- **Unchanged:** panels and body text keep their neutral colours.
- **Contrast:** the accent is at least 7:1 on the panels and on its own soft chips, and button text on it is at least 9.8:1.
- **Checks:** `gear`, `compare`, `talents` and `buffs-handson.mjs p` all pass, and so does `check-bg.mjs` (its only messages are the expected WebGL-off ones).

## Character Planner: the Buffs tab (2026-10-09)

The fourth Step 2 walkthrough step. Three designs were built, each as the whole planner (with its chosen Gear, Compare
and Talents tabs) with only its Buffs tab changed. **The owner picked C, from your raid, with A's icon tiles.** That is
now the Buffs tab of `planner.html`.

| Design | Page | What it is | Outcome |
| --- | --- | --- | --- |
| A · Buff bar | [buffs-a.html](buffs-a.html) | The game's buff row. Raid buffs and boss debuffs are icons you click on and off: a gold rim when on, greyed when off, and a bar in the colour of the class that brings each one. Buffs the simulator doesn't count are dimmed with a slash, and say why when pressed. A row of Paladins with their Blessings. Four consumable slots, each opening a chooser like the Gear tab's. | **Icons merged in** |
| B · What it adds up to | [buffs-b.html](buffs-b.html) | A list of switches beside a running total, the way the simulator counts it: attack power (flat, and 2 per Strength), crit (rating, Agility at 33 per 1%), haste and damage averaged over the fight, Kings, and the boss: armor 7,700 → 3,690, what armor still takes off your hits, crit and hit against it, and the hit cap. A line a change moves lights up. | Not picked |
| C · From your raid | [buffs-c.html](buffs-c.html) | Pick the raid (the Raid Composition tab's roster, an example 25-man or 10-man, or just you) and your seat. Each buff says who brings it ("Enhancement Shaman, group 2") or what's missing ("needs a Paladin in your group"), sorted into your group, the raid, the boss and missing. The raid's Paladins get Blessings to give. Any buff can be switched by hand, and says so. | **Picked** |

- **In the planner:**
  - `window.BUFFS_IN_PLANNER = "c"` turns on icon mode. Each buff is A's icon tile (now `tileHTML` in `buff-common.js`, which A uses too), grouped into your group, the raid, the boss and missing.
  - Clicking a tile switches that buff by hand. Hovering or selecting one shows who brings it or what it needs, and the Missing box keeps one "needs …" line per gap.
  - The page keeps opening on Gear.
  - `buff-data.js` and `buff-common.js` load before the gear scripts, for the hit cap. The old checklist (its CSS and `countBuffs`) is gone, so `planner.html` is 57 KB.
  - On a first visit the tab fills from the example 25-man raid, whose Balance Druid brings Improved Faerie Fire, so a fresh planner shows **140 / 48**. `gear`, `compare` and `talents-handson` start the Buffs tab "by hand" (the example setup, cap 95), so they keep checking their own numbers.
  - `make-buff-pages.mjs` built the three pages and now refuses to run.
- **Data:** `buff-data.js` is generated by `gen-buff-data.mjs` (run from the repo root) from `src/domain`. It holds:
  - the buffs, boss debuffs and consumables for a physical damage dealer, with who brings each and how far it reaches;
  - what the live app doesn't count, and why;
  - the buff icons the live app ships;
  - the raid builds, the Warrior conversions and the boss's armor.
  - The generator imports the app's TypeScript directly; Node strips the types.
- **The owner's rules (2026-10-09):**
  - **Heroism/Bloodlust is raid-wide,** as Blizzard's patch 2.5.5 notes for the Anniversary realms say. The original tooltip, which the app's data read, says "all party members".
  - **Shamans bring totems by spec.** Enhancement brings Strength of Earth, Grace of Air and Windfury (twisting both air totems), Elemental brings Totem of Wrath and Wrath of Air, and Restoration brings Mana Spring and Mana Tide. Tranquil Air is left out.
  - **Paladins are assigned a Blessing each,** on this screen. A Paladin gives each class one Greater Blessing, so this is the one they put on Warriors. Kings and Might count; Salvation, Wisdom and Sanctuary can be assigned but count for nothing here. Assigning a Blessing another Paladin gives swaps the two.
- **Also from the data:** Gift of the Wild, Prayer of Fortitude, Arcane Brilliance and Prayer of Spirit buff "the target's party". One caster covers every group, one cast each, so design C counts them from anyone in the raid.
- **Shared rules** live in `buff-common.js`:
  - **One shared setup** per page (`pd-buffs-planner`). It fires `buffs:change`, then `gear:change`.
  - **Consumables:** a flask takes both elixir slots, plus one food.
  - **Plain words:** effects in words, and plain reasons for what isn't counted.
  - **The totals** (B) and who brings what (C), with one aura per Paladin and one shout per Warrior.
  - **The hit cap:** `gear-common.js` now takes Improved Faerie Fire off it (`BuffKit.hitPct()`), alongside Precision.
- **Checks:** `checks/buffs-handson.mjs a|b|c|p` passes for all three designs and the planner at 1280px, at 400px and with reduced motion. It covers:
  - the hit cap moving 95 ↔ 48 with Improved Faerie Fire;
  - Paladin swaps, and adding and removing Paladins;
  - an elixir taking out the flask;
  - an uncounted buff saying why;
  - A's tooltip;
  - B's totals and lit line (Sunder off: 6,290 armor);
  - C's by-hand mark, seat change (group 1 lacks Strength of Earth), "Your raid" waiting for a roster, and "Just you";
  - reload, the Gear tab, sideways scroll, and 44px phone taps.
  - `gear`, `compare` and `talents-handson p` and `check-bg.mjs` still pass.

## Character Planner: the Talents tab (2026-10-09)

The third Step 2 walkthrough step. Three designs were built, each as the whole planner (with its chosen Gear and Compare
tabs) with only its Talents tab changed. **The owner picked A, the talent window, with C's "What's off" list under it.**
That is now the Talents tab of `planner.html`.

| Design | Page | What it is | Outcome |
| --- | --- | --- | --- |
| A · Talent window | [talents-a.html](talents-a.html) | The game's talent frame: the three trees side by side (one at a time on a phone), each on its own dark ground with the spec's icon behind it. Talents are gold when full, green when they can take a point and grey when locked, with arrows from each prerequisite. Game-style tooltips on hover, and the selected talent's tooltip under the frame with − and +. | **Picked** |
| B · What it gives you | [talents-b.html](talents-b.html) | One tree at a time beside a running list of what the points do, added up the way the live simulator reads them. Each talent the simulator skips is listed with the reason, in plain words. A hit-cap card sets the cap against your gear's hit. A line a change moves lights up, and the message says what it now reads. | Not picked |
| C · Against the preset | [talents-c.html](talents-c.html) | Your build laid over the Fury or Arms preset, with the preset's rank on each talent and a violet ring where you differ. Below: "What's off" (each broken rule with a one-press fix, or "Show where" for rows short of points) and every difference from the preset, each with Match. | **"What's off" merged in** |

- **In the planner:**
  - `window.TALENTS_IN_PLANNER` swaps A's folded list of broken rules for C's "What's off" box, and keeps the page opening on Gear.
  - The box lists each broken rule with a one-press fix or "Show where", plus the unspent points. Its markup and clicks are shared in `talent-common.js` (`offHTML`, `offClick`), so C uses the same code.
  - The old read-only tree (`TAL`, `renderTree` and its CSS) is gone from `planner.html`, which is 15 KB smaller.
  - `make-talent-pages.mjs` built the three pages and now refuses to run.
- **Data:** `talent-data.js` is generated by `gen-talent-data.mjs` (run from the repo root) from `src/domain/talents`. It holds the Warrior trees from Wowhead's TBC calculator, the wowsims Fury and Arms presets as stored, and which talents the live simulator reads, plus the reasons it skips the rest.
- **Shared rules** live in `talent-common.js`:
  - **Learning a point:** 61 points in all, and a row takes points once its tree has 5 per row. This is the game's "Requires 25 points in Fury Talents", as the live app checks it.
  - **Prerequisites** must be met first.
  - **Unlearning a point** is refused if a talent needs it, or if it would leave a deeper talent with fewer than 5 points per row above that talent's own row. It is refused only when the removal would break something that holds now, so a broken stored build can't trap you.
  - **One shared build** per page (`pd-talents-planner`). It fires `talents:change`, then `gear:change`, so the gear views and the stat bar redraw.
  - **The rest:** tooltips, the tree grid with arrows, arrow keys within a tree, and click, right-click, − and +.
- **The stored presets break the game's rules, and every design says so rather than filling them in.** wowsims lists only the talents its simulator reads, so both presets skip Enrage and the filler points:
  - **Fury (9 / 39 / 0, 48 points) breaks three rules:** Flurry without Enrage, Arms 8 points short in rows 1–2, and Fury 2 points short in rows 1–5.
  - **Enrage 5/5 fixes two of them.** Adding the 8 Arms filler points as well gives exactly the standard 17/44/0.
- **The hit cap now follows Precision, on every planner tab.** `gear-common.js` reads `TalentKit.precision()`:
  - The cap is 142 rating without Precision and 95 at 3/3.
  - So the recommended set's 140 hit is 45 over the cap, not 2 under it.
  - Compare no longer calls hit past the cap "wasted". For a dual-wielder it still stops white swings missing, so the example score counts it at half weight.
  - The older Gear and Compare design pages load no talents, so they still show 142.
- **Checks:** `checks/talents-handson.mjs a|b|c|p` passes for all three designs and the planner at 1280px, at 400px and with reduced motion. It covers:
  - the preset's numbers and its 3 broken rules;
  - the hit cap moving 95 → 111 → 95 with Precision;
  - a locked talent's reason;
  - click, right-click, keyboard, and − and +;
  - a refused unlearn (Bloodthirst needs Sweeping Strikes);
  - Enrage fixing 2 rules;
  - each design's own feature, and the planner's "What's off" box (Show where, Hide);
  - the planner still opening on Gear, and reload;
  - the Gear tab, sideways scroll, and 44px phone taps.
- **Re-checked after the hit-cap change:** `gear-handson.mjs` and `compare-handson.mjs` (planner and the older pages) and `check-bg.mjs` all pass. The tests were updated for the new cap.
- **Also fixed:** the "Change character" picker showed open on load on every planner page, because its CSS overrode `hidden`.

## Character Planner: the Compare tab (2026-10-09)

The second Step 2 walkthrough step. Three designs were built, each as the whole planner (with its new Gear tab) with
only its Compare tab changed. All three compare against the gear in the Gear tab, through the same shared character, so
equipping from Compare updates the Gear tab and a Gear change shows in Compare. **The owner picked A with B's
one-sentence summary on top.** That is now the Compare tab of `planner.html`.

| Design | Page | What it is | Outcome |
| --- | --- | --- | --- |
| A · Side-by-side tooltips | [compare-a.html](compare-a.html) | The in-game shift-compare: both item tooltips, then each stat change in green or red and what the swap does to the hit cap | **Picked** |
| B · Change chart | [compare-b.html](compare-b.html) | One bar per stat, gains right and losses left, a one-sentence summary and a hit gauge against the cap | **Summary merged in** |
| C · Shortlist table | [compare-c.html](compare-c.html) | Every ranked item for the slot in one table against what you wear, then any two pinned head-to-head | Not picked |

- **Shared rules** live in `compare-common.js`, over `gear-common.js`:
  - An item you don't wear counts with Wowhead's gem for each socket colour and your current enchant, as in the live app.
  - Hit is cap-aware, with rating past 142 wasted.
  - The hit-cap wording is written as full clauses ("leaves you 10 under the hit cap").
  - The slot picker is the icons of your own gear.
- **The example score:** any single score is labelled **example**. It uses the prototype's illustrative weights, and stops counting hit at the cap, because the prototype has no simulator. The stat differences are real.
- **In the planner:**
  - `window.COMPARE_IN_PLANNER` switches on the summary sentence, and moves the hit and example lines into it.
  - It also keeps the page opening on the Gear tab.
  - `make-compare-pages.mjs` built the three pages and now refuses to run, since `planner.html` holds the chosen tab.
- **Checks:** `checks/compare-handson.mjs a|b|c|p` passes for every design and the planner at 1280px, at 400px and with reduced motion. It covers:
  - the real −8 hit (140 → 132) for the helm swap, and the summary's exact wording;
  - switching slots;
  - equipping from Compare showing in the Gear tab, and a Gear change showing in Compare;
  - C's pinning;
  - phone tap sizes. C's pin checkboxes sit in 44px labels.
- `gear-handson.mjs p` and `check-bg.mjs` still pass.

## Character Planner: the Gear tab (2026-10-09)

The first step of the Step 2 walkthrough. Three designs were built, each as the whole planner with only its Gear tab
changed, all on real data. **The owner picked B, the character sheet, with C's checklist added as a second view.**
That merge is now the Gear tab of `planner.html`.

| Design | Page | What it is | Outcome |
| --- | --- | --- | --- |
| A · List and side pane | [gear-a.html](gear-a.html) | The live app's model, polished: two columns of slots, and a pane beside them to choose from | Not picked |
| B · Character sheet | [gear-b.html](gear-b.html) | The in-game character window: icons around the edge, the gear's stats in the middle, game-style tooltips, a flyout to swap | **Picked** |
| C · Upgrade checklist | [gear-c.html](gear-c.html) | Every slot marked best in slot, upgrade (with its boss), no enchant, empty socket or bonus off, each with a one-press fix, plus "where it drops" by raid and boss | **Merged in** as "What's left" |

- **How the Gear tab is built:**
  - `gear-data.js` is generated by `gen-gear-data.mjs`, run from the repo root, from `src/domain`: Wowhead's Fury Phase 2 rankings and enchant and gem picks, the item, enchant and gem catalogues, the icon map and the raid loot tables. Its fixes are written into the generator: the T5 token bosses, Pendant of the Perilous as Serpentshrine trash, and a filter that offers only physical-DPS enchants while always keeping Wowhead's pick.
  - `gear-common.js` holds the shared rules: socket colours and bonuses, totals, the live hit row (cap 142), the tooltip, the three presets, unique rings and trinkets, and one shared character per page, which fires `gear:change` when edited.
  - `gear-planner.js` owns the buttons and the Character sheet / What's left switch. `gear-b.js` and `gear-c.js` draw the two views into it. On their own pages they draw the standalone designs instead.
  - `make-gear-pages.mjs` built the three design pages from the Step 1 planner. It is retired now that `planner.html` holds the chosen tab, so `gear-a/b/c.html` stay as built.
- **Icons:** items and gems use the files the live app ships (`public/icons`), as Raid Composition's spec icons do.
- **Checks:** `checks/gear-handson.mjs a|b|c|p` (p is the planner). It follows real hit numbers through a helm swap (140 → 132), an enchant removal (→ 116) and a mismatched gem (→ 124, bonus off). It also covers:
  - Escape returning focus to the slot, unique rings, the three presets and reload;
  - the other sub-tabs still working;
  - phone tap sizes;
  - for the planner, the view switch, a checklist fix showing on the sheet, the counts linking into the checklist, and the "What's left" count.
  - All pass at 1280px, at 400px and with reduced motion. `check-bg.mjs` passes all seven tabs.
- **Fixed along the way, on every tab:** the pointer parallax is off below 700px. With a mouse on a narrow window, it nudged panels 1px past the screen edge.
- **Fixed in the gallery:** live previews now load only near the screen and unload when far from it. Every preview is a 3D page, and past about sixteen at once the browser starts dropping their scenes.

## No curtain between tabs (2026-10-08)

The owner didn't like the full-screen curtain that covered the page with the next tab's name, so it is gone. Tab links are now plain links on all seven tabs, and each tab still plays its own intro on arrival.
- **Removed from Home, Simulation, Raid Composition, Tier Lists, Raids and Professions:** the `#wipe` element, its styles, and the leave animation (Home's `M.leave` and `data-wipe` links). The Planner never had one.
- **Checked:** clicking each tab's link, with motion on, navigates straight to the next tab, with no curtain and no script errors.
- **Not changed:** the dropped reference pages (`home-a/b/c`, `raid-comp-b`) still have the curtain.

## Raid Composition: the planning table (2026-10-07)

The owner couldn't plan a raid in the Step 1 page, so three designs were started, each with a full
planning table. **The owner picked A, the Terrace of Light,** and it is now `raid-composition.html`.
The Step 1 baseline it replaced is in git history.

- **B, the Hellfire War Camp** (`raid-comp-b.html`), is kept for reference. It has the same table logic, with an inline picker and a dark iron-and-orange look.
- **C, the Arcane Tactical Board,** was cut off unfinished by a usage limit and was dropped without being built.

Why A won:
- A dialog picker that shows each spec's role and notes.
- Move, Name and Remove fit on one row.
- The whole seat is the move target.
- A one-press "seat this suggestion" button.
- Its white-gold was already the colour picked for this tab.

**How it was checked:** `checks/rc-handson.mjs` drives every control on both A and B in Edge, at 1280px,
at 400px and with reduced motion.
- **What it drives:** add with a name; cancel; move to an empty seat; swap; Escape and Cancel on a held move; drag to an empty seat and onto a taken one; rename; rename with Escape; clearing a name; remove with Undo; 10/25 with Undo; reload; example and "edited"; the one-more-seat and missing lists; Clear with Undo; Export; quick-add; and keyboard Move.
- **Result:** A passed all 27–28 steps in each mode, and so did B.
- **Move works.** A timeout in the previous session came from that test's own button selector.
- **Flaky runs:** two automated runs out of about twenty timed out once each, on a reload and on a click. Neither reproduced in three retries, so both look like slow loads in software rendering, not page bugs.

**Fixed while testing,** on both pages:
- Every control on a phone is now at least 44px tall, the app's own tap-target rule. Before, the seat buttons, toolbar, detail fields and picker were 30–41px. `checks/rc-taps.mjs` measures this.
- B's suggestion line read "A Elemental Shaman". It now reads "An".

**The owner's feedback on A (2026-10-07), built 2026-10-08:**
- **Dark, like the other tabs.** The page uses the shared top bar, Marcellus headings and gold accents, over the kit's `raidcomp` white-gold water. The shared scene's teal pillars, crystal and rim light are warmed to match.
- **Click to fill.** A spec palette, as in the live app, replaces "+ Add" and the picker dialog. It uses the app's own spec icons (`public/icons`, `raidcompIcons.json`), the first Blizzard art in the prototypes, by the owner's choice.
- **A pencil for names,** replacing the Name button.
- **Checks:** `rc-handson.mjs a` passes 30–31 steps in each mode, with new steps for aiming, fill order, a full raid and icons loading. `rc-taps.mjs` measures every control at 44px or more on a phone, and `check-bg.mjs` passes all seven tabs.
- **The pane shows a static copy:** the in-app browser pane opens a local file as a snapshot, so relative links (icons, `tbc-kit.js`) break there. Use the `prototypes` entry in `.claude/launch.json`, a Python static server on port 8765, and open `/docs/design/prototypes/tabs/raid-composition.html`.

## The seven pages

| Page | Size | What it shows, all from the app's real data |
| --- | --- | --- |
| [Home](home.html) | 55 KB | The front door. It covers what the app is, Phase 2 at a glance (all five T5 token bosses), a feed of real data changes from the project log, a card for each tab, and character import. |
| [Character Planner](planner.html) | 57 KB, plus the shared Gear, Compare, Talents and Buffs scripts | The character line, the stat bar with the hit cap (now live: it follows the gear), and all six sub-tabs. **Gear** (picked 2026-10-09) is a character sheet with game-style tooltips and a flyout to swap items, enchants and gems, plus a "What's left" checklist with one-press fixes and where each upgrade drops. **Compare** (picked 2026-10-09): your item's tooltip next to another's from the slot's ranked list, with the trade summed up in one sentence. **Talents** (picked 2026-10-09): the game's talent window on the real Warrior trees, with arrows, tooltips and the game's rules, and a "What's off" list with one-press fixes. Its Precision sets the hit cap. **Buffs** (picked 2026-10-09): filled in from your raid and seat as clickable icons, saying who brings each buff or what's missing, with a Blessing assigned to each Paladin; Improved Faerie Fire lowers the hit cap. **Ranked Gear:** six slots. **Build:** the real share-link format and the paste box. |
| [Simulation](simulation.html) | 63 KB | The fixed level-73 boss, the 20 DPS specs with real archon.gg reference DPS, the upgrade finder's method, and an honest "what is and isn't modelled" panel. The estimate and weights are labelled example. The scene uses Tempest Keep's arcane light. |
| [Raid Composition](raid-composition.html) | 80 KB | Design A's planning table on the dark site. **Adding:** a palette of all 29 builds with the live app's spec icons, grouped by class. A click seats the build in the next open seat, filling group 1 first, or into a group you aim at by pressing its name. **Seats:** a pencil on each tag for the player's name; Move and drag (a taken seat swaps); Remove. **Raid:** 10/25 with Undo, load or reset the example, Clear with Undo, raid details for the export, an Export stub, and the roster kept for the browser session. **Results,** live from the real buff-scope data: each group's party buffs, role balance, "what one more seat would add" with a one-press seat, "missing, and who fixes it", and raid-wide and boss coverage. |
| [Spec Tier Lists](tier-lists.html) | 32 KB, plus `tier-data.js` (20 KB) and the Tier Lists scripts | **Decided 2026-10-12:** the tier board (design A), Wowhead's three lists as rows of spec icons with a card for any spec (every list it is on, what the logs say, what it brings to a raid), with a switch to Wowhead's tiers against archon.gg's observed DPS (design B). Fury Warrior is marked. |
| [Raids](raids.html) | 34 KB, plus `raid-data.js` (161 KB) and the Raids scripts | **Decided 2026-10-11:** the boss journal (design A), one boss at a time with the owner's art, the loot as icons with tooltips and your spec's picks ranked, with a switch to your raid's loot plan (design C): who in it wants each drop. All five raids, 24 bosses and 469 drops from the live app's data, a search across all five, and the scene follows the raid. |
| [Professions](professions.html) | 30 KB, plus `prof-data.js` (223 KB) and the Professions scripts | **Decided 2026-10-12:** the profession window (design A), every recipe on the path coloured at your skill with its reagents and vendor prices, and every gathering range with its route on a grid; with a switch to Which two (design B), every profession by what it gives a level 70 character and makes for your spec. |

## How they were made

- **How the pages were built:**
  - Each page started as a copy of the Round 4 page or of a finished sibling tab, so they share code: tokens, scene, motion, fallbacks and the Motion toggle.
  - Each was built by one designer agent that read the app's real code and data for its tab, and in some cases ran the app's own functions on it.
  - A usage limit cut off the first wave. Those pages were resumed from where they stopped.
- **Checks:** Playwright with Edge, at 400px, 1280px and 1280px with reduced motion, plus a run with WebGL disabled. They cover sideways scroll, script errors, outside requests, invisible content and broken links between pages. All seven pass. A visual review was done from desktop screenshots.
- **Fixed after review:** the Planner scrolled sideways on phones, because a grid column grew to its widest content.

## Data corrections this step found

Building against the real data surfaced three errors in the shared prototype brief, and three
problems in the app's own data:

- **Brief (fixed everywhere):**
  - Destroyer Shoulderblades drop from **Void Reaver**, not Kael'thas.
  - Pendant of the Perilous is **Serpentshrine Cavern trash**, not a Karazhan drop.
  - Tier 5 tokens drop from **five** bosses: Lady Vashj, Void Reaver, Kael'thas Sunstrider, Leotheras the Blind and Fathom-Lord Karathress.
- **The app's data: all fixed in the live app on 2026-10-09** (`src/`, with tests):
  - **Felguard:** `featureFlags.ts` said the demon was unmodelled. It has been modelled since 2026-08-29, so the text now says so. Master Demonologist's skip reason no longer says "No pet model here", and a test pins it. The demon-damage comments in `warlockPet.ts` and `talentModifiers.ts` claimed Soul Link and Master Demonologist were read; only Unholy Power is.
  - **The stored talent presets:** all 17 wowsims presets break the game's row rules, because wowsims lists only the talents its simulator reads. Two more turned up: Retribution takes Fanaticism without Repentance, and Enhancement takes Dual Wield Specialization without Dual Wield. They stay as upstream wrote them, which the simulator reads the same either way. The ingest now records `legal` and `gaps` per build, using the app's own `ruleBreaks`. The live Talents tab never shows them, so nothing on screen changed (the owner's choice: label them and show the gaps).
  - **`canRemovePoint`** now checks the points above a deeper talent's row (`pointsAboveRow`). It refuses only a removal that breaks something that holds now, so a broken preset can't trap you. The old test that asserted the wrong rule now asserts the right one, plus the Rampage case.
  - **Raid reach:**
    - Gift of the Wild, Prayer of Fortitude, Arcane Brilliance and Prayer of Spirit reach any group (`castOnAnyGroup`).
    - Heroism/Bloodlust is raid-wide on Anniversary realms (`anniversaryRaidWide`, citing patch 2.5.5).
    - Shaman totems come from the spec that runs them, and Tranquil Air Totem is gone (32 buffs now).
    - The Raid Composition intro now computes its count instead of saying "24 of the 33".
    - The Raid Composition prototype has the same rules, with an "Any group" tag.
  - **Elixir notes:** the consumables ingest says what each item grants. Elixir of Major Fortitude now reads "maximum health" and Gift of Arthas "resistances".
  - **Lady Vashj's loot:** Destroyer Greathelm is the tank helm, and the DPS Destroyer Battle-Helm was added. Leotheras also gained the tank gloves (Destroyer Handguards). The prototype's raids page still shows its own copy of the loot.
  - **The zone-map credit** no longer cites Microsoft's "Game Content Usage Rules". It's in `zoneMaps.json`, its ingest, `features.md` and the test.
  - The prototype's hit cap ignored Precision (fixed in the prototype; the live app shows no cap line).
- **The prototype's own gear data (found 2026-10-10, fixed):** `gen-gear-data.mjs` read boss names only in single quotes, so Al'ar and Kael'thas Sunstrider (written in double quotes for their apostrophes) were missed. Al'ar's three drops had no boss, and five Kael'thas drops were credited to Solarian (Thalassian Wildercloak, Leggings of Murderous Intent, Telonicus's Pendant of Mayhem, Band of the Ranger-General, Rod of the Sun King). The Gear tab's checklist and the tooltips now name the right boss.
- **The live app's upgrade finder (found 2026-10-11, fixed in `src/`):** `findUpgrades.ts` scored a two-hander in the main hand with the off-hand weapon still equipped, a pairing the game doesn't allow and equipping undoes. For a Fury warrior it listed Twinblade of the Phoenix as +145.8 DPS; equipping it took the estimate from 1,106.4 to 929.1. Each trial swap now goes through `applyWeaponSlotRules`, and a test equips every listed candidate and checks it delivers the gain it promised (it failed before the fix). The Simulation workbench (design B) found it by trying the swap.
- **Raid data (found 2026-10-11, fixed in `src/` with a test, checked by the tbc-researcher):**
  - `tempestKeepBosses.ts` tagged Al'ar's Gloves of the Searing Grip as Caster DPS and Netherbane as Tank. The gloves are leather with Agility, Attack Power and Expertise (Feral, Retribution, Arms, Enhancement and Fury rank them, and Protection Warriors for threat), so they are now Physical DPS and Tank; Netherbane is an Agility axe only Hunters and Fury rank, so it is Physical DPS.
  - `sampleAttunements.ts`: Tempest Keep's heroic keys needed **Revered** in Phase 2, not "Honored or better". Every chain now says it counts for the whole account on Anniversary realms, and the notes record that Blizzard staff ended the SSC and TK attunements when Phase 3 opened on 2026-08-27 (Karazhan's removal is reported only by secondary sources). Serpentshrine's Reservoir Key line drops the unsupported "or a guild member who is".
- **To check, not changed:** Warbringer Battle-Helm (Karazhan) has no boss in the app's data; the guide only says "Karazhan".
- **Gloves of the Searing Grip (fixed 2026-10-12):** the curated entry in `sampleItems.ts` dropped its stale "stats are approximate" note, its `needsVerification` flag and the made-up stats it never showed; its boss, instance and roles were checked by the tbc-researcher.
- **The app's buff data (found 2026-10-12, not changed):** it is built around what a raid gives its damage dealers, so caster-side debuffs and mana (Shadow Priest's, for one) are not in it. Raid Composition and the Spec Tier Lists card show only what it counts.
- **Which recipes a trainer teaches (fixed 2026-10-12, in `tools/ingest/compute-leveling-paths.mjs`, with a test):** the path read Wowhead's source code 2 as "trainer", which is a drop. The data shows 6 is the trainer code and that most trainer recipes carry no code, only a training cost. So 152 of 198 steps said "Recipe found elsewhere" (Linen Bandage, Lesser Healing Potion, Rough Sharpening Stone) while drops like Sniper Scope said "Trainer-taught". Now a training cost, code 6 or a starter at skill 1 counts: 110 of 201 steps. Because ties go to trainer recipes, five paths swapped a few drop recipes for trainer ones (Alchemy 9 steps, Jewelcrafting 5, Cooking 4, Enchanting 2, Blacksmithing 1: Runed Copper Belt for Gemmed Copper Gauntlets), with craft counts within two.

## Known gaps

- Without JavaScript:
  - The Raids page needs it (it shows a note).
  - Raid Composition's per-group buffs don't appear.
  - The Professions page needs it (it shows a note).
- Change character, Export image and paste-import are stubs in the prototype.
- Routes are drawn on a plain grid, not the live app's zone maps (the owner's choice).
- Nobody has clicked through every control by hand, and contrast is estimated.
