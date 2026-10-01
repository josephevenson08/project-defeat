# Gaming UI research (2024 to 2026-10-01)

What big gaming companies and the player tools people actually use are doing with their websites,
launchers and companion apps right now, and what that means for Project Defeat's design.

- **Date range:** January 2024 to 2026-10-01. Anything older is marked as background with its date.
- **Researched:** 2026-10-01 by the `gaming-ui-researcher` agent.
- **Method:** live pages opened in a browser (computed styles and DOM read by script, plus
  screenshots), plus dated articles and announcements. See `PROCESS.md`.

## How to read it

1. Start with **[recommendations.md](recommendations.md)**: what to do in this app, in priority
   order, each linked to a trend.
2. Check the evidence in **[trends.md](trends.md)**: patterns seen on two or more platforms.
3. Drill into **[platforms/](platforms/)** for what each site does and what was seen versus claimed.
4. **[sources.md](sources.md)** lists every source with its date, and every page that failed to load.
5. **[PROCESS.md](PROCESS.md)** has the questions, the search log, scope decisions and the recheck.

Conventions: **seen** = observed on the live page on 2026-10-01; **reported** = a dated source says
so; *unverified* = could not be confirmed. Bracketed IDs such as [B1] point to `sources.md`.

## Platform notes

| File | Covers |
|---|---|
| [platforms/blizzard.md](platforms/blizzard.md) | Battle.net app, blizzard.com, WoW, Diablo IV, Overwatch sites, WoW Armory |
| [platforms/riot.md](platforms/riot.md) | Riot Client, League of Legends and VALORANT sites |
| [platforms/valve-steam.md](platforms/valve-steam.md) | Steam store and client |
| [platforms/epic-games.md](platforms/epic-games.md) | Epic Games Store and Launcher V2 |
| [platforms/xbox.md](platforms/xbox.md) | xbox.com and the Xbox PC app |
| [platforms/playstation.md](platforms/playstation.md) | playstation.com and the PS Store |
| [platforms/bungie.md](platforms/bungie.md) | Bungie.net / Destiny, Marathon |
| [platforms/wowhead.md](platforms/wowhead.md) | Wowhead |
| [platforms/raider-io.md](platforms/raider-io.md) | Raider.IO |
| [platforms/warcraft-logs.md](platforms/warcraft-logs.md) | Warcraft Logs / Archon (site blocked by bot check) |
| [platforms/ugg-mobalytics.md](platforms/ugg-mobalytics.md) | U.GG and Mobalytics |

## Headline findings

- Publishers run one component system and re-skin it per game with tokens (T1).
- The game/version picker is now the first thing on the page for WoW-adjacent sites (T2).
- Search has become primary navigation, with suggestions and Ctrl K (T3).
- Data tools print patch, source, date and sample size next to every number (T5).
- In-world game sites keep square, single-color buttons and engraved or condensed display type;
  rounded pills belong to neutral store shells (T7, T8). Player tools all stay dark (T9).

## Limits

Desktop launchers (Battle.net, Riot Client, Epic, Xbox app) were not installed; notes on them come
from articles. Warcraft Logs and archon.gg were behind a human-verification page and were not
inspected. Bungie.net rendered as an empty shell. Several articles returned 403 or loaded only site
chrome; those are listed in `sources.md` and not used as evidence.
