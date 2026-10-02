# Gaming UI research (2024 to 2026-10-01)

What big gaming companies and the player tools people actually use are doing with their websites,
launchers and companion apps right now, and what that means for Project Defeat's design.

- **Date range:** January 2024 to 2026-10-01. Anything older is marked as background with its date.
- **Researched:** 2026-10-01 by the `gaming-ui-researcher` agent, in two sessions: 11 platforms in
  session 1, 14 more in session 2 (three parallel batches), then a merge and citation-audit step.
- **Method:** live pages opened in a browser and read by a computed-style / DOM script, plus dated
  articles, company posts, changelogs and archive captures. See [PROCESS.md](PROCESS.md).

## How to read it

1. Start with **[recommendations.md](recommendations.md)**: what to do in this app, in priority
   order, each linked to trends and sources, with a "What changed since session 1" table.
2. Check the evidence in **[trends.md](trends.md)**: patterns seen on two or more platforms, each with
   a per-platform evidence table and a status (strengthened, narrowed, weakened, retired, new).
3. Drill into **[platforms/](platforms/)** for what each site does and what was seen versus claimed.
4. **[sources.md](sources.md)** lists every source with tier, date, URL, archive link and load status,
   plus retired sources and pages that failed to load.
5. **[PROCESS.md](PROCESS.md)** has the questions, search logs for both sessions, scope decisions,
   method notes, and the citation audit.

## How to trace a claim

- **Every factual sentence** in `platforms/`, `trends.md` and `recommendations.md` ends with one or
  more source IDs in brackets, for example [B1] or [NC17]. Look the ID up in
  [sources.md](sources.md).
- **ID prefixes** name the origin: session-1 IDs use a platform letter (B Blizzard, R Riot, V Valve,
  E Epic, X Xbox, P PlayStation, U Bungie, W Wowhead, RI Raider.IO, WL Warcraft Logs, M U.GG /
  Mobalytics, A the app itself); NA, NB, NC are session-2 batches A, B, C; K1 is the merge-step
  accessibility re-probe. Recommendation numbers (R1 to R12) are unbracketed headings and are not
  source IDs.
- **Tiers** (column in `sources.md`): **Primary** = the company's own site, post, support page,
  changelog or repository, an archive capture of it, or the live page seen; **Reputable secondary** =
  established outlets, Wowhead news, or a design agency's own case study; **Weak** = fan sites, SEO
  rewrites, forums, search snippets. A Weak source is never the only support for anything in
  `trends.md` or `recommendations.md`; where it is the only support in a platform note, the claim is
  marked *unverified*.
- **Labels:** **seen** = observed on the live page on 2026-10-01 (session 1 at 1280 px with
  screenshots; session 2 at 1024 px by computed style only, no screenshots); **reported** = a dated
  source says so; *unverified* = could not be confirmed and is not used as evidence on its own.

## Platform notes (25)

