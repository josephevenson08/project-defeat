# Trends: what several platforms are doing (2024 to 2026-10-01)

Re-tested on 2026-10-01 against **25 platform notes** (11 from session 1, 14 from session 2). A
trend needs evidence from **at least two platforms**, and no trend rests on a Weak source alone.
"Seen" means observed on the live page on 2026-10-01; "reported" means a dated source says so;
*unverified* means it could not be confirmed. Source IDs refer to [sources.md](sources.md); platform
notes are in [platforms/](platforms/).

**Two method cautions before reading the numbers.**
- Session 1 measured at **1280 px** with screenshots; session 2 measured at **1024 px** with no
  screenshots, so every session-2 "seen" claim is a computed-style reading, and width-dependent
  figures (nav collapse, content width, viewport-scaled type) are not comparable across sessions
  [B1, NA1, NB1, NC1].
- Skip-link counts depend on the probe. Amazon's skip control is a `<button>` [NB13, NB14], and
  Blizzard's skip links live inside shadow DOM [K1]; both were missed by the session-1 probe. T12
  below uses the merge-step re-probe for the session-1 sites [K1].

## Site types used below

| Type | Platforms (note file) |
|---|---|
| **Publisher hub / platform holder** | blizzard.com [B4], xbox.com [X1], playstation.com [P1], nintendo.com [NA1], ubisoft.com [NA8], ea.com [NA13] |
| **Store / launcher** | Steam [V1], Epic Games Store [E1], GOG [NA23], HoYoPlay [NB4] |
| **Franchise site** | WoW [B1], Overwatch [B2], Diablo IV [B3], League [R1], VALORANT [R2], Marathon [U2], Assassin's Creed Shadows [NA9], Battlefield 6 [NA14], FFXIV promo [NA20], Genshin [NB1], Star Rail [NB2], Path of Exile 2 [NB9], New World [NB13], Throne and Liberty [NB14] |
| **Publisher-run player tool** | WoW Armory [B10], The Lodestone [NA19], HoYoLAB [NB3] |
| **Community player tool** | Wowhead [W1], Raider.IO [RI1], Warcraft Logs (blocked) [WL1], U.GG / Mobalytics [M1, M2], CurseForge [NB19], Tracker.gg [NB24], WoWSims [NC5], Maxroll [NC11], Icy Veins [NC17], Blitz [NC21] |

## Status of the session-1 trends at a glance

| Trend | Session 1 | Now (25 platforms) | Change |
|---|---|---|---|
| T1 One component system, re-skinned by tokens | 4 platforms | 14 support, 1 against | **Strengthened** |
| T2 Game / version is the first choice | 6 | 15 platforms support | **Strengthened**; absorbs "version as a filter" |
| T3 Search as primary navigation | 6 | 15 support, 5 without search | **Narrowed**: tools, stores and hubs, not franchise sites |
| T4 Fewer navigation layers | 5 | 10 support, 1 against | **Strengthened**, mostly launcher consolidation |
| T5 Context and provenance next to the data | 6 | 16 support, 1 against | **Strengthened**: the strongest trend |
| T6 Summary band first, detail below | 4 | 9 support (1 partial), 1 against | Holds, modestly strengthened |
| T7 Square game sites, rounded stores | 10 | franchise 13 of 14 square; hubs and stores all rounded; tools mixed | **Narrowed** by site type |
| T8 Display face + neutral sans | 6 | franchise sites all; hubs and tools split | **Narrowed**; see new T18 |
| T9 Marketing light, tools dark | 9 | tools 11 of 12 dark; marketing mostly dark | **Narrowed**: "marketing goes light" retired, "tools stay dark" strengthened |
| T10 Tools bridge into the game client | 5 | 14 support | **Strengthened**, with a direction split |
| T11 Speed and weight as design goals | 3 (1 unverified) | 2 support, 6 counter-examples | **Weakened** |
| T12 Accessibility: platforms yes, tools patchy | 7 rows | publishers 7 of 15 skip links, tools 2 of 9 | **Narrowed and corrected** |

