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
model that active target debuffs actually modify (including a spell-crit-taken debuff, e.g. Winter's
Chill). White-damage now also includes real per-weapon damage/speed dice (`GearItem.weaponSpeed` /
`weaponDamageMin` / `weaponDamageMax`) for every weapon in the catalog, not just attack power — a
handful of items have real Wowhead-sourced values, the rest are stat-budget-matched representative
estimates flagged `needsVerification` (the catalog is largely non-canonical sample/placeholder gear,
so most weapons don't have a real tooltip to source from in the first place).

Per-spec signature abilities (`src/domain/abilities/`) now drive the caster and healer estimates: one
researched ability per spec supplies its real cast time, base amount, and coefficient in place of the
old generic 3s-nuke / 2.5s-heal placeholders. Each ability's researched coefficient is read rather than
recomputed, so the hardcoded TBC exceptions stay correct (Fireball 1.0, Frostbolt 0.8143). Specs whose
signature ability is a physical special keep the generic cast on the spell side, since those scale off
attack power and belong to the physical path. Configurable encounter settings and computed stat weights
are also in.

The physical path now layers a spec's signature melee special on top of white damage, through a
separate "yellow" attack table — specials can't glance and don't take the dual-wield miss penalty, and
getting either wrong would misprice every melee spec. Usage rate is only claimed where it can be
defended: an ability with a cooldown is used on cooldown, and an energy-costed ability is bounded by
energy's fixed 10/sec regen. Rage-costed abilities without a cooldown, and Hunter's mana-costed Steady
Shot, are deliberately excluded and named in the result summary, since rage income and auto-shot
weaving aren't modelled.

What's still missing: multi-ability rotation priority (only the single signature ability counts, so
melee specs remain understated), proc modeling, talent scaling, multi-iteration variance, and result
charts.

## Phase 5: Planner Workflows

- Save/load builds
- Import/export support
- Gear comparison
- Upgrade planning
- Source and cost planning
- Better responsive/mobile layout

Upgrade planning is in: `findUpgrades` scans every candidate item per visible slot, re-scores it against
the live simulation, and the Upgrades panel offers a one-click equip.

Save/load and import/export are now wired. The full build — character, gear, gems, enchants, buffs,
consumables, target debuffs and encounter settings — autosaves to `localStorage` and is restored on
load, and the Build panel exports a portable JSON snapshot that can be pasted back in. Imports are
validated rather than trusted: a structurally invalid payload or an unknown format version is refused
outright and changes nothing, while a build referencing an item that has since left the catalog still
loads with the affected slots dropped and listed, so a catalog change can't render an old build
unusable.

The caveat worth stating plainly is that there is exactly **one** autosaved build. It is a "your work
survives a refresh" feature, not a build library — switching character overwrites it, and keeping two
setups side by side means exporting one by hand. Named build slots, gear comparison, source/cost
planning, and a real mobile layout are all unstarted.

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

## Raid Reference Data

A separate raids domain (`src/domain/raids/`) covers all five Phase 1/2 raids — Karazhan, Gruul's Lair,
Magtheridon's Lair, Serpentshrine Cavern, and Tempest Keep — boss by boss, with mechanics written to
cover only what changes how a raider plays the fight, per-role callouts, notable drops linked to the
item catalog where the item exists, and full ordered attunement chains for SSC and Tempest Keep.
Surfaced in its own Raids tab. Drops that are real but not yet catalogued are listed by name and
flagged `needsVerification` rather than given an invented item id.

## Project Brain (Obsidian vault)

`brain/` is a generated Obsidian vault mapping the project as a graph: one note per source module with
real import edges, the TBC domain as a linked wiki, and the roadmap/decisions/provenance as notes.
Generated by `tools/brain/generate-brain.mjs` (`npm run brain`) from the actual source tree and domain
data, so it cannot drift from the code. Idempotent, fails on broken wikilinks, and preserves anything
written below each note's manual marker.

## Current Known Limitations

- Simulation formulas use real TBC attack-table/spell-table mechanics, and every path now models one
  real ability per spec — but only one. No rotation priority, procs, or talent scaling anywhere; some
  physical specials are excluded outright where their rate isn't computable. See Phase 4 above.
- Current item/gem/enchant data is sample data, not a real database. One known inconsistency:
  `training-sword`'s `wowItemId` (28034) resolves to an unrelated real item, not the "Training Sword"
  its name/stats describe — noticed while backfilling weapon damage data, not yet fixed.
- Existing guide data under `src/data` remains disconnected from the active MVP foundation.
- No backend is planned for the near term; the app should stay local-first.
