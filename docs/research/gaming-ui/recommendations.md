# Recommendations for Project Defeat

> **Turned into a plan:** [`docs/design/UI-REFRESH-PLAN.md`](../../design/UI-REFRESH-PLAN.md) (2026-10-02, not started).

Prioritized, revised 2026-10-01 against 25 platforms. Each item names the trend(s) in
[trends.md](trends.md) it comes from, the platforms and sources behind it, what in this app it would
change, and what to leave alone. Nothing here has been implemented; these are suggestions for a
planned change, per the project's plan-before-changes rule.

**IDs.** Recommendation numbers (R1 to R12) are headings, not bracketed. Bracketed IDs such as [R1]
are always sources (for example Riot's League site). Session-1 numbers are kept so earlier references
still work; the order below is the new ranking.

## What the app is today (read 2026-10-01)

From the source and the live site (https://josephevenson08.github.io/project-defeat/, opened
2026-10-01 at a 1280 px viewport) [A1, A2]:

- Dark, near-monochrome UI; tokens on `:root`, re-skinned by `[data-faction='horde']`; section hues
  passed as `--section-accent` (hard-coded hex values in `SectionPicker.tsx`) and `--panel-accent`
  [A2].
- Cinzel (display) + Barlow Semi Condensed (UI), self-hosted, `font-display: swap`; tabular
  numbers on stats; `--radius: 2px`; metal-edge brackets and bevels [A2].
- Front door: five section cards over a faction backdrop, plus "Already playing? Import your
  character from the game", which takes the string from the addon's `/pdexport` [A1, A2].
- Planner: section tab bar (Character Planner, Simulation, Raid Composition, Spec Tier Lists, Raids,
  Professions), a character header ("Human Fury Warrior · Alliance · Phase 2"), a stat strip, a
  second tab row (Gear, Compare, Talents, Buffs, Ranked Gear, Build) [A1]. With nothing equipped the
  Gear tab shows "Nothing equipped yet", a line naming the **Phase 2** list, and one button, "Equip
  the recommended set" [A2].
- The in-game addon only **reads the character out of the game** into the app; there is no route
  from the app back into the game [A2].
- Accessibility: skip link, `:focus-visible` rings, reduced motion honored in CSS and in the
  anime.js helpers [A2].
- Search: one "Filter by name" field inside the gear slot pane; no global search [A2].
- Provenance: tier lists link their source at the bottom of each panel; BiS rows show source,
  phase and a needs-verification note; boss cards show a drop count [A2].

---

## Priority 1: do these

### R2. Put phase, source and freshness next to the numbers, and say which phase is live

- **From:** T5 (16 platforms, the strongest trend) and T13 (freshness stamp + changelog: Icy Veins,
  Maxroll, Blitz, WoWSims, Lodestone, GOG, Tracker.gg) [NC17, NC12, NC21, NC7, NA21, NA24, NB26]; T6.
- **Why first now:** the four tools closest to this app all print phase or patch and data age in
  the heading area: Icy Veins' "Last Updated" with relative age [NC17], Maxroll's season and game
  build [NC11], WoWSims' "Phase 3 (2.2 - T6) - Alpha" status line [NC5], Blitz's "Data updated 1
  minute ago" [NC21]. And on the same day Icy Veins and WoWSims pointed at different TBC phases
  without saying which is live [NC5, NC17], so a clear statement is a place to do better than both.
- **What changes:**
  - One small provenance chip component, used in tier list headers, BiS rows and loot rows: source,
    phase, and an "updated" date with relative age, for example "Wowhead · Phase 2 · updated 12 Sep
    (3 wk ago)". Move the tier list source from the panel foot (`.tier-source` in
    `TierListsPanel.tsx`) into the header. Needs a date field in the tier list and BiS data, which
    does not exist yet [A2].
  - State both phases where they could differ: "Live: Phase N · This list: Phase 2".
  - A short dated changelog per dataset ("12 Sep: Phase 2 Fury list re-checked against Wowhead"),
    as Icy Veins and Maxroll put at the foot of each guide [NC17, NC12].
  - Counts in tab labels (Wowhead's "Comments (78)", Tracker.gg's 2024 relaunch) such as "Ranked
    Gear (14)"; `TabDefinition` gains an optional `count` [W1, NB26].