New trends (each on 2+ platforms, primary-sourced): **T13** freshness stamp + public changelog,
**T14** named presets switchable in place, **T15** game-concept design tokens, **T16** plain-language
notes beside numbers, **T17** status labels on features, **T18** one neutral face for the whole UI,
**T19** silent framework rebuilds.

---

## T1. One component system, re-skinned per product with tokens — strengthened

Big publishers and multi-game tools build every product from the same parts and change type, accent
color and corner radius per product [B1-B4, NA14, NB13, NB14].

| Platform | Type | Evidence | Sources |
|---|---|---|---|
| Blizzard | Hub + franchise | Same `blz-*` custom elements on four sites; nav takes a `theme` attribute | [B1-B4] |
| Riot | Franchise | League and VALORANT share one Next.js template and top bar | [R1, R2] |
| PlayStation | Platform holder | `theme--dark/light` blocks, inline campaign tokens | [P1] |
| U.GG / Mobalytics | Tool | One shell serves many games | [M1, M2] |
| EA | Hub + franchise | Franchise faces declared first with EA's face as fallback (`bfdisplay, electronicartsdisplay`) | [NA14] |
| Ubisoft | Hub + franchise | One `<global-navigation>` over a neutral hub and an in-world game page | [NA8, NA9] |
| Amazon Games | Franchise | Shared `ags-` library under two games, faces and accents swapped | [NB13, NB14] |
| HoYoverse | Franchise | Both game sites built from `pz-` blocks (shared builder is an inference, *unverified*) | [NB1, NB2] |
| Tracker.gg | Tool | 482 root tokens with per-game families | [NB25] |
| Blitz | Tool | `--game-color` drives tab underline and badges | [NC21] |
| WoWSims | Tool | Accent = class color via `--color-class-*` | [NC5] |
| Maxroll | Tool | One shell across 12 games | [NC10, NC11] |
| Square Enix | Franchise + tool | Shared charcoal strip on promo and Lodestone, different faces (partial) | [NA19, NA20] |
| Icy Veins | Tool | Same `guide-header` component on retail and TBC pages (partial) | [NC17, NC18] |
| **Against: Nintendo** | Hub / store | One template and one face, no per-game skin | [NA1, NA2] |

**Mechanism note.** The token idea holds, but the implementation varies: Blizzard ships web
components [B1], while EA moved from its own `<ea-*>` elements to a Next.js build in August 2026
[NA15].

## T2. "Which game / version?" is the first choice — strengthened

As one brand now covers several games or versions, the picker sits at the top and styles the
current context as the strongest element; on tools it also appears as a filter facet [W1, NB20].

| Platform | Type | Evidence | Sources |
|---|---|---|---|
| WoW site | Franchise | Three game logos above the masthead | [B1] |
| WoW Armory | Publisher tool | **Game Version** select incl. Burning Crusade Classic before search | [B10, B11] |
| Wowhead | Tool | Version strip, current version highlighted green | [W1] |
| Raider.IO | Tool | Retail / Forever / Classic Era / Mists strip | [RI1] |
| Riot | Franchise | Riot logo dropdown as cross-game switcher | [R1] |
| U.GG / Mobalytics | Tool | Cross-game strips | [M1, M2] |
| CurseForge | Tool | Game menu first; **Flavor** filter names Classic TBC | [NB19, NB20] |
| Tracker.gg | Tool | Cross-game strip | [NB24, NB25] |
| Blitz | Tool | Game strip | [NC20] |
| Maxroll | Tool | Left game rail; season in planner header | [NC11] |
| WoWSims | Tool | Version cards are the landing page | [NC3] |
| Icy Veins | Tool | TBC Classic section hub | [NC16] |
| Path of Exile 2 | Franchise | "Switch games" in the account bar | [NB10] |
| HoYoLAB | Publisher tool | Opens with a "choose your games" picker | [NB3] |
| Nintendo | Store | **Version** control (Switch 2) at top of game page (partial) | [NA2] |
| Ubisoft | Franchise | Series sub-menu on the AC page (partial) | [NA9] |

