# Process log: gaming UI research (2024 to 2026-10-01)

Researcher: `gaming-ui-researcher` agent. Started 2026-10-01.

## Questions this research answers

1. How have the big gaming companies changed their launchers, stores and game sites since January 2024?
   What did they redesign, and what reasons did they give?
2. Which layout, navigation, typography, color/theming, motion and data-density techniques show up on
   **several** platforms (trends), as opposed to one (observations)?
3. How do player tools that do the same jobs as Project Defeat (gear lookup, rankings, logs, builds)
   present dense data today: tooltips, tables, search, filters, mobile?
4. What do these platforms do for accessibility (contrast, reduced motion, keyboard, text size)?
5. Given what Project Defeat already is (framed, faction-themed TBC planner; Cinzel + Barlow Semi
   Condensed; bevelled panels; Discord-style rail + main pane), what should it keep, borrow or change?

## Platforms

Companies:
- Blizzard: Battle.net app, worldofwarcraft.blizzard.com, diablo4.blizzard.com, overwatch.blizzard.com
- Riot: Riot Client, leagueoflegends.com, playvalorant.com
- Valve: Steam client and store (2023-2025 redesigns)
- Epic Games: Epic Games Launcher / Store
- Microsoft: Xbox app (PC) and xbox.com
- Sony: PlayStation app / playstation.com / PS Store
- Bungie: destinythegame.com, Bungie.net, Marathon site

Player tools:
- Wowhead
- Raider.IO
- Warcraft Logs
- Mobalytics and/or Blitz / U.GG

Others only if clearly relevant (decided during research; logged below).

## The app as it stands (read before recommending)

Read on 2026-10-01: `src/styles/global.css` (about 7,500 lines), `src/styles/fonts.css`,
`src/components/layout/*` and `src/components/ui/*`. Key facts used in recommendations:
- Tokens on `:root`, re-skinned per faction with `[data-faction='horde']` (surfaces, metal, accent).
- Fonts self-hosted: Cinzel (variable, display) and Barlow Semi Condensed 400/500/600 (UI).
- `--radius: 2px`, metal-edge brackets/bevels, near-monochrome policy so item-quality colors read first.
- AppShell: persistent left rail (stats) + main pane with a top TabNav; skip link; focus-visible rings.
- SectionPicker front door with five section cards and a CSS-drawn faction backdrop.
- `prefers-reduced-motion` handled globally; tabular numbers used for stats.
- One `type="search"` filter (gear slot pane); no global search or command palette.

## Research log

(entries appended in order as the work happens)

### 2026-10-01, session 1

**Scope decision (tools).** WebFetch converts pages to text and cannot report fonts, colors or radii,
and several sites are client-rendered. So, in addition to WebSearch/WebFetch, I opened the live
sites in the Claude browser pane and read computed styles with a small script (fonts actually loaded,
heading/button styles, custom elements, presence of `prefers-reduced-motion` rules and skip links),
plus a screenshot (viewport 1280 x 720 CSS px; see recheck). This is a deviation from the agent's listed tools, made so
that "saw" claims are real observations. Limits of that probe: it cannot read cross-origin
stylesheets or shadow DOM, so "no reduced-motion rule found" is always recorded as *unverified*, not
as absent.

**Blizzard.**
- Search "Battle.net app redesign 2025 new interface": results were the 2019 beta and the January
  2021 rollout. Search summaries labelled them 2025; the dated articles (Engadget 2021-01-15) do not.
  Decision: Battle.net app recorded as "no 2024+ redesign found", 2021 work kept as background only.
- Fetched Blizzard news beta article: loaded, but no date in the text. Fetched Engadget: loaded, dated.
- Search for a WoW website redesign: nothing dated 2024+ found.
- Browser: worldofwarcraft.blizzard.com, overwatch.blizzard.com, diablo4.blizzard.com, blizzard.com
  all loaded and populated. All use `blz-*` custom elements. Global nav is shadow DOM; links not
  readable.
- Search "Blizzard web components design system blz-": no public documentation found. A Medium case
  study on an internal ABK design system ("Mosaic") turned up but is about internal tools; not used.
- Search on Overwatch rename: several dated reports (Feb 2026).

**Riot.**
- Search "Riot Client redesign 2025": found the April 2026 Riot-Client-first launch test (spilled.gg,
  loaded, dated 2026-04-11) and "League Next" (Dec 2025).
- sheepesports (403), GameSpot League Next summary (403), Medium Riot UX "7 lessons" (403): failed.
  Hitmarker loaded but had no date; not cited for dates.
- Browser: leagueoflegends.com and playvalorant.com loaded; both Next.js; computed styles read.

**Valve.**
- Search on Steam client/Big Picture: PCGamesN 2026-09-10 (loaded). The 2023 overlay/notes update
  appeared in several results; recorded as background (pre-2024).
- Search on store redesign: GamingOnLinux 2025-07-26 (menu/search, loaded), GamingOnLinux 2025-11-07
  and HotHardware 2025-11-11 (wider pages, loaded). TechRaptor and Neowin returned 403.
- Browser: store.steampowered.com loaded; single top menu with search confirmed.

