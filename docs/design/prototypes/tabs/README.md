# Tab prototypes

**Step 1, the baseline (done 2026-10-04).** One page per tab of the site, all in the chosen
[Round 4](../round4/) style. They link to each other through the top navigation, so the seven work as
one clickable prototype of the whole site. Start at [`home.html`](home.html). Brief:
[`TABS-BRIEF.md`](TABS-BRIEF.md).

**Next session:** start from the top of [`NEXT-SESSION-PLAN.md`](NEXT-SESSION-PLAN.md). The Character Planner's Gear and Compare tabs are decided (see [Compare](#character-planner-the-compare-tab-2026-10-09) and [Gear](#character-planner-the-gear-tab-2026-10-09)). So is [Talents](#character-planner-the-talents-tab-2026-10-09). So is [Buffs](#character-planner-the-buffs-tab-2026-10-09). Next come the live-app fixes and the owner's other answered items (see the next-session plan), then Ranked Gear.

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
| Spec Tier Lists | Emerald water with rank rings (originally Coilfang teal). A rune-ring base under the 3D shelves. Entry rings on filter and view changes. |
| Raids | The scene follows the raid: Serpentshrine water, Tempest Keep crystal, Magtheridon's Hellfire embers and red sky, Gruul's Blade's Edge dusk, Karazhan arcane violet. Entry rings on boss cards. A rune ring beside each attunement chain. |
| Professions | Calm amber water with ore veins (originally teal). On Mining's Fel Iron range, fel embers behind the route, which draws itself with DrawSVG alongside a rune ring. Entry rings on opening a profession or picking a range. |

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
- **Also noted:** `craftingPaths.json` marks some starter recipes, such as Rough Sharpening Stone, as not trainer-taught. That looks wrong.

## Known gaps

- Without JavaScript:
  - The Raids page shows only Serpentshrine Cavern.
  - Raid Composition's per-group buffs don't appear.
  - Profession pages don't open.
- Change character, Export image and paste-import are stubs in the prototype.
- Only Mining has a drawn route, and only for the 300–325 range.
- Nobody has clicked through every control by hand, and contrast is estimated.
