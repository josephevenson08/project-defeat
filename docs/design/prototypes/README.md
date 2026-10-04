# Design prototypes

Clickable HTML mockups of what Project Defeat could look like. **None of this is the live app.** Each
file is a self-contained static page you can open directly in a browser. [`index.html`](index.html)
is a gallery of all of them with live thumbnails.

All prototypes show the same thing with real data: a Human Fury Warrior (Alliance, Phase 2) in the
Phase 2 set, with real items, enchants and sources. The shared brief, with the data and rules, is
[`BRIEF.md`](BRIEF.md). The directions come from the
[gaming UI research](../../research/gaming-ui/README.md) into 25 platforms, and the
[UI refresh plan](../UI-REFRESH-PLAN.md) is what would actually be built.

## Round 1: ten directions (2026-10-03)

| # | Direction | After | Research |
| --- | --- | --- | --- |
| 01 | [Refined Current](01-refined-current.html) | The current app, with the UI plan applied | R1–R5 |
| 02 | [Sim Console](02-sim-console.html) | WoWSims, Raider.IO | T5 T15 T16 T18 |
| 03 | [Field Guide](03-field-guide.html) | Icy Veins, Maxroll | T13 T14 T5 T16 |
| 04 | [Data Strip](04-data-strip.html) | U.GG, Blitz, Tracker.gg | T5 T6 T15 |
| 05 | [Launcher](05-launcher.html) | Battle.net, Riot Client, GOG GALAXY | T1 T2 T4 T10 |
| 06 | [Search First](06-search-first.html) | Raider.IO, Tracker.gg, Wowhead | T3 T2 R1 |
| 07 | [Paperdoll](07-paperdoll.html) | The in-game character pane, Path of Exile 2 | T7 T8 T15 R3 |
| 08 | [Portal](08-portal.html) | FFXIV Lodestone, Wowhead, CurseForge | T2 T5 T13 |
| 09 | [Pocket](09-pocket.html) | Xbox app, Nintendo, HoYoLAB | T10 T2 T5 |
| 10 | [Command Deck](10-command-deck.html) | GOG GALAXY, Raider.IO, Warcraft Logs | T3 T5 T13 R1 |

**The owner's pick: 05 Launcher and 08 Portal.**

## Round 2: Launcher and Portal in six styles (2026-10-03)

Minimalism, Skeuomorphism, Glassmorphism, Neo-Brutalism, Bauhaus and Motion, for each of the two picked
directions: 12 variants. Full write-up, including the libraries used, in
[`variants/README.md`](variants/README.md).

## Round 3: immersive 3D, motion, and neumorphism (2026-10-03)

Three styles pushed as far as they go, each built on the Launcher, on the Portal, and as a Hybrid of
the two: 9 concepts. They use live WebGL (Three.js) and GSAP-driven motion. Full write-up, including
libraries, fallbacks and checks, in [`round3/README.md`](round3/README.md).

## Round 4: the chosen direction (2026-10-03)

3D · Portal's layout and scene with Motion · Portal's motion, aimed at the planner's Phase 2 job.
The Hybrid designs from round 3 were dropped. See [`round4/README.md`](round4/README.md).

## Tab by tab

**Step 1 is done:** a baseline of all seven tabs in the round-4 style, linked together as one
clickable site, on the app's real data. See [`tabs/README.md`](tabs/README.md). **Step 2** walks
through them one at a time, three designs per step. The owner's review and the plan for the next
session are in [`tabs/NEXT-SESSION-PLAN.md`](tabs/NEXT-SESSION-PLAN.md).

## Caveats

- **Some numbers are invented.** DPS figures, stat weights and comparison deltas are labelled
  "example" wherever they appear, mainly in 02 and 04. A few talent and buff details go beyond the
  brief's data.
- **Checking was partly automated.** Every page was checked at 400px and 1280px for sideways
  scrolling, script errors and outside requests, and reviewed from screenshots. Not every control
  was clicked by hand, and contrast was estimated, not measured.
- **Icons and art are placeholders.** Slot initials and CSS/SVG shapes stand in for item icons, and
  no Blizzard art is used.

## How they were made

1. Each prototype was built by one designer agent, working from the shared brief and the research.
2. In round 1, all ten first attempts stalled: most likely too many large single-file writes at once, plus a shared browser pane. Two of the ten had already written complete files before stalling. The other eight were re-run in waves of four, with no browser and each file written in pieces.
3. Round 2 used the same approach from the start.
4. Every page then went through the automated checks above. Problems found were fixed: sideways scroll in 01, 10 and 08-D, and a squeezed phone nav in 08-D.