**Epic.**
- PC Gamer and both Tom's Hardware articles loaded only navigation chrome (content truncated);
  Neowin, Guru3D and unrealengine.com State of Unreal recap returned 403. Tbreak (2026-06-19) loaded
  and is the main source. Claims about removing the Unreal runtime and "$400M" came only from search
  snippets: marked *unverified*.
- Browser: store.epicgames.com loaded; desktop launcher not installed.

**Xbox.**
- Search on Xbox PC app 2025: Xbox Wire 2025-06-23 and 2025-09-29 loaded (primary sources).
  VideoCardz "unified Xbox UI direction" returned 402; its claim is marked *unverified*.
- Browser: xbox.com loaded (redirected to a `/home_alt/light/` route); readable CSS contained
  reduced-motion and color-scheme rules.

**PlayStation.**
- Search: Push Square 2026-04-12 (PS5 store beta, unconfirmed by Sony) and PlayStation LifeStyle
  2026-02-06 (web screenshots restored) both loaded.
- Browser: first probe of playstation.com returned an empty body (client rendering); a second probe
  read the full page. Logged in the platform note.

**Bungie.**
- destinythegame.com redirects to bungie.net/7/en/Destiny, which stayed an empty shell (spinner) in
  the browser; WebFetch of a Bungie.net news article returned only a header. Recorded as such; no
  Destiny site layout is described.
- marathonthegame.com DOM loaded; the screenshot was black apart from the logo (intro still loading).
- Creative Bloq interview: chrome only. Brace Design (2025-04-28) loaded. Shacknews (2026-06-19) and
  Game Informer (2026-09-21) loaded.

**Player tools.**
- Wowhead: TBC item page inspected in browser. "Wowhead in 2026 and Beyond" (2026-06-24) and "New
  Features" (2026-07-09) loaded date and title but not the body: marked *unverified* beyond titles.
  2019 navigation preview recorded as background.
- Raider.IO: home page inspected; no dated redesign found by search.
- Warcraft Logs: www.warcraftlogs.com and www.archon.gg/wow showed a "Human Verification" page.
  **Scope decision:** bot checks are not to be completed or bypassed, so the site was not inspected.
  fresh.warcraftlogs.com via WebFetch: 403. Archon app (2026-06-07) and rebrand (2023-10-03) used.
- U.GG (Ahri build page) and Mobalytics (home, Diablo 4 builds) inspected. Mobalytics showed a
  cookie banner with only "Accept"; not accepted. Blitz skipped (two of the three named tools done).
- **Added platform:** while searching Warcraft Logs, a dated report (Aroged 2026-08-31) of a WoW
  website refresh turned up, then Bolverk Games (2026-08-29) on the Armory gaining Classic
  versions. Opened the Armory live and added both to `platforms/blizzard.md`, because an official TBC
  Classic character page is directly adjacent to this app.

**The app.**
- Read `src/styles`, `src/components`, `src/lib/animations.ts`, `TierListsPanel.tsx`, `BisPanel.tsx`
  and `index.html`. Opened the live site, went through the character wizard (Human Fury Warrior)
  into the planner. Findings are summarized at the top of `recommendations.md`. Notable: the
  anime.js helpers already honour reduced motion, so no recommendation was made there; the
  tier list source link sits at the bottom of each panel with no date.

**Synthesis.**
- Wrote `trends.md` (12 trends, each with 2+ platforms, plus single-platform observations),
  `recommendations.md` (9 items in 3 priorities, plus "considered and not recommended"),
  `sources.md` and `README.md`.

## Recheck (2026-10-01)

**What I checked.** Every file was re-read against `sources.md`:
1. Every bracketed source ID used in the notes exists in `sources.md` (checked by script; none
   missing). Every `sources.md` row has a date (publication date, URL date where marked, or the
   2026-10-01 viewing date for live pages) and a load status.
2. Every link in `sources.md` was either opened in this session (live page or WebFetch) or is
   explicitly marked "not opened" / "failed". No link was added from memory.
3. Anything dated before 2024 is labelled background: Battle.net 2019 beta and 2021 overhaul, the
   2023 Steam overlay update, the 2019 Wowhead nav preview, the 2010 Find upgrades button, the 2023
   Archon rebrand, and the undated Riot Medium post.
4. Quotes: scanned every quoted string; all are under 15 words (the longest are article titles in
   `sources.md`).
5. Each recommendation names its trend(s); each trend lists at least two platforms; single-platform
   findings are kept in the "Observations" section of `trends.md` and in "Considered and not
   recommended".

**What I changed.**
- **Viewport width was wrong.** Platform notes said screenshots were "about 800 px wide". The
  screenshot images are 800 px, but the page viewport was 1280 x 720 CSS px (checked with
  `innerWidth` on two sites); the capture is downscaled. Corrected in blizzard, riot, wowhead,
  raider-io, ugg-mobalytics and the log above. The Armory note now says the nav was collapsed at
  1280 px rather than "at about 800 px".
- **riot.md** claimed League Next details came "from the BigGo summary"; I never opened BigGo.
  Now says search snippets only. Removed `__NEXT_DATA__` from the Next.js evidence (the probe only
  confirmed the `next-route-announcer` element).
- **epic-games.md**: removed the Tom's Hardware citation (E3); only its headline loaded and it had no
  visible date.
