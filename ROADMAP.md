# Project Defeat Roadmap

## Long-Term Goal

Build Project Defeat into a local-first TBC Classic Anniversary simulator/planner that supports all classes/specs, gear, enchants, gems, talents, buffs, debuffs, consumables, rotations, encounter settings, save/load builds, import/export, and gear comparison.

## Phase 1: Local Foundation

- Local React/Vite app
- All TBC classes/specs represented
- Faction/race selection
- Full TBC slot model
- Sample gear, gems, enchants
- Prototype stat calculation
- Role-aware prototype results
- Playwright flow coverage

## Phase 2: Gear, Gems, Enchants

- Replace sample items with structured TBC item data
- Add real socket layouts and socket bonuses
- Add real gem and enchant options
- Add source, material, profession, and phase metadata
- Add legality checks for class, weapon, relic, and profession restrictions

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

## Current Known Limitations

- Current formulas are useful only as deterministic placeholders.
- Current item/gem/enchant data is sample data, not a real database.
- Existing guide data under `src/data` remains disconnected from the active MVP foundation.
- No backend is planned for the near term; the app should stay local-first.
