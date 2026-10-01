# Trends: what several platforms are doing (2024 to 2026-10-01)

A trend here needs evidence from **at least two platforms**. Single-platform findings are listed at
the end as observations. "Seen" means I observed it on the live page on 2026-10-01; "reported" means
a dated source says so. Source IDs refer to `sources.md`; platform notes are in `platforms/`.

---

## T1. One component system, re-skinned per product with tokens

Big publishers build every game's site from the same parts and change only type, accent color and
corner radius per game.

- **Blizzard** (seen): blizzard.com, WoW, Diablo IV and Overwatch all use the same `blz-*` custom
  elements (nav, masthead, button, card, news, carousel). The nav takes a `theme` attribute; each
  game swaps its display face (Montserrat, Old Fenris, Big Noodle Too) and button color/radius
  [B1-B4].
- **Riot** (seen): League and VALORANT share one Next.js page template and a Riot-wide top bar;
  only the faces (Beaufort / Tungsten) and accent (gold / red) change [R1, R2].
- **PlayStation** (seen): hero blocks carry `theme--dark` / `theme--light`, and a campaign block
  sets its own CSS custom properties inline [P1].
- **U.GG and Mobalytics** (seen): one shell (left icon rail, top cross-game strip) serves many games
  [M1, M2].

## T2. "Which game / version?" is the first navigation choice

As one brand now covers several live versions of a game, the version picker has moved to the top
of the page and is styled as the current context.

- **WoW site** (seen): three game logos (WoW: Forever, Midnight, Classic) above the masthead [B1].
- **WoW Armory** (seen; Classic support reported 2026-08-29): a **Game Version** select listing
  WoW, WoW Classic, Burning Crusade Classic and Mists of Pandaria Classic before search [B9, B10].
- **Wowhead** (seen): a top strip WoW / Retail / Forever / Classic / TBC / Mists with the current
  one highlighted green [W1].
- **Raider.IO** (seen): Retail / Forever / Classic Era / Mists strip [RI1].
- **Riot** (seen): the Riot logo dropdown as a cross-game switcher [R1]; **U.GG / Mobalytics**
  (seen): cross-game strips [M1, M2].

## T3. Search is promoted to permanent, primary navigation

Search sits in the main bar on every page and increasingly offers suggestions or a keyboard shortcut.

- **Steam** (reported 2025-07-26, seen): search merged into the single store menu, now shown on more
  pages; the dropdown suggests recently viewed items, popular searches, tags and publishers [V1, V2].
- **Raider.IO** (seen): "Search characters and guilds" with a visible **Ctrl K** badge [RI1].
- **Wowhead** (seen): a wide header search over guides, news and the database [W1].
- **Epic Games Store** (seen; "improved search" reported 2026-06-19): search plus three tabs is the
  whole navigation [E1, E2].
- **Blizzard** (seen): the WoW nav carries a search URL into the Armory; the Armory leads with
  character/guild search [B1, B10].
- **PlayStation** (reported, beta, *unverified*): descriptive tags that combine in search [P3].

## T4. Fewer, consolidated navigation layers

Several redesigns since 2024 remove a layer of navigation or fold one hub into another.

- **Steam** (reported 2025-07-26): the blue top bar and the left link column merged into one top
  menu [V2].
- **Riot** (reported 2026-04-11): the Riot Client becomes the single front door for League, TFT and
  social, keeping game clients lean [R3].
- **WoW site** (reported 2026-08-31, seen): one home page now covers news, current and Classic
  versions, subscriptions and system requirements [B8, B1].
- **Epic** (seen): Discover / Browse / News is the entire store navigation [E1].
- **Destiny 2** (reported 2026-06-19; in-game, not web): the Portal menu folded back into the
  Director map [U4].

## T5. Context and provenance printed next to the data

Numbers and news items carry their patch, date, category, source or sample size inline, instead of
leaving the reader to infer them.

- **U.GG** (seen): a "Patch 26.19" chip in the page title, and "53.25% WR (4,915 Matches)" on each
  recommendation block [M1].
- **Riot** (seen): every news card shows category and date, for example "GAME UPDATES 9/28/2026"
  [R1, R2].
- **Marathon** (seen): news lines show source and date, for example "BUNGIE.NET 09.24.2026" [U2].
- **Wowhead** (seen): a "Phase 1" tag on the item, and tabs labelled with counts such as
  "Comments (78)" [W1].
- **Xbox PC app** (reported 2025-06-23): games in the merged library show which store they come
  from [X2].
- **Epic** (reported 2026-06-19): patch notes shown inside the store page [E2].

## T6. Summary band first, detail in tabs below

Data-heavy pages lead with a strip of headline figures, then split detail into tabs.