- **xbox.md**: removed the Game Informer citation (X3; not opened). The handheld full-screen claim
  now cites Xbox Wire June 2025 (X2), and the 2025-10-16 Ally launch date was confirmed on the
  September Wire post (X4) instead of a search snippet.
- **bungie.md**: the Portal's 2025 introduction is now marked *unverified* (snippets only); the
  Monument of Triumph date was softened to "June 2026"; removed "Destiny 2 content updates have
  ended", which came from a search snippet, not the Game Informer article cited.
- **blizzard.md**: dropped the uncited "Blizzard forum thread" from the Armory claim; B9 date set to
  2026-08-29; B7 (Overwatch rename) now points at Insider Gaming 2026-02-04, which loaded (VideoCardz
  and esports.gg had failed).
- **wowhead.md**: the "Find upgrades predates 2024" line had no date; looked it up (2010-05-07) and
  added it as W5.
- **playstation.md** and T7: the "pill" Play now button is now flagged as judged from the screenshot,
  radius not measured.
- **trends.md** T3: "search on almost every page" softened to "on more pages", matching V2.
- **recommendations.md**: added the A1/A2 source tags for the app observations.

**Known gaps left as they are.** Warcraft Logs and archon.gg (bot check), the Destiny site (empty
shell), all desktop launchers (not installed), Blitz (not covered), and article bodies that did not
load (Wowhead W2/W3, Bloomberg R4, BigGo R5). These are marked in the notes and not used as
evidence for any recommendation on their own.

---

# Expansion: 11 to 25 platforms (2026-10-01, session 2)

Same researcher, same date window (January 2024 to 2026-10-01), same conventions (seen / reported /
*unverified*, dated source IDs, quotes under 15 words). Plan written before searching.

## Questions for this pass

1. Do the 12 first-run trends hold when the sample more than doubles? Which strengthen, which weaken,
   which should be retired?
2. What patterns appear on 2+ of the new platforms that the first 11 did not show?
3. How do the guide and theorycraft sites closest to this app's job (Maxroll, Icy Veins, WoWSims)
   lay out builds, gear planners and simulators?
4. Do other publishers (Nintendo, Ubisoft, EA, Square Enix, HoYoverse, GGG, Amazon) and stores (GOG)
   match the "game sites square, store shells rounded" split (T7) and "marketing light, tools dark" (T9)?
5. Does the wider evidence change the priority of any recommendation?

## New platforms (planned list)

1. Nintendo (nintendo.com, My Nintendo Store / eShop web)
2. Ubisoft (ubisoft.com, Ubisoft Connect)
3. EA (ea.com, EA app)
4. Square Enix: Final Fantasy XIV site and The Lodestone
5. CD Projekt / GOG (gog.com, GOG Galaxy)
6. HoYoverse (Genshin Impact / Honkai: Star Rail sites, HoYoLAB)
7. Grinding Gear Games: Path of Exile 2 site
8. Amazon Games: New World / Throne and Liberty sites
9. Maxroll.gg
10. Icy Veins
11. Blitz.gg
12. CurseForge (and/or Overwolf)
13. Tracker.gg
14. WoWSims (TBC sim web UI)

Method as in session 1: each live page opened in the Claude browser pane at the pane's default
viewport (width checked with `innerWidth` and logged per platform), with a script reading loaded
fonts, body and heading styles, button radius and colour, skip links, readable
`prefers-reduced-motion` / `prefers-color-scheme` rules, search inputs and nav labels; plus a
screenshot. Same probe limits: cross-origin sheets and shadow DOM are unreadable, so a zero count
is *unverified*, not absent. Bot checks and cookie walls are not bypassed or accepted.

## Research log (session 2)

Written 2026-10-02 from the three batch logs and batch source lists (`_batch-A/B/C-log.md`,
`_batch-A/B/C-sources.md`), which were then deleted. Every source ID below is defined in
`sources.md`. All three batches ran on 2026-10-01 as parallel `gaming-ui-researcher` runs, each
writing only its own platform files plus its log and source list.

### Batch A: Nintendo, Ubisoft, EA, Square Enix (FFXIV), GOG (IDs NA1-NA28)

**Pages and failures.**

| Page | Result |
|---|---|
| nintendo.com/us home; Fire Emblem product page | Loaded fully [NA1, NA2] |
| ubisoft.com/en-us | **First load unstyled** (0 sheets applied, Times New Roman); reload loaded; nav and skip link read inside the `global-navigation` shadow root [NA8] |
| ubisoft.com Assassin's Creed Shadows | Loaded [NA9] |
| Ubisoft help article 000071610 | Loaded, but did **not** contain the mobile-app shutdown text a search summary attributed to it |
| ea.com; Battlefield 6 | Loaded; cookie banner left alone [NA13, NA14] |
| Lodestone; FFXIV promo site | Loaded; most sheets cross-origin [NA19, NA20] |
| gog.com; Dungeon Keeper 2 | Loaded; cookie banner and age gate left alone, content read from the DOM underneath [NA23, NA24] |
| GOG GALAXY changelog | WebFetch 403; loaded in browser [NA26] |
| GameSpot (Nintendo Today), Neowin (Connect), TechPowerUp, TechSpot | WebFetch 403; not used |
| ixbt.games (Connect mobile app) | 404; not used |
| ea.com/news/welcome-to-the-new-eacom | 404; Wayback shows it is from 2011; not used |
| Wayback captures: Nintendo 2025-11-10 / -20, EA 2026-08-10 / -20 / -27 | No snapshot returned; date windows left as recorded in NA3 / NA15 |
| Wayback availability API | Empty JSON for every URL; switched to the `web.archive.org/web/<date>/<URL>` redirect |

