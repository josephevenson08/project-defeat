# Project Defeat

Project Defeat is a local-first React + TypeScript + Vite simulator/planner for **TBC World of Warcraft Classic Anniversary**.

The project is currently an early foundation, not an accuracy-complete simulator. The goal is to build toward a typed, local-first planner that can eventually support gear, gems, enchants, talents, buffs, debuffs, consumables, rotations, encounter settings, and build comparison.

## Current Status

Early MVP / foundation phase.

## Current Features

- TBC class/spec selection for all nine TBC classes
- Faction-aware race selection with real TBC race/class legality (e.g. Human can't be a Shaman, Blood Elf can't be a Warrior)
- Full TBC-style gear slot model
- Expanded starter gear items for every slot with quality, source, phase, sockets, socket bonuses, stats, and WoW item IDs where currently confident
- Source/farming metadata fields for gear, including instance, boss, vendor, reputation, crafting profession, and notes
- Crafted items can show full recipe detail: required profession skill level, specialization, where the recipe/pattern is obtained, and each material's own farm/source location
- Phase 1/2 starter ranked/BiS data for all nine TBC classes and every spec (27 specs total: Shaman, Warrior, Paladin, Priest, Druid, Hunter, Mage, Rogue, Warlock)
- Spec-aware starter filtering for gear, relics, and enchants across every class (legal weapon types per class, dual-wield vs. single-weapon rules, class-appropriate relic type)
- Spec-aware gear slot visibility for every class, including the Totem/Libram/Idol relic display for Shaman/Paladin/Druid and the hidden Ranged-vs-Relic slot swap
- Sample gems and enchants
- Calculated stat totals from base stats, gear, gems, socket bonuses, and enchants
- Role-aware prototype simulation outputs:
  - Physical DPS
  - Caster DPS
  - Healer
  - Tank
- Result breakdown panel
- Raids tab: all five Phase 1/2 raids boss by boss, with per-role callouts, notable drops colour-coded
  by item quality where the drop exists in the catalog, and step-by-step attunement chains for
  Serpentshrine Cavern and Tempest Keep
- Spec Tier Lists section: Wowhead's Phase 2 DPS, healer and tank rankings, 28 placements covering all
  27 specs, with the current character's spec marked on every list it appears on. Tier letters and
  membership only — Wowhead's analysis prose is not reproduced, and each list links back to its page.
  These rank *specs*, not items, so they deliberately do not feed the per-slot BiS rankings
- Planner split into four sub-tabs (Gear / Talents / Ranked Gear / Build) rather than one ~15-screen
  scroll column, with the stat rail persisting across all four
- Stat rail scoped to the spec: a Fury Warrior sees 12 rows rather than 26, with a "show all" toggle
  that restores every stat — attributes and armor are never hidden
- Talent trees for all nine classes — 579 talents across 27 trees, with real icons, per-rank
  descriptions and prerequisite gating, ingested from Wowhead's TBC talent calculator
- Real item icons on the gear paperdoll, the ranked-gear rows and the raid loot tables. Icon names are
  ingested from the same pinned wowsims commit as the item catalogue; the artwork is vendored into
  `public/icons/` (1,238 files, 2.1 MB) so the app keeps working offline and makes no runtime network
  calls. Entries with no catalogued item fall back to the two-letter slot glyph
- Computed stat weights and a per-slot upgrade finder, both scored against the live simulation
- Configurable encounter settings (target level, armor)
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
- Gear, gems, and enchants are still starter datasets, not a complete audited TBC database. A few
  items now carry real Wowhead tooltip values (Fang of the Leviathan, Vambraces of Ending, Talon of
  the Phoenix) while most carry stat-budget estimates, and the real ones are numerically much
  stronger — Fang of the Leviathan alone has 221 spell power against ~46 on the placeholder caster
  weapons. Any comparison involving a sourced item against an estimated one is skewed in the sourced
  item's favour until the rest of the catalog is audited the same way. 106 of 230 items are now
  sourced against real tooltips,
  so this is the common case rather than a corner one — the Upgrade Finder now marks every row whose
  delta rests on estimated data, and marks the sourced-versus-estimated rows specifically, since those
  read high in a predictable direction.
- Every class/spec has a guide-shaped Phase 2 starter ranking, but final Wowhead/Icy Veins/WoWSims
  reconciliation is still pending, and nearly every item still flagged appears in a BiS list — so the
  recommendations lean heavily on stat-budget estimates rather than confirmed tooltips. See the
  generated `brain/Project/Roadmap Board.md` for the current counts; it computes them, and every
  hand-written copy in prose has gone stale within a batch or two.
- **The BiS lists are one item deep.** 463 ranked entries exist across all 27 specs and only 2 sit at
  rank 2 or lower, so almost every slot offers a single option while the panel labels it "1 ranked".
  That presents one guess as a considered ranking, and it is the largest gap in the planner right
  now — larger than the verification backlog.
- Feral Druid is treated as physical DPS until bear/cat mode support is split.
- Old guide-oriented data in `src/data` is not yet migrated into the active domain model.
- No talent trees, so no talent scaling anywhere in the simulation.
- Saved builds live in this browser's local storage only. Clearing site data loses them, and they do
  not follow you to another browser or machine — use export/import for that.
- Recipe/material crafting detail exists on a handful of items as a proof of concept; most crafted items still need it filled in as each class's gear gets audited.
- Tank/healer/caster meta gems and Shoulder/Back/Leg enchants are now covered for every role that had real Phase 1/2 TBC options (casters/healers historically had no cloak or leg armor enchant this early, so those are intentionally absent rather than missing); exact values are still `needsVerification` pending final tooltip audits.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