**Absorbed candidate:** "version / flavor as a filter" (CurseForge Flavor [NB20], Armory Game Version
select [B10], Nintendo Version control [NA2]) is the same idea expressed as a facet, so it is folded
into T2 rather than counted as a new trend.

## T3. Search promoted to primary navigation — narrowed

Search is permanent and often hinted by a shortcut **on tools, stores and publisher hubs**; most
franchise sites carry none [V2, RI1, NC20, NB13, NB9].

| Platform | Type | Evidence | Sources |
|---|---|---|---|
| Steam | Store | Search merged into single menu, suggestions before typing | [V1, V2] |
| Raider.IO | Tool | **Ctrl K** badge in the field | [RI1] |
| Blitz | Tool | "Search... Ctrl K" button | [NC20, NC21] |
| GOG GALAXY | Store | Redesigned Power Search on Ctrl/Cmd+F | [NA26] |
| Wowhead | Tool | Wide header search | [W1] |
| Epic | Store | Search + three tabs is the whole nav; improved search planned | [E1, E4] |
| Blizzard | Hub / tool | Nav carries a search URL; Armory leads with search | [B1, B10] |
| Nintendo | Hub | One box for games, hardware, news, support | [NA1] |
| Ubisoft | Hub | Search in shared nav | [NA8] |
| Lodestone | Publisher tool | Search box | [NA19] |
| HoYoLAB | Publisher tool | Central search field | [NB3] |
| CurseForge | Tool | Game-scoped search | [NB19] |
| Tracker.gg | Tool | Search is the hero, placeholder teaches the format | [NB25] |
| Maxroll | Tool | "Search Maxroll" in the bar | [NC10] |
| U.GG | Tool | Top search with region badge | [M1] |
| **None found** | | EA hub [NA13]; New World and Throne and Liberty [NB13, NB14]; Genshin and Star Rail [NB1, NB2]; Path of Exile 2 [NB9]; WoWSims [NC3, NC5] | |

Icy Veins' TBC hub showed no search input to the script; it may be an icon, so that is
*unverified* [NC16]. PlayStation's combinable search tags are an unconfirmed beta [P3].

## T4. Fewer, consolidated navigation layers — strengthened

Redesigns since 2024 remove a layer of navigation or fold one hub or client into another [V2, R8,
NA18].

| Platform | Evidence | Sources |
|---|---|---|
| Steam | Top bar and left link column merged into one menu (2025) | [V2] |
| Riot | Every Riot PC game launches through the Riot Client from 2026; one place for shared features | [R8] |
| WoW site | One home page covers news, versions, subscriptions, system requirements; change landed late Aug 2026 | [B1, B12] |
| Epic | Discover / Browse / News is the whole store nav | [E1] |
| Destiny 2 (in-game) | Portal folded back into the Director map (2026) | [U4] |
| EA | Origin retired 2025-04-17; EA app is the one client | [NA18] |
| HoYoverse | Both game sites route PC downloads to one launcher, HoYoPlay | [NB1, NB2, NB4] |
| Ubisoft | Steam test replaces the Connect client with a background service (2026) | [NA12] |
| Icy Veins | 2026 redesign curates side links and drops side panels | [NC19] |
| GOG GALAXY | "Discover" becomes the single default start view (2025) | [NA26] |
| **Against: EA web** | Two stacked nav bars on ea.com | [NA13] |

Most of the new evidence is about **launchers and clients**, not page navigation; the web-page
evidence is Steam, the WoW site, Epic and Icy Veins [V2, B1, E1, NC19].

## T5. Context and provenance printed next to the data — strengthened (strongest trend)

Numbers, items and news carry their patch, date, source or sample size inline [M1, NC17, NC21, NA24].