No bot checks met. WebSearch refused domain filters for eurogamer.net, ign.com, polygon.com,
theverge.com, arstechnica.com and rockpapershotgun.com ("not accessible to our user agent").

**Queries and decisions (in order).**

| # | Query | Accepted | Rejected (why) |
|---|---|---|---|
| 1 | `nintendo.com website redesign 2025` | NA7 (Nintendo UK, 2025-12-12) | Behance concept, Webflow fan redesign, ResetEra 2020 (forum, old) |
| 2 | `Nintendo eShop web store change Switch 2 website My Nintendo Store merged 2024` | NA4 (Nintendo Life) | Nintendo Malaysia "newly launched eShop": regional console-store launch, "redesigned" wording not clearly the page's |
| 3 | `Nintendo Today app launch March 2025 news calendar app` | NA6 (AppleInsider; GameSpot was 403) | Fandom wikis, Bulbapedia, androidayuda (weak) |
| 4 | `Nintendo Store app launch 2025 smartphone ...` | NA5 (MacRumors) | Android Authority, Nintendo Life: not needed |
| 5 | `nintendo.com new font Geologica website` | none | shadcn.io, oh-my-design.kr "design system" scrapers, font sites (weak, unattributed); change dated from archives instead (NA3) |
| 6 | `Ubisoft Connect redesign new interface 2025`; `Ubisoft Connect PC app update new home page library 2024 news` | NA11 (2023-06-26, background only) | tech-insider.org (SEO; "January 2026 rollout" contradicted by the dated primary), gHacks / 80.lv (2023), Neowin (403) |
| 7 | `"Ubisoft Connect" 2025 OR 2026 new feature app update announced` | lead only (Steam story, app shutdown) | |
| 8 | `Ubisoft Connect Services Steam ... September 2026` | NA12 (PCGamesN, 2026-09-10) | tech-insider, basic-tutorials, eXputer, gocdkeys (weak / SEO); Escapist, Lowyat not needed |
| 9 | `Ubisoft Connect mobile app shut down April 2025` (also restricted to ubisoft.com) | none | X post, ixbt.games (404), help page without the text: **claim dropped** |
| 10 | `ubisoft.com new website launch Ubisoft Store merged ubisoft.com 2025`; `ubisoft.com new homepage April 2025 redesigned website` | none | nothing found; rebuild dated from archives (NA10) |
| 11 | `EA app update new design 2025 PC launcher` | none | EA's 2022 launch post (before window), download sites; lead: Origin shutdown |
| 12 | `ea.com redesign new website EA brand typeface Electronic Arts Display 2024`; `Instrument Electronic Arts case study rebrand ea.com website` | NA16 (Instrument, undated), NA17 (Brand Archive, weak, date only) | fontmeme, designyourway, logo sites (weak); 2020 MCKL typeface page (background, not needed) |
| 13 | `EA new website ea.com relaunch August 2026` | none | "welcome to the new EA.com" is a 2011 post; rebuild dated from archives (NA15) |
| 14 | `Origin shutting down April 17 2025 EA app move` (reputable domains) | NA18 (Engadget) | PC Gamer, PCGamesN: not needed |
| 15 | `"EA app" redesigned interface new navigation 2024 ...`; `EA app release notes "main navigation" ...` | none | only a snippet citing TechSpot (403); logged as a gap |
| 16 | `Lodestone FFXIV website update new feature 2025 Lodestone renewal` | NA21 (Lodestone Update Notes) | forum mirror threads not needed |
| 17 | `GOG Preservation Program launch November 2024` | NA25 (GOG blog) | Gematsu, Game Developer, TechPowerUp not needed |
| 18 | `GOG Dreamlist launch 2025 feature` | NA27 (KitGuru) | retronews, WordPress blog, X post (weak); Neowin not fetched |
| 19 | `GOG Galaxy new version 2025 OR 2026 redesign update announced` | NA26 (GOG changelog, read in browser) | shattered.io, uptodown, filehorse (weak); a 2026-07-28 Linux announcement and 2.1.x build named in the search summary were not on the changelog (latest 2.0.97 Beta, 2026-04-08), so not used |
| 20 | `CD Projekt sells GOG Michal Kicinski` | NA28 (GOG blog) | tbreak, VGChartz, Gaming Amigos not needed |

**Archive evidence (curl).** Snapshot HTML was downloaded and searched for font names and build
markers, dating three rebuilds none of the companies announced: Nintendo's Museo Sans to Geologica
switch (2025-10-15 to 2025-12-01) [NA3], ubisoft.com's move to Next.js (2025-04-15 to 2025-05-01)
[NA10], and ea.com's move from `<ea-*>` custom elements to Next.js (2026-08-01 to 2026-09-02)
[NA15]. NA22 compared two FFXIV promo captures (no redesign found).

