# Next session plan: owner feedback on the tab prototypes

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
