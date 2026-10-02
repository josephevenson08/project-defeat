# WoWSims (TBC simulator web UI)

Looked at: 2026-10-01. Session 2, batch C. Source IDs refer to
`../sources.md`. Pages inspected in the Claude browser pane at a 1024 x 768 CSS px viewport
(`innerWidth` 1024), measured by computed-style script; screenshots timed out on every attempt, so
nothing here is from a screenshot [NC1-NC5]. This is the closest existing competitor to Project
Defeat's simulator and gear-planner panels.

## Headline finding: the URL most people know is retired

- **wowsims.github.io/tbc is the 2021 sim and is now marked outdated** (seen) [NC2]. Opening a spec page
  shows a full-screen modal saying it was built for the original TBC Classic (2021), is no longer
  maintained, and pointing to wowsims.com, plus a red-tinted warning box in the sidebar explaining
  how to carry gear across (Export, then Import > Addon in the new sim) [NC2].
- The old repository's README says the same: the 2021 sim is "not maintained nor monitored", and
  TBC Anniversary support lives in a new repository, `wowsims/tbc-new` [NC8].
- The new sim lives at **wowsims.com/tbc** under a multi-version landing page (seen) [NC3, NC4]. Its
  repository records about 21,900 commits, says it was forked from the Mists of Pandaria sim, and
  ships downloadable local builds for Windows, macOS and Linux [NC6]. Releases were going out
  almost daily in September (v0.0.137 on Sep 14 to v0.0.146 on Sep 30; GitHub omits the year for
  the current year, so 2026 is inferred) [NC7].

## What I saw (2026-10-01)

### Landing pages

