# Project Defeat

Project Defeat is a local React + TypeScript + Vite simulator and planning prototype inspired by MMO combat simulator interfaces.

## Current Status

Early local MVP. The simulator math is intentionally simple and deterministic so the app has a clean foundation before real World of Warcraft / TBC formulas, item data, talents, buffs, and rotations are added.

## Features

- Character class, specialization, and race selection
- Placeholder gear slots with selectable prototype items
- Calculated stat panel combining class base stats and equipped gear
- Basic estimated DPS simulation result
- Anime.js-powered result animation
- Playwright coverage for the main local simulation flow
- Dark simulator-style layout built with plain CSS

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

The local Vite app runs at the URL Vite prints in your terminal. Playwright starts it on `http://127.0.0.1:5173`.

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

## Roadmap

- Improve stat formulas
- Add real item data
- Add talent support
- Add buff, debuff, and consume selection
- Add rotation configuration
- Add simulation iterations and result variance
- Add charts and result breakdowns
- Add save/load build support
- Add import/export support
- Improve visual similarity to the simulator reference image
- Perform a deeper accessibility pass