**Scope decisions and drops.** Ubisoft Connect mobile shutdown, EA app navigation overhaul, GOG
GALAXY Linux / 2.1.x and the "January 2026" Connect rollout were dropped (no readable reputable or
primary source). Desktop launchers were not installed. Unverified labels kept: Nintendo font date,
Ubisoft and EA rebuild dates and reasons, reduced motion on Ubisoft / EA / FFXIV / GOG, Lodestone
on mobile. Batch counts: 28 sources (Primary 20, Reputable secondary 7, Weak 1); unchanged by the
merge.

### Batch B: HoYoverse, Grinding Gear Games, Amazon Games, CurseForge, Tracker.gg (IDs NB1-NB26)

NB8 was skipped while drafting and never used. Cookie banners (HoYoverse) and HoYoLAB's interest
dialog were left unanswered; no bot checks; no sign-in or account linking. Player names on
Tracker.gg leaderboards were read by the probe and deliberately left out of the notes.

**Queries (in order).**

| # | Query | Result |
|---|---|---|
| 1 | `HoYoPlay launcher unified HoYoverse launcher 2024` | Fan wikis, GamerBraves, Enduins, PinoyGamer; snippets give a 2024-06-17 launch |
| 2 | `HoYoLAB redesign new version update 2025` | App-store and fan posts; nothing usable |
| 3 | `HoYoPlay ...` restricted to IGN, Eurogamer, Polygon, RPS, The Verge | Tool error: domains not accessible to the search agent |
| 4 | `HoYoPlay launcher Genshin Impact Star Rail Zenless one launcher PC` (PC Gamer, GameSpot, Dexerto, hoyoverse.com, Pocket Gamer.biz, Game Rant) | Official Genshin news 124130 and HI3 news URLs; PC Gamer ZZZ times |
| 5 | `"HoYoPlay" launcher announced` (PC Gamer, GameSpot, Dexerto, PCGamesN, GamesRadar, VGC, Siliconera, Pocket Gamer) | Forum threads, unrelated articles |
| 6 | `Path of Exile 2 full release December 11 2026 announced` | Shacknews, GameSpot, Neowin, Dexerto, PCGamesN |
| 7 | `Path of Exile 2 early access launch December 6 2024 pathofexile2.com new website` (reputable outlets) | PC Gamer, GameSpot, VGC, GamesRadar |
| 8 | `Amazon Games New World final season layoffs October 2025` | Windows Central, Insider Gaming, GameSpot, Forbes, others |
| 9 | `CurseForge new website redesign 2024 OR 2025 Overwolf` | Overwolf Medium posts (2022-2023), CurseForge Ideas forum |
| 10 | `CurseForge app standalone Overwolf 2025 news` | Wowhead 2022, SEO explainers |
| 11 | `CurseForge Hytale official modding partner 2026` | hytale.com news, hytale.curseforge.com, fan / SEO sites |
| 12 | `Tracker Network tracker.gg acquired OR redesign OR "new site" 2024 2025` | TRN Checkpoint R6 changelog 2024-06-21; SEO competitor pages |

**Accepted.** Live pages NB1-NB4, NB9, NB10, NB13, NB14, NB19, NB20, NB24, NB25; company posts
NB15-NB17 (Amazon), NB21 (Hypixel), NB26 (Tracker Network changelog); reputable NB11 (Shacknews),
NB12 (VGC), NB22 (Wowhead news, 2022 background); weak NB5, NB6 (HoYoPlay announcement only,
labelled) and NB7, NB23 (snippet-only dates, *unverified*). Batch B also accepted NB18 (Insider
Gaming); the merge re-tiered it Weak and replaced it with NB27 (Engadget).

**Rejected or failed.**

| URL / source | Why |
|---|---|
| genshin.hoyoverse.com/en/news/detail/124130 | Empty shell in WebFetch and browser (only the cookie banner after 7 s); would have been the primary source for the HoYoPlay switch date |
| honkaiimpact3.hoyoverse.com news 126478 | WebFetch got a loading screen only |
| hoyoplay.hoyoverse.com (WebFetch) | Title only; read in browser instead (NB4) |
| gamerbraves.com HoYoPlay article | HTTP 403 |
| genshin-impact.fandom.com/wiki/HoYoPlay | HTTP 402; fan wiki (weak) |
| pcgamer.com ZZZ launch-time article; pcgamer.com PoE2 unlock-times article | Only site chrome returned |
| gamespot.com PoE2 full-release article | HTTP 403; replaced by Shacknews (NB11) |
| gamespot.com PoE2 early-access times article | HTTP 403; replaced by VGC (NB12) |
| windowscentral.com Amazon Games layoffs | Only site chrome; replaced by Insider Gaming (later NB27) |
| forbes.com New World end of support | HTTP 403 |
| medium.com/overwolf "Switch to the new website announcement 18/4" | HTTP 403; kept only as weak NB23 for a background date |
| Neowin, Dexerto, PCGamesN, dlcompare, lagofast (PoE2 date) | Not needed once Shacknews loaded; dlcompare / lagofast are SEO sites |
| hytale.game, hytalecharts, supercraft, switchbladegaming, sportskeeda (Hytale x CurseForge) | Fan / SEO sites; the "only official platform" claim left *unverified* |
| SEMrush competitor pages | Not about UI |
| tracker.gg R6 changelog (WebFetch) | Nav only; read in browser instead (NB26) |
| Wayback availability API | HTTP 429; no snapshot confirmed, lookup form given instead |