| File | Covers | Type | Session |
|---|---|---|---|
| [platforms/blizzard.md](platforms/blizzard.md) | Battle.net app, blizzard.com, WoW, Diablo IV, Overwatch sites, WoW Armory | Publisher | 1 |
| [platforms/riot.md](platforms/riot.md) | Riot Client, League of Legends and VALORANT sites | Publisher | 1 |
| [platforms/valve-steam.md](platforms/valve-steam.md) | Steam store and client | Store | 1 |
| [platforms/epic-games.md](platforms/epic-games.md) | Epic Games Store and Launcher V2 | Store | 1 |
| [platforms/xbox.md](platforms/xbox.md) | xbox.com and the Xbox PC app | Platform holder | 1 |
| [platforms/playstation.md](platforms/playstation.md) | playstation.com and the PS Store | Platform holder | 1 |
| [platforms/bungie.md](platforms/bungie.md) | Bungie.net / Destiny, Marathon | Publisher | 1 |
| [platforms/wowhead.md](platforms/wowhead.md) | Wowhead | Player tool | 1 |
| [platforms/raider-io.md](platforms/raider-io.md) | Raider.IO | Player tool | 1 |
| [platforms/warcraft-logs.md](platforms/warcraft-logs.md) | Warcraft Logs / Archon (site blocked by bot check) | Player tool | 1 |
| [platforms/ugg-mobalytics.md](platforms/ugg-mobalytics.md) | U.GG and Mobalytics | Player tool | 1 |
| [platforms/nintendo.md](platforms/nintendo.md) | nintendo.com, Nintendo Store, companion apps | Platform holder | 2A |
| [platforms/ubisoft.md](platforms/ubisoft.md) | ubisoft.com, AC Shadows page, Ubisoft Connect | Publisher | 2A |
| [platforms/ea.md](platforms/ea.md) | ea.com, Battlefield 6 page, EA app | Publisher | 2A |
| [platforms/square-enix-ffxiv.md](platforms/square-enix-ffxiv.md) | FFXIV promotional site and The Lodestone | Publisher | 2A |
| [platforms/gog.md](platforms/gog.md) | gog.com and GOG GALAXY | Store | 2A |
| [platforms/hoyoverse.md](platforms/hoyoverse.md) | Genshin and Star Rail sites, HoYoLAB, HoYoPlay | Publisher | 2B |
| [platforms/grinding-gear-games.md](platforms/grinding-gear-games.md) | Path of Exile 2 site | Publisher | 2B |
| [platforms/amazon-games.md](platforms/amazon-games.md) | New World and Throne and Liberty sites | Publisher | 2B |
| [platforms/curseforge.md](platforms/curseforge.md) | CurseForge WoW pages | Player tool | 2B |
| [platforms/tracker-gg.md](platforms/tracker-gg.md) | Tracker.gg | Player tool | 2B |
| [platforms/wowsims.md](platforms/wowsims.md) | WoWSims TBC simulator (old and new) | Player tool (closest competitor) | 2C |
| [platforms/maxroll.md](platforms/maxroll.md) | Maxroll D4 planner and planner-backed guide | Player tool | 2C |
| [platforms/icy-veins.md](platforms/icy-veins.md) | Icy Veins TBC Classic hub and BiS guide | Player tool | 2C |
| [platforms/blitz.md](platforms/blitz.md) | Blitz.gg League build page | Player tool | 2C |

## Headline findings

- **Provenance next to the data is the strongest trend** (T5, 16 platforms), now joined by freshness
  stamps and public changelogs (T13). The tools closest to this app print phase and data age in the
  heading, yet on the same day Icy Veins and WoWSims pointed at different TBC phases without saying
  which is live.
- **Named presets switchable in place** (T14: WoWSims phase gear sets, Maxroll set switcher, Icy Veins
  phase tabs) are the most direct borrow for the planner's empty Gear state.
- **The game / version picker comes first** on 15 platforms, on tools also as a filter (T2).
- **Site type decides the look** (T7, T8, T9 narrowed): franchise sites go square with a display face
  and stay dark; hubs and stores round off; tools are dark (11 of 12) and increasingly use one neutral
  sans (T18). Project Defeat's square, Cinzel-headed, dark look matches the franchise side and still
  sits comfortably among tools.
- **Corrections from session 1:** Blizzard's sites do ship skip links (inside shadow DOM), and "player
  tools all dark / marketing going light" is now only half true.

## Limits

- **No desktop launchers installed** (Battle.net, Riot Client, Epic, Xbox app, EA app, Ubisoft
  Connect, GOG GALAXY, HoYoPlay, CurseForge app); notes on them come from posts and articles.
- **Blocked or empty:** Warcraft Logs and archon.gg (human verification, not bypassed), Bungie.net
  (empty shell), HoYoverse's official HoYoPlay news (empty shell).
- **Two measurement setups:** 1280 px with screenshots (session 1) versus 1024 px with no screenshots
  (session 2). Width-dependent numbers are not comparable, and session-2 "seen" claims are computed
  styles, not looks.
- **Probe blind spots:** cross-origin stylesheets are unreadable, so reduced-motion counts are floors;
  skip controls built as buttons or inside shadow DOM can be missed (corrected for session-1 sites
  only).
- **Search tool limits:** several reputable outlets (The Verge, Eurogamer, IGN, Polygon, Ars Technica,
  RPS, GamesIndustry.biz) could not be searched, which is why some claims stay *unverified*.
- **Undated changes:** several 2025-2026 rebuilds were never announced and are dated only from archive
  captures (T19).