| Platform | Type | Evidence | Sources |
|---|---|---|---|
| U.GG | Tool | "Patch 26.19" chip; sample size on each block | [M1] |
| Blitz | Tool | Patch + rank bracket in the H1; sample size on every block | [NC21] |
| Icy Veins | Tool | Source printed with every item ("Boss — Instance"); patch chip on retail | [NC17, NC18] |
| WoWSims | Tool | Phase + status line in the sidebar; item-level badges | [NC4, NC5] |
| Maxroll | Tool | Season name and exact game build in the planner header | [NC11] |
| CurseForge | Tool | Rows print author, downloads, last update, version, compatibility count | [NB20] |
| Tracker.gg | Tool | Season time left and sample size under the search | [NB25] |
| Wowhead | Tool | Phase tag on the item; tabs with counts | [W1] |
| GOG | Store | Review count, time-zoned sale end, 30-day low, version changelog | [NA24] |
| Lodestone | Publisher tool | News type tags, local-time dates, patch-named headlines | [NA19] |
| Riot | Franchise | Category + date on every news card | [R1, R2] |
| Marathon | Franchise | Source + date on news lines | [U2] |
| Path of Exile 2 | Franchise | News stamped with date and time | [NB10] |
| Ubisoft | Franchise | News titled with update numbers | [NA9] |
| Xbox PC app | Launcher | Store badge on each game | [X2] |
| Epic | Store | Patch notes inside the store page (planned) | [E4] |
| **Against: Amazon Games** | Franchise | Home-page news cards show a category but no date | [NB13, NB14] |

**Gap worth noting:** on the same day Icy Veins' TBC BiS guide defaulted to its Phase Five tab while
WoWSims labelled its TBC sims Phase 3, and neither said which phase the live servers are in [NC5,
NC17]. Provenance that names the **target** phase but not the **live** phase still leaves the reader
guessing [NC5, NC17].

## T6. Summary band first, detail in tabs below — holds, modestly strengthened

| Platform | Evidence | Sources |
|---|---|---|
| U.GG | Tier / WR / Rank / Pick / Ban / Matches strip, then tabs | [M1] |
| Blitz | Tier / WR / WR change / Pick / Ban / Matches strip, then mode tabs | [NC21] |
| Tracker.gg | 2024 relaunch moved lifetime stats to the top and added counts to tabs (primary, dated) | [NB26] |
| Wowhead | Item header and actions, then counted tabs | [W1] |
| Icy Veins (retail) | Rating strip, then sub-nav | [NC18] |
| GOG | Title, rating, price and trust strip, then description | [NA24] |
| Xbox | Rewards "Goal Cards" put progress first | [X4] |
| Mobalytics | Call-out cards, then build tabs | [M2] |
| WoWSims (partial) | Live stats in the sidebar, detail in tabs | [NC5] |
| **Against: Maxroll planner** | Stats panel comes at the end of the page | [NC11] |

## T7. Corner radius by site type — narrowed

Session 1 read this as "game sites square, stores rounded". With 25 platforms the split is by site
type, and tools do not follow either side [R1, NA9, NA13, NC10].

| Site type | Radius seen | Sources |
|---|---|---|
| **Franchise sites: square (13 of 14)** | League 0, VALORANT 0, Marathon 0, WoW 0-2, Overwatch 2, Diablo IV 4, AC Shadows 0, Battlefield 6 0, Path of Exile 2 0, New World 0, Throne and Liberty 0, Genshin image buttons in 0 px containers | [R1, R2, U2, B1, B2, B3, NA9, NA14, NB9, NB13, NB14, NB1] |
| Franchise exception | FFXIV promo CTAs asymmetric 24 / 8 px | [NA20] |
| **Hubs and stores: rounded (all)** | Pills: blizzard.com 100 px, xbox.com 999 px, ubisoft.com 10000 px, playstation.com (judged from screenshot); small radius: Epic 10, EA 6, Nintendo 6, GOG 4-6 | [B4, X1, NA8, P1, E1, NA13, NA1, NA23] |
| **Tools: mixed, mostly small radius** | 5-8 px: Icy Veins 5, Maxroll 6-8, Blitz 8, Tracker 8-16; square: WoWSims 0, CurseForge 0, Lodestone tabs 0; rounded: HoYoLAB 14-18, Mobalytics rounded cards | [NC17, NC10, NC12, NC20, NB25, NC5, NB19, NA19, NB3, M2] |

