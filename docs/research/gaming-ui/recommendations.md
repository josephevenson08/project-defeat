# Recommendations for Project Defeat

Prioritized. Each item names the trend(s) in `trends.md` it comes from, the platforms behind it,
what in this app it would change, and what to leave alone. Nothing here has been implemented; these
are suggestions for a planned change, per the project's plan-before-changes rule.

## What the app is today (read 2026-10-01)

From the source (`src/styles/global.css`, `src/styles/fonts.css`, `src/components/*`) and the live
site (https://josephevenson08.github.io/project-defeat/, opened 2026-10-01 at a 1280 px viewport) [A1, A2]:

- Dark, near-monochrome UI; tokens on `:root`, re-skinned by `[data-faction='horde']`; section hues
  passed as `--section-accent` (hard-coded hex values in `SectionPicker.tsx`) and `--panel-accent`.
- Cinzel (display) + Barlow Semi Condensed (UI), self-hosted, `font-display: swap`; tabular
  numbers on stats; `--radius: 2px`; metal-edge brackets and bevels.
- Front door: five section cards over a faction backdrop, plus "import your character".
- Planner (live): a top section tab bar (Character Planner, Simulation, Raid Composition, Spec Tier
  Lists, Raids, Professions), a character header ("Human Fury Warrior · Alliance · Phase 2"), a
  horizontal stat strip (Attack Power, Hit, Crit, Haste, Expertise, Armor Pen, "All 12 stats"), a
  second tab row (Gear, Compare, Talents, Buffs, Ranked Gear, Build), and an empty state with
  "Equip the recommended set". The live shell rendered with `app-shell-no-rail`.
- Accessibility: skip link, `:focus-visible` rings, reduced motion honored in CSS **and** in the
  anime.js helpers (`src/lib/animations.ts` checks `prefers-reduced-motion`).
- Search: one "Filter by name" field inside the gear slot pane; no global search.
- Provenance: tier lists link their source at the bottom of each panel; BiS rows show source,
  phase and a needs-verification note; boss cards show a drop count.

---

## Priority 1: do these

### R1. Add a global search with a Ctrl K shortcut

- **From:** T3 (Steam, Raider.IO, Wowhead, Epic, Blizzard Armory).
- **What changes:** a search field in the top bar (`AppShell` header, beside `TabNav`) that finds
  items, bosses, specs and professions across sections and jumps to them. Show a visible "Ctrl K"
  hint as Raider.IO does, and, like Steam's 2025 dropdown, show recently viewed items before the
  user types. The existing slot-pane filter stays as the local filter.
- **Fit:** the data is already client-side, so this is an index over existing `src/domain` data,
  not a backend. Style it as a bevelled field using the existing `--line` / `--metal-edge` tokens.
- **Why first:** every platform in T3 treats search as primary navigation, and the app has six
  sections plus six planner tabs, which is a lot to click through to find one item.

### R2. Put phase, source and date next to the numbers, not under them

- **From:** T5 (U.GG, Riot, Marathon, Wowhead, Xbox, Epic) and T6.
- **What changes:**
  - Tier list panels: move the source link from the foot of the panel (`.tier-source` in
    `TierListsPanel.tsx`) into the header as a chip, and add an "as of" date (for example
    "Wowhead · Phase 2 · updated <date>"), the way U.GG prints "Patch 26.19" in the title. This needs
    a date field in the tier list data, which does not exist yet.
  - Planner and Raids sub-tabs: allow a count in tab labels (Wowhead's "Comments (78)"), for
    example "Ranked Gear (14)" or a boss tab's drop count. `TabDefinition` would gain an optional
    `count`.
  - Reuse one small "provenance chip" component for phase / source / verification instead of
    per-panel markup, so BiS rows, loot rows and tier lists show it the same way.
- **Keep:** the existing needs-verification note on BiS rows. It is already better practice than
  most of the tools surveyed.

### R3. Keep the hard-edged, faction-themed look; do not drift toward pills

- **From:** T7 (League, VALORANT, Marathon, WoW, Overwatch, Diablo IV vs blizzard.com, Xbox, Epic,
  PlayStation), T8, T9, T1.
- **What changes:** nothing structural. Record as a design rule in `docs/design/` (when someone
  next edits design docs) that buttons stay at `--radius: 2px` with one flat accent, that the app
  stays dark (player tools in T9 are all dark), and that Cinzel stays display-only with Barlow Semi
  Condensed for UI and numbers.
- **Why:** in 2026 the in-world game sites still use square, single-color CTAs and an engraved or
  condensed display face over a plain sans; rounded pills belong to neutral store shells. The app's
  current choices match the game-identity side. U.GG uses Barlow for headings too [M1], which
  confirms the UI face is in the genre.

## Priority 2: worth doing

### R4. Keep the game version visible on every screen, as a styled chip

- **From:** T2 (WoW site, WoW Armory, Wowhead, Raider.IO, Riot, U.GG, Mobalytics).
- **What changes:** the planner header already shows "Alliance · Phase 2", and the front door says
  "TBC Classic · Phase 2". Sections without a character (Raids, Professions, Tier Lists) should show
  the same "TBC Classic · Phase 2" context in the top bar, styled as Wowhead styles its current
  version (the strongest color on the bar). If Phase 3 data arrives, this chip becomes the phase
  switcher.
- **Note:** Blizzard's Armory now covers Burning Crusade Classic characters (seen 2026-10-01) [B10].
  That is not a UI trend, but it is the closest official surface to this app and worth knowing.

### R5. Put import/export next to the thing it applies to

- **From:** T10 (U.GG Auto-Import, Raider.IO app and addon, Mobalytics, Archon, Xbox).
- **What changes:** the addon import lives on the front door and in `BuildPanel`. Add an "export to
  addon" action beside the recommended set ("Equip the recommended set" empty state and the BiS
  panel), the way U.GG puts Auto-Import on the build it exports.

### R6. Move section accents into tokens

- **From:** T1 (Blizzard `theme` attribute, PlayStation campaign tokens, Riot shared template).
- **What changes:** the five section hues are hard-coded hex strings in `SectionPicker.tsx` and the
  profession accents are repeated in `global.css` (`--profession-accent` appears in two blocks).
  Define `--section-planner`, `--section-raids` and so on on `:root` (and per faction if they should
  shift) and reference them. Same look, one place to change it, matching how the faction theme
  already works.

## Priority 3: smaller or conditional

### R7. Keep the first paint meaningful and the fonts steady

- **From:** T11 (Epic, Riot, Wowhead; Bungie.net empty shell as counter-example).
- **What changes:** on the live site the loading intro briefly drew its title in the fallback serif
  before Cinzel arrived (seen 2026-10-01, one load). A `<link rel="preload">` for
  `cinzel-variable.woff2` in `index.html` would avoid the swap on the one screen where the title is
  the whole design. The intro already shows "Loading item data...", which is better than a spinner.

### R8. Hold the line on navigation depth

- **From:** T4 (Steam, Riot, WoW site, Epic, Destiny 2).
- **What changes:** nothing now. The app has two tab levels (six sections, six planner tabs). The
  2024-2026 redesigns all removed a layer. Before adding a seventh section or a third tab level,
  consider merging (for example Compare into Gear, or Simulation into the planner tabs).

### R9. Keep the accessibility work; it is ahead of the genre

- **From:** T12.
- **What changes:** none. The skip link, focus-visible rings and reduced motion in both CSS and JS
  already exceed what Riot, Raider.IO and U.GG ship (as far as a script could see) and match
  xbox.com and playstation.com. Keep them in any redesign.

## Considered and not recommended

- **A light theme** (T9): publishers' marketing sites are going light, but every player tool
  surveyed is dark, and the app is a tool.
- **Controller / handheld shells** (Steam, Xbox): no web-planner equivalent.
- **Wider content by default** (Steam 1200 px): one platform only; the app's layout was not
  measured against it.
