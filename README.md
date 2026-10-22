# Project Defeat

A gear / talent / raid comp planner for **World of Warcraft: The Burning Crusade Classic (Anniversary), Phase 2**.

**[Open the live app →](https://josephevenson08.github.io/project-defeat/)**

[![Deploy](https://github.com/josephevenson08/project-defeat/actions/workflows/deploy.yml/badge.svg)](https://github.com/josephevenson08/project-defeat/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Project Defeat home screen](docs/images/home.jpg)

## What it does

- **Character planner.** Pick a faction, race, class and spec, then fill every slot from real Phase 2 best-in-slot rankings, including gems and enchants. You see your stats update as you go.
- **Gear comparison and upgrades.** Compare two items inside the set you're actually wearing, or rank every legal upgrade for a slot.
- **Talents.** Talent trees for all nine classes, with real icons and rank descriptions.
- **DPS simulation.** An estimated DPS for the 20 damage specs against a fixed raid boss. Rotations are still being worked on (see [known limitations](docs/known-limitations.md)).
- **Raid composition.** Seat a 10 or 25-player raid and see which buffs each group actually gets. You can export the seating chart as an image for Discord.
- **Raids.** Loot tables for every Phase 1 and 2 raid, plus the steps to get attuned.
- **Professions.** The game's profession window: set your skill and every recipe on the path to 375 takes its colour, with trainer stops, reagents and each gathering range's loop on its TBC zone map; "Which two" ranks every profession by what it makes for your spec.
- **Import from the game.** A small addon exports your character, so you can open the planner already wearing your gear.
- **Share a build as a link.** Nothing is uploaded; the whole build rides in the URL.

![The character planner with a full set of gear equipped](docs/images/planner.jpg)

## Using it

Everything runs in your browser. There are no accounts and no server.

1. Open the [live app](https://josephevenson08.github.io/project-defeat/) and choose **Character Planner**.
2. Create your character, or press **Import your character from the game** if you use the addon.
3. Press **Equip the recommended set** to start from the BiS list, then swap pieces from there.

To export your character from the game, see [`addon/README.md`](addon/README.md).

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Playwright test suite (run `npx playwright install` first) |
| `npm run brain` | Regenerate the Obsidian project notes in `brain/` |
| `npm run changelog` | Regenerate the daily dev log |

**Built with** React, TypeScript, Vite, Anime.js and Playwright. It deploys to GitHub Pages on every push to `main`.

## Project layout

```
src/          the app (domain data and rules, features, components)
tests/        Playwright tests
tools/        scripts that fetch and prepare game data
public/       icons, maps, raid art and fonts the app ships
addon/        the in-game export addon
discord-bot/  plan for a Discord bot (not built yet)
docs/         everything else: features, roadmap, design notes, research, dev log
brain/        generated Obsidian notes that map the codebase
```

## Docs

- [Full feature list](docs/features.md)
- [Roadmap](docs/ROADMAP.md)
- [Known limitations](docs/known-limitations.md)
- [All docs](docs/README.md): architecture, design scopes, a usability study, and the dev log

## Coming next: a Discord bot

A bot that answers questions/requests in Discord from the same data as the app: `/bis fury warrior` for a
spec's BiS list, `/whodrops`, `/loot karazhan`, `/attune`, `/farm fel iron`, and `/import` to list
upgrades from your in-game export. It will run on a Raspberry Pi. See the
[plan](discord-bot/PLAN.md).

## The redesign: being brought into the app

Research into how 25 gaming companies and player tools design their sites in 2024–2026
([findings](docs/research/gaming-ui/README.md)) led to clickable [design prototypes](docs/design/prototypes/README.md)
of every tab, walked through with the owner one tab at a time, three designs per step. Their animation is tuned to
TBC by [this research](docs/research/wow-tbc-motion/README.md). **Try them:** the
[prototype gallery](https://josephevenson08.github.io/project-defeat/prototypes/) is published beside the app.

**Every tab's design is decided** (2026-10-12), and the decided designs are now going into the live app, following
the [port plan](docs/design/PORT-PLAN.md):

| Step | What | State |
| --- | --- | --- |
| 0 | **The look:** dark glass panels, Marcellus and Figtree, a colour and a still backdrop per tab, the phase on every screen | Done, 2026-10-12 |
| 1 | **Spec Tier Lists:** a board of spec icons from Wowhead's three lists, a card for any spec, and a switch to Wowhead's tiers against what players actually parse (archon.gg) | Done, 2026-10-12 |
| 2 | **Raids:** a boss journal with your spec's picks, who in your raid wants each drop, and a search across all five raids | Done, 2026-10-13 |
| 3 | **Professions:** the game's profession window, and which two to take | Done (2026-10-17): recipes coloured at your skill, trainer stops, reagents, each range's loop on its TBC map; "Which two" with your character's two professions. The node refresh of the [maps rework](docs/design/MAPS-PLAN.md) waits for Wowhead to answer scripted requests again |
| 4 | **Simulation:** what to do next (your stat priority, your best upgrades with Equip, then the estimate) with the damage sources and how far to trust the number | Done, 2026-10-17 |
| 5 | **Raid Composition:** the planning table with a click-to-fill palette, Undo and the example roster, then what one more seat would add and who fixes what is missing | Done, 2026-10-17 |
| 6 | **The Character Planner**, one sub-tab at a time: **Build** (the share card, and a read-first report on the paste box) and **Ranked Gear** (Wowhead's order slot by slot as game tooltips, and where each item drops) done 2026-10-18; **Compare** (your item's tooltip beside another's, with the trade in one sentence), **Buffs** (filled in from your raid and your seat in it, with icons) and **Gear** (the game's character sheet with the hit cap in plain words for every spec, and "What's left" with one-press fixes) done 2026-10-19; Talents to come | In progress |
| 7 | The 3D crystal-and-water scene, as an optional layer | Last |

**To pick the work back up,** read the top of [`docs/dev-log/HANDOFF.md`](docs/dev-log/HANDOFF.md).

The app stays on Phase 2 on purpose, even though Phase 3 is live.

## Status

A working planner, focused on Phase 2 and on DPS specs. Healer and tank math still runs but isn't the focus. Every dataset comes from a pinned source, and wherever the app can't model something, it says so on screen. This is my biggest project so far and it's still growing.

## License

[MIT](LICENSE). World of Warcraft and its artwork are trademarks of Blizzard Entertainment. This is a fan-made tool and is not affiliated with or endorsed by Blizzard.