Reading: an in-world identity goes square; a neutral shell rounds off, but only four hubs use full
pills [B4, X1, NA8, P1]. The two community tools that share Project Defeat's job most closely split:
WoWSims square, Icy Veins and Maxroll lightly rounded [NC5, NC17, NC12].

## T8. A display face for identity, a neutral sans for everything else — narrowed

Holds for every franchise site; publisher hubs and tools split between a pair and a single face [NA9,
NB13, NA1, NC20].

| Site type | Pair (display + UI) | Single face | Sources |
|---|---|---|---|
| Franchise | WoW, Diablo IV, Overwatch, League, VALORANT, Marathon, AC Shadows, Battlefield 6, FFXIV promo, New World, Path of Exile 2 (body is itself a characterful serif) | none; Throne and Liberty uses its own face for both roles (partial) | [B1-B3, R1, R2, U2, NA9, NA14, NA20, NB13, NB9, NB14] |
| Hub / store | blizzard.com, xbox.com, playstation.com, ubisoft.com, ea.com | Nintendo (Geologica), GOG (Lato GOG), Steam (Motiva Sans), Epic (Inter family) | [B4, X1, P1, NA8, NA13, NA1, NA23, V1, E1] |
| Tool | U.GG, Mobalytics, Tracker.gg, CurseForge, Wowhead (display H1), Raider.IO | WoWSims, Icy Veins, Blitz, Maxroll (game fonts only for game content), HoYoLAB (system stack) | [M1, M2, NB24, NB19, W1, RI1, NC5, NC16, NC20, NC11, NB3] |

The single-face side is now common enough to be its own trend, **T18**. Path of Exile 2 loads
**Cinzel**, the app's display face, for headings and CTAs [NB9].

## T9. Light and dark — narrowed

Session 1's "publisher marketing goes light; tools stay dark" splits in two.
- **"Tools stay dark": strengthened.** 11 of 12 player tools are dark throughout: Wowhead [W1],
  Raider.IO [RI1], U.GG [M1], Mobalytics [M2], CurseForge [NB19], Tracker.gg [NB25], WoWSims [NC5],
  Maxroll [NC10], Icy Veins [NC16], Blitz [NC20], HoYoLAB [NB3]. Icy Veins' 2026 redesign chose a
  dark scheme on purpose [NC19]. The exception is the Lodestone, which puts pale content panels in a
  dark frame [NA19].
- **"Marketing goes light": retired as a trend.** Light reading areas appear on xbox.com [X1],
  playstation.com [P1], nintendo.com [NA1], League and VALORANT [R1, R2] and the FFXIV promo's lower
  band [NA20]. But the ubisoft.com and ea.com hubs are dark [NA8, NA13], and every franchise site in
  session 2 is dark or art-led [NA9, NA14, NB1, NB2, NB9, NB13, NB14]. Light is a platform-holder
  and family-brand choice, not an industry direction [X1, P1, NA1].

## T10. Companion tools bridge into the game client — strengthened, with a direction split

| Direction | Platform | Evidence | Sources |
|---|---|---|---|
| **Game → tool (read the character out)** | WoWSims | WowSims Exporter addon makes a string for the sim's Import > Addon; "Import From Bags" | [NC9, NC5] |
| | Warcraft Logs / Archon | Uploader moved to the Archon App, which records gameplay for review | [WL4, WL5] |
| **Tool → game (send something in)** | U.GG | "Auto-Import" beside the recommended build | [M1] |
| | CurseForge | Install deep-link to the app on every row | [NB19, NB20] |
| **Overlay / companion app** | Blitz | Desktop app, overlays tab, overlay CSS mode (*unverified* beyond CSS) | [NC20, NC21] |
| | Tracker.gg | Overlay, mobile app, Twitch bot | [NB24, NB25] |
| | Icy Veins | Icy Veins app and Class Codex addon promoted | [NC18] |
| | Mobalytics | Desktop app, Build Tracker | [M2] |
| | Raider.IO | "Get App & AddOn" in the main bar (direction not established) | [RI1] |
| | Lodestone | Activity triggers Companion App notifications | [NA21] |
| | Xbox PC app | Launches games from other stores in one library | [X2] |
| | GOG | GALAXY in nav; Dreamlist and Patrons inside it | [NA23, NA26] |
| | Ubisoft | "Get Ubisoft Connect" pill on home | [NA8] |
| | HoYoverse | Downloads routed to HoYoPlay | [NB1, NB2, NB4] |