**Scope decisions.** HoYoverse studied through both game sites, HoYoLAB and the HoYoPlay page;
the HoYoPlay switch date stays *unverified* (only weak sources loaded). Amazon covered through both
game sites plus Amazon's own wind-down posts. CurseForge studied on the WoW pages (Classic TBC
flavor filter); Overwolf.com and the desktop apps were not inspected. No individual Tracker.gg
profile was opened. Batch counts as written: 25 sources (Primary 17, Reputable secondary 4, Weak
4); after the merge (NB18 retired, NB27 added) still 25 active (17 / 4 / 4).

### Batch C: WoWSims, Maxroll, Icy Veins, Blitz (IDs NC1-NC23)

**Search and fetch log.**

| # | Query or URL | Tool | Result | Decision |
|---|---|---|---|---|
| 1 | wowsims.github.io/tbc/ | browser | Landing with 16 spec links | NC1 |
| 2 | wowsims.github.io/tbc/elemental_shaman/ | browser | **Deprecation modal**: old 2021 sim, use wowsims.com | NC2; plan changed to study the new sim |
| 3 | wowsims.com | browser | Text empty on first read (client-rendered); full after 3 s | NC3 |
| 4 | wowsims.com/tbc/ | browser | Alpha / Gear Planner labels | NC4 |
| 5 | wowsims.com/tbc/shaman/elemental/ and /tbc/warrior/dps/ | browser | Loaded after ~4 s; Results and Settings tabs clicked by script (nothing entered or submitted) | NC5 |
| 6 | github.com/wowsims/tbc-new | WebFetch | README / stats summary | NC6 |
| 7 | github.com/wowsims/tbc | WebFetch | Deprecation notice | NC8 |
| 8 | github.com/wowsims/tbc-new/releases | WebFetch | Releases Sep 14-30, year not printed | NC7 (2026 inferred, stated) |
| 9 | `wowsims TBC Anniversary simulator 2026 wowsims.com tbc` | WebSearch | Repo, CurseForge, forum, Sportskeeda | Used to find NC9; forum and Sportskeeda rejected (weak, not needed) |
| 10 | curseforge.com/wow/addons/wowsimsexporter | WebFetch | Updated 2026-08-05 | NC9 |
| 11 | maxroll.gg | browser | Loaded | NC10 |
| 12 | `Maxroll planner update 2025 OR 2026 new planner features` | WebSearch | PoE2Planner news, X post, LE / BL4 pages | PoE2Planner news fetched (NC13); X post kept as snippet only (NC14) |
| 13 | maxroll.gg/d4/planner/ | browser | Loaded after ~4 s | NC11 |
| 14 | maxroll.gg PoE2Planner community-builds news | WebFetch | 2024-12-15 | NC13 |
| 15 | `maxroll.gg d4 planner "War Plans" generated build guides news` | WebSearch | X post (2026-04-30 per summary), War Plans resource, guide | X post unloadable, *unverified*; guide opened (NC12) |
| 16 | maxroll.gg Heartseeker Rogue guide | browser | Loaded | NC12 |
| 17 | maxroll.gg/wow | WebFetch | Retail only | NC15 (why the D4 planner was studied) |
| 18 | icy-veins.com/tbc-classic/ | browser | Loaded | NC16 |
| 19 | Icy Veins TBC Elemental Shaman BiS page | browser | Loaded | NC17 |
| 20 | `Icy Veins new website design redesign 2025` | WebSearch | 2026 redesign news, forum posts, WP Solutions / Neurony case studies | Redesign news accepted (NC19); agency case studies not opened (undated in snippets, probably pre-2024) |
| 21 | Icy Veins redesign news URL | WebFetch | **HTTP 403** | Re-opened in browser; text and `article:published_time` 2026-05-19 read |
| 22 | Icy Veins forum topic 72787 "Getting a New Look" | WebFetch | **HTTP 403** | Rejected (date unknown, not needed) |
| 23 | `Icy Veins Vedatis Outplayed U.GG acquisition` | WebSearch | 2021 press releases | Rejected (pre-window); live footer used instead |
| 24 | Icy Veins retail Elemental Shaman guide | browser | Loaded | NC18 (comparison, redesign inference) |
| 25 | blitz.gg | browser | Loaded | NC20 |
| 26 | blitz.gg/lol/champions/Ahri/build (to /mid) | browser | Loaded; readable component CSS | NC21 |
| 27 | `Blitz.gg app 2025 redesign OR acquisition OR "new Blitz"` | WebSearch | Medium post (old ownership), Bachoo case study, company-profile aggregators | Bachoo accepted as 2023 background (NC23); others rejected (weak or out of window) |
| 28 | blitz.gg/news | WebFetch | **HTTP 403** | Not retried in browser; gap |
| 29 | `Blitz app League of Legends overlay 2026 update minimal theme` | WebSearch | SEO "best LoL apps 2026" lists | All rejected (weak) |
| 30 | blitz.gg/changelog | browser | Site 404 page | NC22 (no public changelog at that path) |
| 31 | Wayback availability API, 12 URLs | WebFetch | 5 snapshots returned | Recorded per source |

