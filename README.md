# Project Defeat

Project Defeat is a local-first React + TypeScript + Vite simulator/planner for **TBC World of Warcraft Classic Anniversary**.

It is a working planner rather than an accuracy-complete simulator: gear, gems, enchants, talents,
buffs, debuffs, consumables and raid composition are all real and sourced, while rotations remain the
largest modelling gap. Every dataset is traceable to a pinned source, and anything the app cannot
model says so on the surface that would otherwise imply it had.

**Live: https://josephevenson08.github.io/project-defeat/**

## Current Status

Working planner, targeting **TBC Phase 2** (SSC/Tempest Keep, Tier 5) and only Phase 2. The gear
catalogue, BiS rankings, talents, buffs, raids and professions are all real and sourced; the
simulation behind them is built and tested but **hidden by default** while its estimates are known to
be indicative — see `src/featureFlags.ts`, which states exactly what is and is not modelled.

## Current Features

- TBC class/spec selection for all nine TBC classes
- Faction-aware race selection with real TBC race/class legality (e.g. Human can't be a Shaman, Blood Elf can't be a Warrior)
- Full TBC-style gear slot model
- **4,554 catalogued items**, 99.5% carrying a real WoW item ID, ingested from a pinned wowsims/tbc
  commit and merged with a curated provenance layer (drop location, roles, crafting)
- **Phase 2 and only Phase 2.** 1,196 later-phase items are ingested but gated out of every path a
  player can reach — the picker, the default set, the upgrade finder, saved builds and imports
- Source/farming metadata fields for gear, including instance, boss, vendor, reputation, crafting profession, and notes
- Crafted items can show full recipe detail: required profession skill level, specialization, where the recipe/pattern is obtained, and each material's own farm/source location
- Phase 1/2 starter ranked/BiS data for all nine TBC classes and every spec (27 specs total: Shaman, Warrior, Paladin, Priest, Druid, Hunter, Mage, Rogue, Warlock)
- Spec-aware starter filtering for gear, relics, and enchants across every class (legal weapon types per class, dual-wield vs. single-weapon rules, class-appropriate relic type)
- Spec-aware gear slot visibility for every class, including the Totem/Libram/Idol relic display for Shaman/Paladin/Druid and the hidden Ranged-vs-Relic slot swap
- 212 gems and 91 enchants, ingested and validated, with per-spec gem and enchant recommendations from Wowhead
- Calculated stat totals from base stats, gear, gems, socket bonuses, and enchants
- Role-aware prototype simulation outputs:
  - Physical DPS
  - Caster DPS
  - Healer
  - Tank
- Result breakdown panel
- Raids tab: all five Phase 1/2 raids boss by boss, with notable drops colour-coded by item quality
  where the drop exists in the catalog, and step-by-step attunement chains for Karazhan,
  Serpentshrine Cavern and Tempest Keep — the three that have one. Boss mechanics and per-role
  callouts are still in the domain data but are deliberately not rendered: the tab answers "what
  drops here", and a fight guide is a different question asked at a different time
- Spec Tier Lists section: Wowhead's Phase 2 DPS, healer and tank rankings, 28 placements covering all
  27 specs, with the current character's spec marked on every list it appears on. Tier letters and
  membership only — Wowhead's analysis prose is not reproduced, and each list links back to its page.
  These rank *specs*, not items, so they deliberately do not feed the per-slot BiS rankings
- **Raid Composition section**: a seating chart for a 10 or 25-player raid — five groups of five,
  with the buffs each group actually receives listed underneath it. **24 of the 33 raid buffs are
  party-scoped in TBC**, so totems, auras and shouts reach only the caster's group; every scope is
  read from the spell's own Wowhead tooltip. Role balance, a ranked list of what one more seat would
  buy you, missing entries naming who fixes them ("any Shaman", "an Elemental Shaman"), roster
  persistence, and a **PNG export** of the seating chart for pasting into Discord. Real icons for every
  spec and buff, **drag-and-drop** to move players between groups (occupied seats swap rather than
  overwrite), an optional player name per seat, and a hover card on each seat listing everything that
  player brings — party buffs, raid-wide buffs and debuffs — since the per-group row shows only what
  that group actually receives. **Buff exclusivity is modelled**: one Paladin holds one Greater
  Blessing and one aura, one Warrior runs one shout, so coverage reflects what a roster can actually
  maintain rather than everything its classes could theoretically cast. A fillable header (title,
  date, start time, description) is drawn onto the exported chart
- Planner split into five sub-tabs (Gear / Talents / Buffs & Consumables / Ranked Gear / Build) rather
  than one ~15-screen scroll column, with the stat rail persisting across all five
- Stat rail scoped to the spec: a Fury Warrior sees 12 rows rather than 26, with a "show all" toggle
  that restores every stat — attributes and armor are never hidden
- Talent trees for all nine classes — 579 talents across 27 trees, with real icons, per-rank
  descriptions and prerequisite gating, ingested from Wowhead's TBC talent calculator
- Real item icons on the gear paperdoll, the ranked-gear rows and the raid loot tables. Icon names are
  ingested from the same pinned wowsims commit as the item catalogue; the artwork is vendored into
  `public/icons/` (1,625 files, 2.8 MB) so the app keeps working offline and makes no runtime network
  calls. Entries with no catalogued item fall back to the two-letter slot glyph