The direction matters for Project Defeat: its addon reads the character out of the game, the same
direction as WoWSims' Exporter, not U.GG's Auto-Import [A2, NC9, M1].

## T11. Speed and weight as design goals — weakened

| Side | Platform | Evidence | Sources |
|---|---|---|---|
| Supports | Epic | Launcher rebuild pitched first on 5x faster cold start | [E4] |
| Supports | WoWSims | "Download our local sim" tip to speed up runs | [NC5] |
| Counter | Maxroll | 26 iframes on a guide; planner starts ~1,000 px down | [NC11, NC12] |
| Counter | Icy Veins | 40 iframes on the TBC hub | [NC16] |
| Counter | HoYoLAB | Empty for ~4 s before content | [NB3] |
| Counter | Bungie.net | Empty shell with a spinner | [U1] |
| Counter | wowsims.com | Text empty until ~3 s | [NC3] |
| Counter | Ubisoft | First load rendered unstyled | [NA8] |

Session 1's Riot evidence ("keep game clients lightweight") rests only on a weak source and is
dropped from this trend; Riot's own FAQ gives shared features, not speed, as the reason [R3, R8].
Wowhead's June 2026 statement on performance is title-level only [W3]. Speed is a stated goal for
launchers and the open-source sim; ad-funded guide sites contradict it [E4, NC5, NC12, NC16].

## T12. Accessibility basics: about half of publishers, rare on tools — narrowed and corrected

Skip control = any link or button that skips to content. "RM" = `prefers-reduced-motion` rules found
in readable CSS (a floor). Session-1 rows use the merge-step re-probe [K1].

| Platform | Type | Skip control | RM rules found | Sources |
|---|---|---|---|---|
| blizzard.com / Overwatch / Diablo IV | Hub / franchise | **yes** (in shadow DOM; missed in session 1) | 1 each, in shadow sheets | [K1] |
| WoW site | Franchise | no | 1 in shadow sheets | [K1] |
| xbox.com | Platform holder | yes | 9 | [X1, K1] |
| playstation.com | Platform holder | yes | 0 found | [P1] |
| Epic store | Store | **yes** (not checked in session 1) | not checked | [K1] |
| nintendo.com | Hub / store | yes | 11 | [NA1, NA2] |
| ubisoft.com | Hub | yes (shadow DOM) | 0 found (*unverified*) | [NA8] |
| New World / Throne and Liberty | Franchise | yes (`<button>`) | 0 found (*unverified*) | [NB13, NB14] |
| Steam | Store | no | not checked | [K1] |
| League / VALORANT | Franchise | no | 0 found | [K1, R1, R2] |
| Marathon | Franchise | no | 2 | [K1, U2] |
| ea.com / Battlefield 6 | Hub / franchise | no | 0 (all sheets readable) | [NA13, NA14] |
| FFXIV / Lodestone | Franchise / tool | no | 0 found (*unverified*) | [NA19, NA20] |
| GOG | Store | no (web) | 0 found (*unverified*) | [NA23] |
| Genshin / Star Rail | Franchise | no | 0 found | [NB1, NB2] |
| Path of Exile 2 | Franchise | no | 0 found (*unverified*) | [NB9] |
| Wowhead | Tool | yes | 1 | [W1] |
| Icy Veins | Tool | yes on hub; none found on retail guide | 1 | [NC16, NC18] |
| Raider.IO, U.GG, Mobalytics | Tool | no | 0 found | [K1, RI1, M1] |
| CurseForge | Tool | no | 0 found (*unverified*) | [NB19] |
| Tracker.gg | Tool | no | 5 | [NB24, NB25] |
| WoWSims | Tool | no | 3 (sim), 32 (landing) | [NC1-NC3, NC5] |
| Maxroll | Tool | no | 0-1 | [NC10, NC11] |
| Blitz | Tool | no | 2 | [NC20, NC21] |
| HoYoLAB | Publisher tool | no | 0 (complete for light DOM) | [NB3] |

