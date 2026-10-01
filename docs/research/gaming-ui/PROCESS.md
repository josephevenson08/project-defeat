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
