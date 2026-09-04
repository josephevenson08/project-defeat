# Project Defeat

Project Defeat is a local-first React + TypeScript + Vite simulator/planner for **TBC World of Warcraft Classic Anniversary**.

It is a working planner rather than an accuracy-complete simulator: gear, gems, enchants, talents,
buffs, debuffs, consumables and raid composition are all real and sourced, while rotations remain the
largest modelling gap. I'm in the process of implementing a simulation rule later on into this planner,
at the moment it is not my top priority with this project. I'm specifically focusing on phase 2 of The
Burning Crusade World of Warcraft expansion this go around in 2026. Once I have a working model and have
it fully implemented, it will be able to be used for phase 2 and beyond. This is my biggest project yet
because there are a lot of things I want to do with it, so please be patient with me. Every dataset is 
traceable to a pinned source, and anything the app cannot model says so on the surface that would otherwise 
imply it had.

**Live: https://josephevenson08.github.io/project-defeat/**

## Current Status

Working planner, targeting **TBC Phase 2** (SSC/Tempest Keep, Tier 5) and only Phase 2. The gear
catalogue, BiS rankings, talents, buffs, raids and professions are all real and sourced.

**This project is for DPS.** Healer and tank maths still exist, still run and are still tested, but
neither is somewhere effort is spent and neither is put on screen as a headline. The Simulation tab
is shown for the **20 DPS specs** and hidden for the 5 Healer and 2 Tank ones — see
`src/featureFlags.ts`, which states exactly what is and is not modelled, and carries an assertion
behind every claim of its that quotes a number.

## Current Features

- TBC class/spec selection for all nine TBC classes
- Faction-aware race selection with real TBC race/class legality (e.g. Human can't be a Shaman, Blood Elf can't be a Warrior)
- Full TBC-style gear slot model
- **Phase 2 and only Phase 2.** 
- Source/farming metadata fields for gear, including instance, boss, vendor, reputation, crafting profession, and notes
- Crafted items can show full recipe detail: required profession skill level, specialization, where the recipe/pattern is obtained, and each material's own farm/source location
- Spec-aware starter filtering for gear, relics, and enchants across every class (legal weapon types per class, dual-wield vs. single-weapon rules, class-appropriate relic type)
- Spec-aware gear slot visibility for every class, including the Totem/Libram/Idol relic display for Shaman/Paladin/Druid and the hidden Ranged-vs-Relic slot swap
- 212 gems and 91 enchants, ingested and validated, with per-spec gem and enchant recommendations from Wowhead
- Calculated stat totals from base stats, gear, gems, socket bonuses, and enchants
- Role-aware prototype simulation outputs:
  - DPS (separation between melee, ranged and caster)
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
  Blessing and one aura, one Shaman drops one air totem, one Warrior runs one shout, so coverage
  reflects what a roster can actually maintain rather than everything its classes could theoretically
  cast. **The raid leader overrides any of it per seat** — every exclusive group a seat competes in
  gets its own picker, so a Paladin can be told which Blessing *and* which aura to bring, and a
  Shaman which totem to drop. Left alone, each group falls back to its priority order, so these are
  overrides rather than a form to fill in. A fillable header (title,
  date, start time, description) is drawn onto the exported chart
- Planner split into five sub-tabs (Gear / Talents / Buffs & Consumables / Ranked Gear / Build) rather
  than one ~15-screen scroll column, with the stat rail persisting across all five
- Stat rail scoped to the spec: a Fury Warrior sees 12 rows rather than 26, with a "show all" toggle
  that restores every stat — attributes and armor are never hidden
- Talent trees for all nine classes — 579 talents across 27 trees, with real icons, per-rank
  descriptions and prerequisite gating, ingested from Wowhead's TBC talent calculator
- Real item icons on the gear paperdoll, the ranked-gear rows and the raid loot tables. Icon names are
  ingested from the same pinned wowsims commit as the item catalogue; the artwork is vendored into
  `public/icons/` (1,713 files, 3.0 MB) so the app keeps working offline and makes no runtime network
  calls. Entries with no catalogued item fall back to the two-letter slot glyph
- **A page per profession, laid out the way a levelling guide reads** — pick from a grid of thirteen,
  and each one opens on its own progression: a skill range, what you gather or craft in it, and the
  trainer visit that gates the next one. There is no skill-tier table; training requirements are
  markers placed at the skill where the bar stops moving
- **Crafting paths that are computed rather than copied** — 2,079 TBC recipes ingested for their
  reagents and their orange/yellow/green/grey breakpoints, from which all nine crafting professions
  get a path from their first recipe to 375: what to make, how many, and the shopping list. The craft
  counts are derived from the skill-up curve, not taken from anyone's guide, and the page prints the
  model it used
- **Farming route maps for Herbalism and Mining** — 45 gathering nodes and 14,091 real spawn
  coordinates from Wowhead, covering the whole 1-375 climb. A skill range gets one map per zone,
  merging every material farmed in that range, because that is how a range is farmed — at 1-100 you
  are picking Peacebloom, Silverleaf and Earthroot on the same lap. Zones are tabs rather than stacked
  maps. Every recorded spawn is plotted over the zone's own map art, which registers with no transform
  because coordinates are percentages of the zone's extent and that is exactly the space the art
  covers. The circuit is computed here rather than copied from anyone's guide — density, snapped onto
  nodes that actually exist, then 2-opt to uncross it — and the caption says it is a strong starting
  line rather than a proven optimum. Zone maps are Blizzard artwork used under the Game Content Usage
  Rules, credited on every map; the one zone with no art on file falls back to a bare density grid.
  The other eleven professions carry tiers, trainer levels, and either farm spots or recipe paths —
  only two professions have world nodes to draw
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

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