- **wowsims.com**: a one-line pitch, "From Classic to Forever.", in an 800-weight heading, three
  buttons (Discord, GitHub, Exporter addon), then a grid of **version cards** (Forever "Coming
  soon", Mists, Cataclysm, Wrath, TBC, Classic, Season of Discovery), each a 12 px-radius card with
  a cover image and a game logo [NC3]. Footer states it is fan-made and not affiliated with
  Blizzard [NC3]. This is T2 (version as the first choice) on a community tool.
- **wowsims.com/tbc**: a short welcome line, then one entry per class with the specs inside; each
  spec carries a **maturity label**, either "Alpha" (full sim) or "Gear Planner" (healers: no
  damage sim, gear only) [NC4].
- **Old landing (wowsims.github.io/tbc)**: a heading in gold `rgb(224,163,53)`, 56 px, over pure
  black, followed by a list of 16 class icons and uppercase spec names (Raid sim first) [NC1].

### The sim page (new UI, Elemental Shaman and DPS Warrior)

- **Two-column app shell** (seen): a sticky, full-height left sidebar 282 px wide on
  `rgb(21,23,30)`, and a main column with a sticky tab header [NC5]. Class names are Tailwind
  utilities (`h-dvh`, `sticky`) [NC5].
- **Sidebar, top to bottom** (seen): breadcrumb-like title ("WoWSims - The Burning Crusade",
  "Elemental Shaman"), a gold **status line "Phase 3 (2.2 - T6) - Alpha"** (10.5 px, class
  `ui-sim-link-status`), an Iterations field, primary actions **Simulate / Suggest Gems / Stat
  Weights**, a "Did you know?" tip offering a faster local download, then a **live character-stats
  table** [NC5].
- **Stats show derived values in brackets** (seen): "Spell Hit 104 (15.24%)", "Spell Crit 369
  (39.18%)", "Nature Spell Damage 1372 (+80)"; for the warrior the table ends with **"Melee Crit
  Cap: Under by 27.82%"** [NC5]. Rating, percent and cap status sit on one line.
- **Main tabs** (seen): Gear, Settings, Talents, Rotation, Results, "Batch (New)"; plus Import,
  Export and **Known Issues** controls [NC5]. Inactive tabs are muted blue-grey
  `rgb(165,177,214)`, active white [NC5].
- **Gear tab** (seen): each slot shows the **item level as a small badge** (10.5 px on a 75% black
  chip, class `ui-item-picker-ilvl`) beside the item name and the enchant text under it ("146 /
  Skyshatter Headguard / +22 Spell Power and +14 Spell Hit Rating") [NC5]. Below: a **Gem Summary**
  with counts per gem and a "Reset gems" action, and **Gear Sets** presets: Pre-Raid, Phase 1 (A),
  Phase 1 (H), Phase 2 to Phase 5, with a named "Save Gear Set" [NC5]. Import options include
  "Import From Bags" and "Import Favorites" [NC5].
- **Settings tab** (seen): Encounter (duration, +/- variance, preset bosses such as Magtheridon 25
  and Archimonde 25), Player (race, two professions), Consumables, Raid Buffs, Party Buffs. Buff
  groups carry a plain-language **assumption note**: selected buffs are assumed to come from other
  raid members [NC5].
- **Results tab** before a run (seen): "Sim 1 Iteration", "Simulate a Death", sub-tabs Damage /
  Buffs / Debuffs / Casts / Resources / Timeline / Log, and an empty state "Run a simulation to view
  results" [NC5].
- **Alpha rough edge** (seen): the TBC profession list includes Inscription, which did not exist in
  TBC; consistent with the codebase being forked from a later-expansion sim [NC5, NC6].

### Tokens and theming (seen)

- **Accent re-skinned per class**: the Simulate button is `rgb(36,89,255)` on Shaman and
  `rgb(199,156,110)` on Warrior, matching the root tokens `--color-class-shaman: #2459ff` and
  `--color-class-warrior: #c79c6e` [NC5]. Square corners (0 px) on all buttons measured [NC5].
- **Game-semantic token set** on `:root`: class colors with paired foregrounds
  (`--color-class-rogue-foreground: #000`), spell-school colors (`--color-school-arcane`,
  `--color-school-shadow`), item quality (`--color-quality-epic: #a335ee`), resources
  (`--color-resource-health`), timeline (`--color-timeline-cast`) and talent states
  (`--color-talent-full: #ffd100`) [NC5].
- **Type**: one family, `SimDefaultFont`, which the old build's `@font-face` maps to Plus Jakarta
  Sans regular and bold [NC1, NC5]. Body 14 px white on near-black; Font Awesome for icons [NC5].
- **Item tooltips** come from Wowhead's tooltip script (`wow.zamimg.com/js/tooltips.js`) on the new
  sim, and `power.js` on the old one [NC2, NC5]. Release notes from Sep 30 tweak tooltip pointer
  behaviour [NC7].

### Old UI for comparison (seen, 2021 build)

- 250 px sidebar on `rgb(17,18,24)`, a main area with a 95% navy overlay on a background image,
  Bootstrap 3, jQuery, Chart.js and ApexCharts; tabs Gear / Settings / Talents / Detailed Results /
  Log; preset buttons "P1 Preset" to "P5 Alliance Preset"; teal `rgb(34,141,176)` square buttons
  [NC2]. The layout skeleton (sidebar of stats and actions, tabs on the right) survived the rebuild;
  the stack, tokens and per-class accent are new [NC2, NC5].

### Accessibility and bridge (seen / reported)

- No skip link found on any of the four pages; `prefers-reduced-motion` rules found: 3 on the new
  sim page, 32 on wowsims.com, 1 on the old sim; no `prefers-color-scheme` rules [NC1-NC3, NC5].
  One stylesheet unreadable on the sim page, so counts are a floor [NC5].
- **Game-client bridge**: the WowSims Exporter addon (updated 2026-08-05) generates an export
  string with `/wse export` for pasting into the sim's Import > Addon [NC9]. It is linked from the
  landing page [NC3].

## Changes since 2024 (from dated sources)

- The TBC sim was rebuilt as `tbc-new` for TBC Anniversary and moved to wowsims.com; the old
  github.io build now carries a deprecation modal [NC2, NC6, NC8]. Exact launch date of the new TBC
  sim not found; releases visible from 2026-09-14 [NC7], and the Wayback Machine has
  wowsims.com/tbc/ from 2026-03-31 [NC4].
- New sim adds Rotation and Batch tabs, Suggest Gems, Known Issues, Gem Summary, per-phase gear
  sets and a local-sim download prompt [NC5].

## Techniques worth noting

- **Phase and maturity printed in the sidebar of every sim** ("Phase 3 (2.2 - T6) - Alpha") [NC2, NC5].
- **Rating, percent and cap status on one stat line**, live as gear changes [NC2, NC5].
- **Accent color = the class color**, driven by a game-semantic token set [NC2, NC5].
- **Gear presets named by phase and faction** next to save-your-own [NC2, NC5].
- **Assumptions written next to the inputs** (who provides the buffs) [NC2, NC5].
- **Explicit deprecation**: the old tool tells you it is old and how to move your data [NC2, NC5].

## Relevance to Project Defeat

WoWSims solves the same job as the app's simulator and gear planner, with a denser, plainer shell:
no framing, one sans face, square controls, class color as the only accent [NC5]. The ideas to borrow are
cheap: a phase/version status line beside results, bracketed percentages and cap status on stats,
phase-named preset gear sets, and a one-line assumption note on buff inputs [NC5]. Where Project Defeat
can differ is identity (faction theming) and polish; WoWSims labels itself Alpha and shows rough
edges such as Inscription in a TBC profession list [NC5].