- **Keep:** the needs-verification note on BiS rows; it is better practice than most tools surveyed
  [A2].

### R10. Named phase presets beside "Equip the recommended set" (new)

- **From:** T14 (WoWSims, Maxroll, Icy Veins) [NC5, NC12, NC17]; T2.
- **What changes:** the empty Gear state hard-codes the Phase 2 list [A2]. Replace the single button
  with a small set of named presets, Pre-raid, Phase 1, Phase 2 and up, switchable in place, the way
  WoWSims lists Pre-Raid to Phase 5 gear sets beside "Save Gear Set" [NC5] and Maxroll's guide swaps
  every section with one set control [NC12]. Keep one primary action ("Equip Phase 2"), with the
  other phases one click away. Only offer phases the data actually has.
- **Fit (corrected 2026-10-02):** the entries carry a `phase` field, but `src/domain/bis/bisRankings.json`
  holds **Phase 2 only**; every entry has `phase: 2` [A2]. So this needs a data step first: ingest
  Wowhead's Pre-raid and Phase 1 BiS lists through the existing `tools/ingest/ingest-bis.mjs`, then add
  the control. Until then there is only one preset to offer. Icy
  Veins orders its phase tabs newest first [NC17]; here the default should be the phase the data
  targets, labelled as in R2.

### R1. Add a global search with a Ctrl K shortcut

- **From:** T3, narrowed to tools, stores and hubs (Raider.IO and Blitz print Ctrl K; GOG GALAXY uses
  Ctrl/Cmd+F; Steam, Wowhead, CurseForge, Tracker.gg, Maxroll and U.GG all keep search in the bar)
  [RI1, NC20, NA26, V2, W1, NB19, NB25, NC10, M1].
- **What changes:** a search field in the `AppShell` header, beside `TabNav`, that finds items,
  bosses, specs and professions across sections and jumps to them; a visible "Ctrl K" hint; recent
  items shown before typing, as Steam's 2025 dropdown does [V2]. A placeholder that teaches the
  query, as Tracker.gg does ("Dragonspine Trophy, Gruul, Fury"), costs nothing [NB25]. The slot-pane
  filter stays as the local filter.
- **Why it dropped from first:** WoWSims, the tool doing this app's simulator job, has no search at
  all [NC3, NC5], so search is a convenience here rather than a genre requirement. It is still the
  biggest navigation gain for an app with six sections and six planner tabs [A1].

## Priority 2: worth doing

### R5. Put "Import your character" beside "Equip the recommended set" (reframed)

- **From:** T10, game-to-tool direction (WoWSims Exporter into the sim's Import > Addon; WoWSims
  "Import From Bags"; Archon App uploading logs) [NC9, NC5, WL5].
- **Session 1 said** "add an export to addon action". That is **not feasible**: the addon only reads
  the character out of the game [A2]. U.GG's Auto-Import sends a build into the client [M1], which
  this app cannot do.
- **What changes:** in the empty Gear state, offer two equal routes: "Equip the recommended set"
  (R10) and "Import your character", which opens the same `/pdexport` paste flow the front door
  already has [A2]. WoWSims puts its addon import inside the sim's Import menu, next to where the
  gear lands [NC5, NC9]; the app's version would put it where the empty slots are. No new data path
  is needed.

### R4. Keep the game version and phase visible on every screen, as a styled chip

- **From:** T2 (15 platforms: WoW site and Armory, Wowhead, Raider.IO, CurseForge, Tracker.gg,
  Blitz, Maxroll, WoWSims and others) [B1, B10, W1, RI1, NB20, NB25, NC20, NC11, NC3].
