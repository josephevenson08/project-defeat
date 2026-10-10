# Next session plan: owner feedback on the tab prototypes

## ▶ Where we left off (2026-10-10): start here

**The live-app fixes are committed and pushed.** They cover talents, raid reach and totems, loot, notes and the credit, and are listed in the README's "Data corrections". The app's whole Playwright suite passed 297 of 297 on Edge first. To run it again: `npx playwright test -c playwright.edge.config.ts`.

**Next, the owner's answered items, in order:**
1. **Text accents follow each tab's colour** (yes): links, headings and buttons, as Raid Composition's gold does. Only Planner, Tier Lists and Professions are still teal; Simulation and Raids already follow their scene (see the handoff).
2. **The gallery is always dark** (yes).
3. **Publish the prototypes on GitHub Pages** (yes): plan the build change first and show the plan.
4. **Obsidian notes on the prototype work** (yes), with the brain-sync skill.
5. **Then the walkthrough:** Ranked Gear and Build, then Simulation, Raids and Spec Tier Lists.

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