Counts: publishers and stores with a skip control on the page probed: Blizzard, Xbox, PlayStation,
Epic, Nintendo, Ubisoft, Amazon (7 of 15); Riot, Valve, Bungie, EA, Square Enix, GOG, HoYoverse, GGG
do not (8 of 15) [K1, X1, P1, NA1, NA8, NB13, NA13, NA19, NA23, NB1, NB9]. Community tools: Wowhead
and the Icy Veins hub (2 of 9 inspectable) [W1, NC16]. Batches A and C may also have searched only
for `<a>` skip links, so their "no" rows carry the same caveat as session 1 did [NB13].

Art-first franchise sites also skip basic semantics: HoYoverse pages have no headings and no alt text
[NB1, NB2], and Amazon's and GGG's sites leave over half their images without alt [NB13, NB9].

---

## New trends (session 2)

### T13. Freshness stamp plus a public changelog

Tools and stores say how old the data is and keep a dated log of what changed [NC12, NC17, NA21].

| Platform | Evidence | Sources |
|---|---|---|
| Icy Veins | "Last Updated" with absolute timestamp and relative age; dated changelog at the foot | [NC17] |
| Maxroll | "Last Updated" in the guide byline; dated changelog | [NC12] |
| Blitz | "Data updated 1 minute ago" under the H1 | [NC21] |
| WoWSims | Versioned releases almost daily, with notes | [NC7] |
| Lodestone | Public dated changelog of the website itself, tied to patches | [NA21] |
| GOG | Per-game "GOG Version Changelog"; GALAXY client changelog | [NA24, NA26] |
| Tracker.gg | Public changelog of a site relaunch | [NB26] |
| Counter | Blitz has no public changelog at /changelog | [NC22] |

### T14. Named presets switchable in place, by phase or stage

One page holds several named configurations, and one control swaps everything [NC5, NC12, NC17].

| Platform | Evidence | Sources |
|---|---|---|
| WoWSims | Gear Sets: Pre-Raid, Phase 1 (A/H), Phase 2 to Phase 5, plus "Save Gear Set" | [NC5] |
| Maxroll | Seven named sets on a guide; one click swaps every embedded section; Variants in the planner | [NC12, NC11] |
| Icy Veins | Phase tabs, newest first, all on one page | [NC17] |
| WoWSims (2021 build) | "P1 Preset" to "P5 Alliance Preset" buttons (background, old build) | [NC2] |

### T15. Game-concept design tokens

Design tokens named after game concepts (class, school, quality, rank, damage type, gain/loss)
rather than generic UI roles [NC5, NC21, NB25].

| Platform | Evidence | Sources |
|---|---|---|
| WoWSims | `--color-class-*`, `--color-school-*`, `--color-quality-epic`, resource, timeline, talent tokens | [NC5] |
| Blitz | Rank colors with paired text colors; `--ad` / `--ap` / `--true`; region colors | [NC21] |
| Tracker.gg | Rank tiers and `increment` / `decrement`, `good` / `bad` tokens | [NB25] |
| Icy Veins | Quality classes (`q4`) on item links | [NC17] |
| Wowhead | Item quality colors in the tooltip | [W1] |

Two of these also color every change by direction (Tracker.gg deltas, Blitz win-rate change) [NB24,
NC21].

### T16. Plain-language notes beside the numbers

A sentence that says what the numbers assume or mean, next to them [NC5, NC21, NC17].