- **What changes:** sections without a character (Raids, Professions, Tier Lists) show the same "TBC
  Classic · Phase 2" context in the top bar, styled as Wowhead styles its current version (the
  strongest color on the bar) [W1, A1]. If more phases arrive, this chip becomes the phase switcher
  and drives R10.
- **Note:** Blizzard's Armory has offered Burning Crusade Classic characters since at least
  2026-08-27 [B10, B11]. It is the closest official surface to this app.

### R6. Move section accents into tokens, and add game-concept tokens

- **From:** T1 (14 platforms; EA's font-token fallback chain, Amazon's shared `ags-` library) and T15
  (WoWSims, Blitz, Tracker.gg, Icy Veins, Wowhead) [NA14, NB13, NB14, NC5, NC21, NB25, NC17, W1].
- **What changes:**
  - The five section hues are hard-coded hex strings in `SectionPicker.tsx`, and `--profession-accent`
    appears in two blocks of `global.css` [A2]. Define `--section-planner`, `--section-raids` and so
    on on `:root` and reference them.
  - Add a gain / loss pair (`--delta-up`, `--delta-down`) that both factions share, for Compare and
    Ranked Gear deltas, as Tracker.gg and Blitz color every change by direction [NB24, NC21]. Name
    game concepts directly (quality, class, school) where the app already uses those colors, as
    WoWSims does [NC5].

### R11. One plain-language line beside dense numbers (new)

- **From:** T16 (WoWSims assumption note and cap status; Blitz generated summary; Icy Veins prose
  under BiS tables) [NC5, NC21, NC17].
- **What changes:** in the simulator's buff settings, one sentence on what is assumed (for example
  "Selected buffs are assumed to come from other raid members"), as WoWSims does [NC5]; on the stat
  strip, state cap status in words ("Hit: 1.2% under cap") next to the rating and percent [NC5]. Do
  not generate prose summaries of curated data; one line per panel is enough.

## Priority 3: smaller or conditional

### R7. Keep the first paint meaningful and the fonts steady

- **From:** T11, now weakened as a trend: only Epic and WoWSims state speed as a goal, while
  Maxroll, Icy Veins, HoYoLAB and Bungie.net show the cost of ignoring it [E4, NC5, NC12, NC16, NB3,
  U1].
- **What changes:** on the live site the loading intro briefly drew its title in the fallback serif
  before Cinzel arrived (seen 2026-10-01, one load) [A1]. A `<link rel="preload">` for
  `cinzel-variable.woff2` in `index.html` would avoid the swap on the one screen where the title is
  the whole design [A2]. Kept, but low priority: the evidence is now mostly counter-examples.

### R12. Label how finished the simulator is (new, conditional)

- **From:** T17 (WoWSims "Alpha" / "Gear Planner", Blitz "New", Icy Veins beta) [NC4, NC21, NC19].
- **What changes:** if any spec's simulation is less complete than others, say so on the spec, as
  WoWSims labels healers "Gear Planner" (no damage sim) [NC4]. Only WoWSims uses labels for accuracy
  rather than novelty, so this is conditional on the app actually having uneven coverage [NC4].

## Keep (no change; decisions to hold)

### R3. Keep the hard-edged, dark, Cinzel-headed look

- **From:** T7 narrowed (franchise sites square, 13 of 14), T8 narrowed (every franchise site pairs a
  display face with a UI face), T9 narrowed ("tools stay dark", 11 of 12) and T1 [R1, NA9, NB9, NB13,
  NC19].
- **What changes:** nothing structural. Record as a design rule in `docs/design/` (when someone next
  edits design docs): buttons stay at `--radius: 2px` with one flat accent, the app stays dark, Cinzel
  stays display-only with Barlow Semi Condensed for UI and numbers.