- Computed stat weights and a per-slot upgrade finder, both scored against the live simulation
- A fixed encounter — one target, level 73, 7,700 armor — with no controls, matching what the reference TBC simulators do. The panel names it, since a DPS figure means nothing without knowing what it was measured against
- Anime.js-powered loading intro, panel entrance, equip feedback, stat update, and result reveal animations
- Reduced-motion aware animation helpers
- Playwright tests for physical, caster, healer, and tank flows
- Playwright regression coverage for expanded slot options and every class/spec's Phase 2 sample gear selection, plus a full-coverage check that every class/spec resolves to a BiS list

## Tech Stack

- React
- TypeScript
- Vite
- Anime.js
- Playwright

## Getting Started

```bash
npm install
npm run dev
```

The Vite dev server prints the local URL in your terminal. Playwright starts the app at `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

## Tests

```bash
npm run test
```

If Playwright browsers are not installed:

```bash
npx playwright install
```

On Linux or CI environments that need browser dependencies:

```bash
npx playwright install --with-deps
```

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` type-checks and builds the app.
- `npm run lint` runs ESLint.
- `npm run test` runs Playwright tests.
- `npm run test:ui` opens Playwright's UI runner.
- `npm run preview` previews the production build.

## Project Brain (Obsidian vault)

The repo root doubles as an Obsidian vault. `brain/` holds a generated, cross-linked note network that
Obsidian's graph view renders as a live map of the project:

- **Architecture/** — one note per source module with its real import and importer edges, so the graph
  of that folder *is* the dependency graph.
- **Domain/** — the TBC knowledge wiki: classes, specs, roles, races, raids, bosses, attunements,
  professions, and concept notes for the mechanics (attack table, spell coefficients, stat weights).
- **Project/** — roadmap phases, decision log, data provenance, known limitations.

```bash
npm run brain
```

Regenerate any time. The generator reads the actual source tree and the actual domain data, so the
vault cannot drift from the code — for anything it actually derives. Prose written *into* the
generator is not derived and has gone stale before, so counts and coverage figures there are
computed rather than typed. It is idempotent, it fails on a broken wikilink, and anything you
write below the `<!-- brain:manual -->` marker in a note is preserved. Start at
`brain/Project Defeat Brain.md`; see `brain/Project/Vault Guide.md` for the details.

## Known Limitations

- The physical DPS path models white damage plus **one** signature special per spec, and only when
  that special's sustained rate is defensible: a cooldown, or an energy cost against energy's fixed
  10/sec regen. Rage-costed abilities with no cooldown and Hunter's Steady Shot are excluded, because
  rage income and auto-shot weaving aren't tracked — the simulation names what it left out rather than
  guessing a rate. Multi-ability rotations have started but cover **only Fury and Arms Warrior**,
  which press Whirlwind alongside their signature button against a shared global-cooldown budget.
  Every other spec still models a single ability, so melee specs remain understated by differing
  amounts.
- Feral Druid is modelled in cat form, which in TBC swings a fixed internal weapon rather than the
  equipped one — so weapon damage and speed genuinely don't matter for Feral. What matters is Feral
  Attack Power, an explicit stat TBC prints on druid weapons, which is now modelled and adds 1:1 into
  attack power. Only **one** catalogued weapon carries a real value for it so far
  (Terestian's Stranglestaff, 829), so Feral weapon comparisons still under-differentiate against the
  rest of the catalog.
- Caster and healer estimates model one real signature ability per spec rather than a rotation — no
  cooldowns, procs, downranking, or multi-spell priority.
- No multi-iteration variance and no result charts, so every number is a point estimate.
- **Talents reach all 27 specs, but coverage is not completeness.** 579 talents are ingested across
  all nine classes, and since 2026-08-21 their machine-readable effects reach the always-visible stat
  rail, the gear rankings and the upgrade finder as well as the estimate. **A named list of talent
  groups is still refused**, each with a reason — the count is asserted from the data rather than
  written here, because the figure that used to sit in this sentence went stale the moment the ingest
  changed. Two kinds dominate: per-spell effects (Ignite, Shadow
  Weaving, Ruin, every "Improved &lt;nuke&gt;") need a spell school this simulator does not record,
  and stat-pipeline effects (Toughness, Vitality) would have to route through `calculateStats`, which
  is a deliberate open decision. **Expect a talented estimate to read low**, especially for casters.
- **Talents do not reach the always-visible stat rail.** They are applied inside the simulation only,
  so spending points changes the estimate but not the paperdoll totals, the gear rankings, or the
  upgrade finder. That is deliberate — widening it is the open product decision above — but it means
  the two surfaces disagree by design.
- The layout is fluid and reflows to phone width. It previously had a ~806px floor from fixed
  containers, a hard two-column content grid and a non-wrapping tab bar; all three are responsive now.
- Feral Druid is treated as physical DPS until bear/cat mode support is split.
- Saved builds live in this browser's local storage only. Clearing site data loses them, and they do
  not follow you to another browser or machine — use export/import for that.
- Recipe/material crafting detail exists on a handful of items as a proof of concept; most crafted items still need it filled in as each class's gear gets audited.
- Tank/healer/caster meta gems and Shoulder/Back/Leg enchants are now covered for every role that had real Phase 1/2 TBC options (casters/healers historically had no cloak or leg armor enchant this early, so those are intentionally absent rather than missing); exact values are still `needsVerification` pending final tooltip audits.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
