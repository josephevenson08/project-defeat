# Tab prototypes

**Step 1, the baseline (done 2026-10-04).** One page per tab of the site, all in the chosen
[Round 4](../round4/) style. They link to each other through the top navigation, so the seven work as
one clickable prototype of the whole site. Start at [`home.html`](home.html). Brief:
[`TABS-BRIEF.md`](TABS-BRIEF.md).

**Step 2, next.** Go tab by tab, with three parallel designs per step. The owner picks one per step.
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

## The seven pages

| Page | Size | What it shows, all from the app's real data |
| --- | --- | --- |
| [Home](home.html) | 55 KB | The front door. It covers what the app is, Phase 2 at a glance (all five T5 token bosses), a feed of real data changes from the project log, a card for each tab, and character import. |
| [Character Planner](planner.html) | 75 KB | The character line, the stat bar with the hit cap (140/142) and all six sub-tabs. **Gear:** 17 slots. **Compare:** the next-ranked alternative from the BiS rankings. **Talents:** real Warrior trees. **Buffs:** real buffs, debuffs and consumables. **Ranked Gear:** six slots. **Build:** the real share-link format and the paste box. |
| [Simulation](simulation.html) | 63 KB | The fixed level-73 boss, the 20 DPS specs with real archon.gg reference DPS, the upgrade finder's method, and an honest "what is and isn't modelled" panel. The estimate and weights are labelled example. The scene uses Tempest Keep's arcane light. |
| [Raid Composition](raid-composition.html) | 65 KB | A 10/25-player toggle, a working Move-to-swap, and each group's party buffs from the real buff-scope data. Also role balance, "what one more seat would add" and "missing, and who fixes it". The roster is an example made of real specs. |
| [Spec Tier Lists](tier-lists.html) | 55 KB | All three Wowhead Phase 2 lists, with all 28 placements. Fury Warrior is marked. The DPS list has 3D shelves with a List view and animated class filters. |
| [Raids](raids.html) | 86 KB | All five raids, 24 bosses and 462 drops with quality colors and token, recipe and mount labels. The three attunement chains are marked "not yet confirmed for Anniversary realms". The scene changes with the selected raid. |
| [Professions](professions.html) | 88 KB | All 13 professions with real trainer stops and what each is worth at 70. Mining is built out in full, with a climb table, zones and a computed Fel Iron route drawn from 320 real spawn points. Blacksmithing shows its 33-step path to 375 and a bought-vs-farmed shopping list. |

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
- **The app's data:** each of these was raised as a separate fix-it task.
  - `docs/known-limitations.md` and `src/featureFlags.ts` disagree on whether the Felguard is modelled.
  - The stored Fury Warrior talent preset spends 48 of 61 points, and takes Flurry without Enrage.
  - Lady Vashj's loot lists **Destroyer Greathelm**, the tank helm, tagged for physical DPS. The DPS helm is Destroyer Battle-Helm.
- **Also noted:** `craftingPaths.json` marks some starter recipes, such as Rough Sharpening Stone, as not trainer-taught. That looks wrong.

## Known gaps

- Without JavaScript:
  - The Raids page shows only Serpentshrine Cavern.
  - Raid Composition's per-group buffs don't appear.
  - Profession pages don't open.
- Change character, Export image and paste-import are stubs in the prototype.
- Only Mining has a drawn route, and only for the 300–325 range.
- Nobody has clicked through every control by hand, and contrast is estimated.