| Platform | Evidence | Sources |
|---|---|---|
| WoWSims | Assumption note on buff inputs; "Melee Crit Cap: Under by 27.82%" on the stat list | [NC5] |
| Blitz | Generated summary paragraph restating tier, rates, sample, patch and core items | [NC21] |
| Icy Veins | Prose on set bonuses and key items under each phase's BiS table | [NC17] |

### T17. Status labels on features

Small labels that say how new or how finished a feature is [NC4, NC21, RI1].

| Platform | Evidence | Sources |
|---|---|---|
| WoWSims | Each spec labelled "Alpha" or "Gear Planner"; "Batch (New)" tab; Known Issues control | [NC4, NC5] |
| Blitz | "New" badges on mode tabs | [NC21] |
| Icy Veins | Redesign shipped as a labelled beta | [NC19] |
| Raider.IO | NEW badge on Merch Shop | [RI1] |
| U.GG / Mobalytics | "Deadlock (NEW)", "WoW Forever [New]" | [M1, M2] |
| GOG | "SOON" product labels | [NA23] |

Only WoWSims uses the label to state **accuracy maturity** (a full sim versus gear-only); the rest
mark novelty [NC4].

### T18. One neutral face for the whole UI

Stores and newer tools drop the display face and run everything in one neutral sans [NA1, NC16, NC20].

| Platform | Face | Sources |
|---|---|---|
| Nintendo | Geologica (replaced several Museo Sans cuts in late 2025) | [NA1, NA3] |
| GOG | Lato GOG | [NA23] |
| Steam | Motiva Sans | [V1] |
| Icy Veins | Inter | [NC16] |
| Blitz | Inter | [NC20] |
| WoWSims | Plus Jakarta Sans | [NC1, NC5] |
| Maxroll | Source Sans 3 (game fonts only for game content) | [NC11] |

### T19. Silent framework rebuilds

Big sites were rebuilt with no announcement that could be found, dated only from archive captures
[NA10, NA15, NA3].

| Platform | Evidence | Sources |
|---|---|---|
| Ubisoft | Next.js build appears between 2025-04-15 and 2025-05-01 | [NA10] |
| EA | `<ea-*>` custom elements replaced by Next.js between 2026-08-01 and 2026-09-02 | [NA15] |
| Nintendo | Typeface swapped between 2025-10-15 and 2025-12-01; site is Next.js | [NA3, NA1] |
| WoW site / Armory | Home-page change between 2026-08-25 and 2026-09-04; Classic Armory by 2026-08-27 | [B12, B11] |

Next.js also runs League, VALORANT, Marathon and Nintendo [R1, R2, U2, NA1]. This is an industry
fact more than a design pattern; it matters to this research mainly because undated changes make
"since 2024" claims harder to pin down [NA10, NA15].

---

## Patterns seen on two platforms but not promoted (low relevance to a planner)

- **Live community activity on the home page**: Path of Exile 2 livestreams with viewer counts
  [NB10]; Raider.IO streams [RI1].
- **Account-linking as a content block**: Throne and Liberty "Amazon Games iD" rewards [NB14];
  Tracker.gg sign-in with Riot ID [NB25].
- **Borrowed Wowhead tooltips**: WoWSims and Icy Veins both load Wowhead's tooltip script [NC5, NC17].

## Observations (one platform only, not trends)

- **Measured content width from usage data**: Steam chose 1200 px because most players run windowed
  [V3, V4].
- **Same content in several shells** (desktop, overlay, handheld) for Steam [V5] and Xbox [X4]: a
  launcher pattern with no web-planner analogue.
- **Spatial map over category list** (Destiny 2 Director), in-game only [U4].
- **Ornate frames drawn with CSS `border-image`** around live text (Path of Exile 2) [NB9].
- **Guide built from the planner's own sections** (Maxroll) [NC12].
- **Per-section notes** in a planner (Maxroll) [NC11].
- **Explicit deprecation with a data-migration path** (old WoWSims) [NC2].
- **Container-query components** (Blitz, Tracker.gg) [NC21, NB25]; recorded as an engineering signal,
  not a visible design trend.
