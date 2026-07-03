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

## Known Limitations

- Simulation formulas are placeholders and are not yet TBC-accurate.
- Gear, gems, and enchants are still starter datasets, not a complete audited TBC database.
- Every class/spec has a guide-shaped Phase 2 starter ranking, but final Wowhead/Icy Veins/WoWSims reconciliation is still pending (items are flagged `needsVerification` where stats are approximate).
- Feral Druid is treated as physical DPS until bear/cat mode support is split.
- Old guide-oriented data in `src/data` is not yet migrated into the active domain model.
- No talents, buffs, debuffs, consumables, professions, rotations, or encounter settings yet.
- Recipe/material crafting detail exists on a handful of items as a proof of concept; most crafted items still need it filled in as each class's gear gets audited.
- Tank/healer/caster meta gems and Shoulder/Back/Leg enchants are now covered for every role that had real Phase 1/2 TBC options (casters/healers historically had no cloak or leg armor enchant this early, so those are intentionally absent rather than missing); exact values are still `needsVerification` pending final tooltip audits.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