**Considered and not used:** sportskeeda "WoW Classic 2025 Roadmap" (SEO, not needed);
buildzcrank, hexgate.app, counterplays "best LoL apps / overlays 2026" (competitor / SEO lists);
medium.com/@blitzesports "New owners of the Blitz app" (undated, appears pre-2024); pitchbook /
tracxn / dealroom profiles (weak aggregators); Enthusiast Gaming 2021 press releases via nasdaq.com /
sec.gov (pre-window; footer suffices); Icy Veins forum posts "Getting a New Look" and "New Design and
Logo" (403, undated); Blizzard forums "How do people sim themselves in tbc anni" (forum); maxroll.gg
"d4planner-is-live" (likely 2023, not opened).

**Failures.** Screenshots timed out on both WoWSims pages tried; stopped after two. WebFetch 403
on Icy Veins news and forum and on blitz.gg/news. The Maxroll guide loaded a background reCAPTCHA
frame, which was not touched; no consent banner clicked. Unreadable cross-origin sheets: 1
(WoWSims sim), 1-3 (Maxroll), 4 (Icy Veins hub), 0 (Blitz).

**Scope decisions.**
- **WoWSims:** the familiar `wowsims.github.io/tbc` is the retired 2021 sim (deprecation modal and
  repo notice) [NC2, NC8]; the competitor studied is the new `wowsims.com/tbc` (repo `tbc-new`)
  [NC4-NC7]. The old pages were kept as a deprecation example.
- **Maxroll:** its WoW section is retail only with no planner or sim [NC15], so the Diablo IV
  planner and a D4 build guide were studied as its nearest equivalent [NC11, NC12].
- **Blitz:** no WoW coverage, so the League of Legends home and Ahri build page were studied
  [NC20, NC21]. No dated 2024-2026 source for any Blitz product or design change was found.
- **Icy Veins:** both the TBC Classic section and one retail guide were read, so the 2026 retail
  redesign [NC19] could be compared with the TBC pages; whether it has reached TBC is *unverified*.
- Batch counts as written: Primary 22, Reputable secondary 1 (NC23, background), Weak 0. The merge
  re-tiered NC14 to Weak (only a snippet was read), giving 21 / 1 / 1.

## Method notes (session 2)

