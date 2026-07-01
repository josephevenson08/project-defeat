# Project Defeat

Project Defeat is a local-first React + TypeScript + Vite simulator/planner for **TBC World of Warcraft Classic Anniversary**.

The project is currently an early foundation, not an accuracy-complete simulator. The goal is to build toward a typed, local-first planner that can eventually support gear, gems, enchants, talents, buffs, debuffs, consumables, rotations, encounter settings, and build comparison.

## Current Status

Early MVP / foundation phase.

## Current Features

- TBC class/spec selection for all nine TBC classes
- Faction-aware race selection
- Full TBC-style gear slot model
- Sample gear items with quality, source, phase, sockets, socket bonuses, and stats
- Sample gems and enchants
- Calculated stat totals from base stats, gear, gems, socket bonuses, and enchants
- Role-aware prototype simulation outputs:
  - Physical DPS
  - Caster DPS
  - Healer
  - Tank
- Result breakdown panel
- Anime.js-powered result animation
- Playwright tests for physical, caster, healer, and tank flows

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
- Sample gear, gems, and enchants are intentionally small starter datasets.
- Feral Druid is treated as physical DPS until bear/cat mode support is split.
- Old guide-oriented data in `src/data` is not yet migrated into the active domain model.
- No talents, buffs, debuffs, consumables, professions, rotations, or encounter settings yet.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