- **U.GG** (seen): Tier / Win Rate / Rank / Pick / Ban / Matches strip, then Build / ARAM /
  Counters / Leaderboards tabs [M1].
- **Wowhead** (seen): item header and actions, then Dropped by / Guides / News / Comments tabs with
  counts [W1].
- **Xbox** (reported 2025-09-29): Rewards hub "Goal Cards" put progress at the top [X4].
- **Mobalytics** (seen): call-out cards, then Verified Builds / Creator tabs [M2].

## T7. Game-identity sites use square, flat CTAs; platform storefronts use rounded ones

- **Square or near-square (0 to 4 px), one flat accent color** (seen): League gold, 0 px [R1];
  VALORANT red, 0 px [R2]; Marathon acid green, 0 px [U2]; WoW gold-bordered, 0 to 2 px [B1];
  Overwatch orange, 2 px [B2]; Diablo IV dark red, 4 px [B3].
- **Rounded** (seen): blizzard.com 100 px pills [B4]; xbox.com 999 px pills [X1]; Epic store
  10 px [E1]; playstation.com "Play now" pill (from screenshot) [P1].
- Reading: the in-world game sites keep hard edges; the neutral publisher and store shells round off.

## T8. A display face for identity, a neutral or condensed sans for everything else

- Blizzard: per-game display faces, Open Sans / Poppins / Archivo for body [B1-B4].
- Riot: Beaufort or Tungsten for headings; Spiegel or DIN Next for UI [R1, R2].
- Xbox: Segoe Sans Display plus the condensed Bahnschrift family [X1]. PlayStation: SST and SST
  Condensed [P1].
- U.GG: Barlow headings, Inter numbers [M1]. Mobalytics: Oswald (condensed) with Roboto [M2].
- Display faces are uppercase or small-caps and often tracked; body faces are plain.

## T9. Publisher marketing goes light for reading; player tools stay dark

- **Light reading areas** (seen): League and VALORANT switch to pale sections after the dark hero
  [R1, R2]; playstation.com is white-bodied [P1]; xbox.com serves a `/home_alt/light/` route and has
  `prefers-color-scheme` rules [X1].
- **Dark throughout** (seen): Wowhead [W1], Raider.IO [RI1], U.GG [M1], Mobalytics [M2], Steam
  [V1], and Blizzard's game sites [B1-B3].
- Reading: tools used for long sessions next to the game stay dark; it is the marketing layer that
  is moving to light.

## T10. Companion tools bridge into the game client

- **U.GG** (seen): an "Auto-Import" button beside the recommended build [M1].
- **Raider.IO** (seen): "Get App & AddOn" in the main bar [RI1].
- **Mobalytics** (seen): desktop app download and a Build Tracker [M2].
- **Warcraft Logs / Archon** (reported 2026-06-07): a desktop app that records gameplay and syncs it
  to logs, with a Lite mode [WL2].
- **Xbox PC app** (reported 2025-06-23): launches games from other stores in one library [X2].

## T11. Speed and weight treated as design goals

- **Epic** (reported 2026-06-19): the rebuild is pitched first as 5x faster cold start [E2].
- **Riot** (reported 2026-04-11): moving hub features into the Riot Client to keep game clients
  lightweight [R3].
- **Wowhead** (reported 2026-06-24, *unverified* body): a public statement on ads and performance
  [W3].
- Counter-example (seen): Bungie.net rendered as an empty shell with a spinner [U1].

## T12. Accessibility basics: present on platform sites, patchy on tools

What a script could see in the live DOM and readable CSS (shadow DOM and cross-origin sheets not
readable, so "not found" is *unverified*):

| Site | Skip link | `prefers-reduced-motion` rules found |
|---|---|---|
| xbox.com [X1] | yes | 9 (plus 6 color-scheme rules) |
| playstation.com [P1] | yes | 0 found |
| Wowhead [W1] | yes | 1 |
| marathonthegame.com [U2] | no | 2 |
| League / VALORANT [R1, R2] | no | 0 found |
| Raider.IO [RI1], U.GG [M1] | no | 0 found |
| Blizzard sites [B1-B4] | no (light DOM) | 0 found (shadow DOM unreadable) |

The two console platform holders and Wowhead ship a skip link; most community tools do not.

---

## Observations (one platform only, not trends)

- **Measured content width from usage data**: Steam chose 1200 px because most players run windowed,
  and added theater / full-screen for media instead of a wider default [V3, V4].
- **Same content in several shells** (desktop, overlay, handheld) is reported for Steam [V5] and
  Xbox [X4]; it is a trend for launchers but has no web-planner analogue, so it is left out of the
  recommendations.
- **Spatial map over category list** (Destiny 2 Director) [U4]: in-game only.
- **Full / Lite modes** of one tool (Archon) [WL2].