a. **Viewport.** Every session-2 page was measured at `innerWidth` 1024 (1024 x 768 CSS px);
   session 1 used 1280 x 720. Width-dependent figures (nav collapse, viewport-scaled root fonts such
   as HoYoverse's, content widths, where a planner starts on the page) are not comparable across the
   two sessions. The merge-step re-probe K1 ran at 1280 px.
b. **No screenshots.** The browser pane was hidden for all of session 2 and every capture timed out
   ("pane is not displayed" / "page did not finish rendering in time"). No agent fronted the pane,
   because three agents shared it. Every "seen" claim in session 2 comes from a computed-style / DOM
   script (fonts, styles, radii, custom properties, skip controls, CSS rule counts, text); no claim
   about overall look, hero art or image-based buttons is made.
c. **Skip controls built as `<button>`.** Amazon's skip control (`ags-SiteHeader-skipToMainContent`)
   is a `<button>`, so a probe that scans only `<a>` misses it. `trends.md` T12 already accounts
   for this: its session-1 rows use the merge-step re-probe [K1], which looked for any link or button
   mentioning "skip", including open shadow roots (it found skip links in Blizzard's shadow DOM and
   on the Epic store that session 1 missed), and T12 notes that batches A and C may have searched
   only for `<a>`. The batch logs do not record whether A and C counted buttons, so their "no" rows
   (EA, FFXIV, GOG, WoWSims, Maxroll, Blitz, Icy Veins retail) remain possible undercounts. Open.
d. **Archive dating.** Batch A dated three unannounced rebuilds (Nintendo typeface, ubisoft.com and
   ea.com framework moves) by downloading `web.archive.org` snapshot HTML with curl and searching it
   for font names and build markers [NA3, NA10, NA15]. This shows what changed and between which
   capture dates, not why. Batches B (API rate-limited) and C (availability API) did not do this.
e. **Separate tabs.** Each batch opened its own browser tab (C: `tab-1`, B: `tab-2`, A: `tab-3`)
   and passed its tabId on every call, so no batch navigated another's page.
f. **How the expansion ran.** The first expansion agent wrote the plan above ("Questions for this
   pass", "New platforms") and then stalled before researching. The work was re-run as three
   parallel batches (A, B, C) plus a merge step. The merge folded sources into `sources.md`, audited
   the 25 platform files, rewrote `trends.md` (T1-T19) and `recommendations.md` and updated
   `README.md`, then was cut off by a usage limit before writing this log. This finishing step
   (2026-10-02) wrote the session-2 log, these notes and the audit below, and deleted the batch
   files.

## Citation audit (session 2, 2026-10-02)

Counts computed by script from the files as they stand on 2026-10-02. Citations were parsed from
every bracket in `platforms/*.md`, `trends.md` and `recommendations.md`, splitting on commas,
expanding ranges such as `[NB1-NB3]` and ignoring dates inside brackets such as
`[NB15, 2025-10-28]`.

**Sources in `sources.md`.**

| Group | Primary | Reputable secondary | Weak | Total |
|---|---|---|---|---|
| Session 1 (B, R, V, E, X, P, U, W, RI, WL, M, A) | 26 | 12 | 7 | 45 |
| Merge step (B11-B13, R6-R8, E4, WL4, WL5, K1, NB27) | 5 | 6 | 0 | 11 |
| Batch A (NA) | 20 | 7 | 1 | 28 |
| Batch B (NB, excluding NB27) | 17 | 3 | 4 | 24 |
| Batch C (NC) | 21 | 1 | 1 | 23 |
| **Active total** | **89** | **29** | **13** | **131** |

Plus 3 retired (B7, R5, NB18) and 20 tried-and-failed URLs listed in `sources.md` (15 from session
1, 5 from the merge step); session-2 batch failures are listed in the batch sections above. Unused
or removed IDs: E3, X3 (removed in session 1), NB8 (never used).

**Citations.**
- Distinct source IDs cited: **131** overall; 131 in `platforms/`, 83 in `trends.md` (84 before the WL2 fix below),
  54 in `recommendations.md`.
- Every cited ID is defined in `sources.md` (0 undefined). Every active source is cited at least
  once (0 uncited). No retired ID is cited.
- Every source in the three `_batch-*-sources.md` files is in `sources.md` (NA1-NA28, NB1-NB7,
  NB9-NB26, NC1-NC23; NB18 under Retired). Nothing had to be added.
- Claims marked *unverified*: **52** markers in the notes after the fix below (10 in
  `trends.md`, 0 in `recommendations.md`, 42 across 21 of the 25 platform files), plus 13 in `sources.md` describing
  what a source supports.

**Session-1 sources re-tiered, retired or replaced.** Session 1 had no tier column; the merge gave
every source a tier.
- Retired: **B7** (Insider Gaming, Overwatch rename; outlet re-tiered Weak, Nintendo Soup is a fan
  aggregator), replaced by **B13** (Engadget) plus B2 (seen). **R5** (BigGo Finance "League Next"
  summary, weak and never opened), replaced by **R7** (GameDaily via Yahoo) and **R8** (Riot
  Support FAQ).
- Tiered Weak and demoted to *unverified* detail, each with a stronger source for the core claim:
  **B8** (Aroged; timing from the B12 archive, state from B1), **B9** (Bolverk Games; date from the
  B11 archive, state from B10), **R3** (spilled.gg; launch change from R8), **E2** (Tbreak;
  corroborated by E4, VGC), **WL2** (Master of Warcraft; move and recording from WL4, WL5), plus
  **B6** and **U3** (background / description in one platform file only).
- Formalised: the undated Riot Medium post, a session-1 failed fetch cited as background, is now
  **R6** (Primary, background, *unverified*). New merge-step evidence: B11, B12 (archive captures)
  and K1 (skip-control re-probe).
- Session 2: **NB18** (Insider Gaming) retired for **NB27** (Engadget); **NC14** (Maxroll's X post)
  re-tiered Primary to Weak because only a snippet was read.

**Weak sources in `trends.md` and `recommendations.md`.** Of the 13 Weak sources, 11 are cited only
in platform files. The other two:
- **R3**: `trends.md` T11 (`[R3, R8]`) and `recommendations.md` "What changed" (`[R3]`). Both uses
  say the Riot "lightweight client" evidence was *dropped* because it rested on this weak source;
  the remaining claim (Riot gives shared features as the reason) rests on R8. Not sole support.
- **WL2**: was the only source for the "Full / Lite modes (Archon)" bullet in `trends.md`
  Observations. **Fixed:** bullet removed from `trends.md`; the detail stays, labelled *unverified*,
  in `platforms/warcraft-logs.md`, and the WL2 row in `sources.md` now says so.

**Internal links.** 36 relative Markdown links across the folder checked by script (file exists;
heading anchor exists where given): 0 broken. No file links to the deleted `_batch-*` files.

**Fixed in this step.**
1. `trends.md`: removed the WL2-only Observations bullet (weak sole support).
2. `sources.md`: WL2 usage note updated; the "Tried and failed" pointer now names this log section.
3. Session-2 log and method notes written; six `_batch-*` files deleted after checking that all
   their sources are in `sources.md`.

**Still open.**
- Batches A and C may have counted only `<a>` skip links (note c); re-probe their "no" rows with the
  K1 script.
- Batch B pages have Wayback lookup links only (API 429); no snapshot confirmed.
- No session-2 screenshots; visual impressions of the 14 new platforms remain unobserved.

## Owner-side check (2026-10-02)

The session lead re-ran the link, quote and citation-ID checks independently: 0 broken internal links, every
cited ID defined, and the only quotes over 15 words are article headlines in `sources.md`. It also checked one
recommendation against the code and corrected it: R10 had said BiS data is "already kept per phase", but
`bisRankings.json` contains Phase 2 entries only, so R10 now lists a data ingest as its first step.

