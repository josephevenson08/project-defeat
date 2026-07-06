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
  classes and all 27 specs, including a tank meta gem, a healer meta gem, a caster meta gem, and
  Shoulder/Back/Leg enchants for every role that historically had one in Phase 1/2 TBC; remaining
  Phase 2 work is reconciling `needsVerification` items against real Wowhead tooltips

## Phase 3: Character Systems

- Talent trees
- Buffs and debuffs
- Consumables
- Profession bonuses
- Race/class-specific assumptions
- Feral bear/cat mode split

Buffs (flat stats + percentage multipliers), target debuffs (armor reduction, crit taken, spell
damage taken), and consumables (flasks/elixirs/food with Alchemy/Cooking crafting provenance) are
implemented and wired into `calculateStats`/`calculateSimulation`, with a Buffs & Consumables panel
in the UI. A separate Professions domain (`src/domain/professions/`) covers all 13 TBC professions'
skill tiers/trainer requirements and raw-material farm locations/leveling paths, surfaced in its own
Professions tab — this is leveling/farming reference data, distinct from the still-unstarted
"profession bonuses to stats" item above (e.g. extra sockets from Blacksmithing). Talent trees,
race/class-specific assumptions beyond legality checks, and the Feral bear/cat mode split remain
unstarted.

## Phase 4: Simulation

- Class/spec-specific formulas
- Rotation configuration
- Encounter settings
- Simulation iterations
- Result variance
- Result charts and breakdowns

The simulator now uses real TBC attack-table/spell-table mechanics (`src/domain/simulation/`) —
sourced miss/dodge/parry/glance/block/crit tables, rating-to-percent conversions, spell hit/crit,
and armor mitigation — instead of flat stat-times-coefficient placeholders, and factors in a target
model that active target debuffs actually modify. What's still missing: per-spell/per-ability
rotation modeling (each role currently estimates from a generic filler-cast/white-damage assumption,
not real rotation priority or cooldowns), per-weapon damage/speed data (white damage is AP-driven
only), configurable encounter settings, multi-iteration variance, and result charts.

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

- Simulation formulas use real TBC attack-table/spell-table mechanics, but still assume a generic
  filler cast/white-damage baseline rather than per-spell rotation modeling — see Phase 4 above.
- Current item/gem/enchant data is sample data, not a real database.
- Existing guide data under `src/data` remains disconnected from the active MVP foundation.
- No backend is planned for the near term; the app should stay local-first.
