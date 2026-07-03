# Project Defeat Roadmap

## Long-Term Goal

Build Project Defeat into a local-first TBC Classic Anniversary simulator/planner that supports all classes/specs, gear, enchants, gems, talents, buffs, debuffs, consumables, rotations, encounter settings, save/load builds, import/export, and gear comparison.

## Phase 1: Local Foundation

- Local React/Vite app
- All TBC classes/specs represented
- Faction/race selection
- Full TBC slot model
- Sample gear, gems, enchants
- Expanded starter gear options for every slot
- Enhancement Shaman Phase 2 ranked/BiS proof-of-concept data
- Prototype stat calculation
- Role-aware prototype results
- Anime.js UI polish with reduced-motion support
- Playwright flow coverage

## Phase 2: Gear, Gems, Enchants

- Replace sample items with structured TBC item data
- Split base item definitions from class/spec/phase slot rankings as coverage grows
- Import guide-backed ranked items by class/spec/phase/slot
- Add real socket layouts and socket bonuses
- Add real gem and enchant options
- Add source, material, profession, and phase metadata
- Add legality checks for class, weapon, relic, and profession restrictions
- Expand spec-aware recommendation filters beyond the Enhancement Shaman starter rules
- Expand spec-aware slot labels and hidden-slot rules beyond the Enhancement Shaman Totem/Ranged treatment
- Phase 2 starter BiS, weapon-legality rules, and spec-aware slot visibility now cover all nine
  classes and all 27 specs; remaining Phase 2 work is reconciling `needsVerification` items against
  real Wowhead tooltips and closing gem/enchant coverage gaps (tank meta gem, leg/shoulder/cloak enchants)

## Phase 3: Character Systems

- Talent trees
- Buffs and debuffs
- Consumables
- Profession bonuses
- Race/class-specific assumptions
- Feral bear/cat mode split

## Phase 4: Simulation

- Class/spec-specific formulas
- Rotation configuration
- Encounter settings
- Simulation iterations
- Result variance
- Result charts and breakdowns

## Phase 5: Planner Workflows

- Save/load builds
- Import/export support
- Gear comparison
- Upgrade planning
- Source and cost planning
- Better responsive/mobile layout

## Phase 6: In-Game Import (CurseForge Addon)

- Build a companion WoW addon (distributed via CurseForge) that reads the player's live character
  state in-game: equipped gear, gems, enchants, talents, professions, and known recipes.
- Addon exports that state to a file (or copyable string/SavedVariables blob) the player can paste
  or upload into this site.
- The site parses the export and can then:
  - Show exactly what's missing versus the current BiS list for the player's spec/phase.
  - Run the DPS/HPS simulator against the player's actual gear instead of a hand-picked build.
  - Suggest concrete upgrades with source/farm/crafting detail already in the item database.
- No backend is required for this if export/import stays client-side (paste a blob, parse in
  the browser); a small backend only becomes necessary if we want shareable links or account sync.

## Current Data Provenance

Wowhead and WoWSims are the primary research sources for item data, BiS rankings, and simulation
formulas going forward (per project direction). Wowhead's guide pages are JS-rendered, so item
stat blocks are currently best-effort approximations cross-checked against static summaries and
prior knowledge; every approximated value is flagged `needsVerification: true` in the data files
until it's been checked against an actual Wowhead item tooltip.

## Current Known Limitations

- Current formulas are useful only as deterministic placeholders.
- Current item/gem/enchant data is sample data, not a real database.
- Existing guide data under `src/data` remains disconnected from the active MVP foundation.
- No backend is planned for the near term; the app should stay local-first.