- **Why, with the new evidence:** the app is a tool with an in-world identity, and the evidence
  splits exactly there. Tools are trending to one neutral sans and small radii (T18; Icy Veins,
  Blitz, Maxroll) [NC16, NC20, NC10], while franchise sites keep square buttons and a display face
  [R1, NA9, NB13]. Path of Exile 2 uses Cinzel for headings and CTAs with 0 px buttons [NB9], and
  WoWSims keeps 0 px buttons [NC5]. Icy Veins' 2026 redesign chose dark on purpose [NC19]. Nothing
  here argues for pills or a light theme.

### R9. Keep the accessibility work; it is ahead of the genre

- **From:** T12, corrected: 2 of 9 community tools have a skip link (Wowhead, Icy Veins hub), and
  about half of publishers do [W1, NC16, K1].
- **What changes:** none. The app's skip link, focus-visible rings and reduced motion in both CSS and
  JS exceed every theorycraft tool surveyed (WoWSims, Maxroll and Blitz have no skip link) [A2, NC5,
  NC10, NC20]. Keep real headings and alt text in any "in-game" restyle; HoYoverse's art-first pages
  show what is lost without them [NB1, NB2].

### R8. Hold the line on navigation depth

- **From:** T4, strengthened (Steam, WoW site, Epic, Icy Veins on the web; Riot, EA, HoYoverse,
  Ubisoft, GOG on launchers) [V2, B1, E1, NC19, R8, NA18, NB4, NA12, NA26].
- **What changes:** nothing now. The app has two tab levels [A1]. Before adding a seventh section or
  a third tab level, consider merging (for example Compare into Gear).

## Considered and not recommended

- **A light theme** (T9): "marketing goes light" no longer holds as a trend, and 11 of 12 tools are
  dark [NA8, NA13, NC19].
- **Dropping Cinzel for one neutral face** (T18): the single-face tools are data-first products
  without an identity to carry [NC16, NC20]; the app's identity is part of its design brief [A2].
- **Export to the addon / send-to-game** (T10): not feasible, see R5 [A2].
- **Controller / handheld shells** (Steam, Xbox): no web-planner equivalent [V5, X4].
- **Wider content by default** (Steam 1200 px): one platform only; the app was not measured against
  it [V3].
- **`border-image` frames** (Path of Exile 2): a single-platform technique; worth knowing if the
  bevels are ever rebuilt, not a recommendation [NB9].

---

## What changed since session 1

| Session-1 rank | Item | Now | Why |
|---|---|---|---|
| P1 #1 | R1 Global search, Ctrl K | P1 #3 | T3 narrowed; WoWSims has no search [NC5] |
| P1 #2 | R2 Provenance next to numbers | **P1 #1**, widened with freshness, changelog and live-vs-target phase | T5 strongest trend; new T13; Icy Veins / WoWSims phase gap [NC5, NC17] |
| P1 #3 | R3 Keep hard edges | Moved to "Keep" | No action; evidence still supports it, now split by site type (T7, T8, T9) |
| P2 | R4 Version chip | P2, unchanged; feeds R10 | T2 strengthened |
| P2 | R5 Export to addon | P2, **reframed** to "Import your character" beside the recommended set | Addon is read-only out of the game [A2]; WoWSims Exporter is the same direction [NC9] |
| P2 | R6 Section tokens | P2, widened with game-concept tokens and a delta pair | T1 strengthened; new T15 |
| P3 | R7 First paint | P3, unchanged | T11 weakened |
| P3 | R8 Navigation depth | Moved to "Keep" | No action |
| P3 | R9 Accessibility | Moved to "Keep" | T12 corrected; app still ahead of tools |
| — | R10 Phase presets | **New, P1 #2** | New T14 (WoWSims, Maxroll, Icy Veins) |
| — | R11 Plain-language line | New, P2 | New T16 |
| — | R12 Simulator status label | New, P3, conditional | New T17 |

Also changed: R3's "player tools are all dark" now rests on 11 of 12 tools [NC19]; R9's comparison
now covers the theorycraft tools [NC5, NC10, NC20]; the Riot "lightweight client" support for R7 was
dropped because it rested on a weak source [R3].
