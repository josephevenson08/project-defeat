# Sources

Every source used, with its date and what it supported. "Seen" sources are live pages I opened on
**2026-10-01** in a browser (computed styles read by script, plus screenshots); their date is the
date I looked. Article dates are the publication dates shown on the page when it loaded, or, where
marked, the date in the URL. Status notes say when a page did not load fully.

## Live pages (seen 2026-10-01)

| ID | Page | Used for |
|---|---|---|
| B1 | https://worldofwarcraft.blizzard.com/en-us/ | WoW site structure, `blz-*` elements, fonts, buttons, version switcher |
| B2 | https://overwatch.blizzard.com/en-us/ | Overwatch fonts, buttons, title |
| B3 | https://diablo4.blizzard.com/en-us/ | Diablo IV fonts, buttons, components |
| B4 | https://www.blizzard.com/en-us/ | Publisher hub: pill buttons, game grid, fonts |
| B10 | https://worldofwarcraft.blizzard.com/en-us/worldsoul/us/armory | Armory controls and Game Version options |
| R1 | https://www.leagueoflegends.com/en-us/ | League template, fonts, buttons, news cards |
| R2 | https://playvalorant.com/en-us/ | VALORANT template, fonts, buttons |
| V1 | https://store.steampowered.com/ | Single store menu with search, Motiva Sans, max widths |
| E1 | https://store.epicgames.com/en-US/ | Store nav, Inter, button radius |
| X1 | https://www.xbox.com/en-US (redirected to `/en-US/home_alt/light/home`) | Fonts, pill CTA, skip link, reduced-motion and color-scheme rules |
| P1 | https://www.playstation.com/en-us/ | SST, skip link, per-banner theme classes, campaign tokens |
| U1 | https://www.bungie.net/7/en/Destiny (from destinythegame.com) | **Empty shell**: spinner only |
| U2 | https://www.marathonthegame.com/ | Marathon fonts, button, news lines, reduced-motion rules (hero not seen) |
| W1 | https://www.wowhead.com/tbc/item=28830/dragonspine-trophy | Version strip, hub tiles, item page, tabs with counts, tooltip, a11y |
| RI1 | https://raider.io/ | Version strip, Ctrl K search, nav, fonts |
| WL1 | https://www.warcraftlogs.com/ and https://www.archon.gg/wow | **Blocked** by a human-verification page; not bypassed |
| M1 | https://u.gg/lol/champions/ahri/build | Cross-game strip, patch chip, stat strip, sample sizes, Auto-Import, fonts |
| M2 | https://mobalytics.gg/ and https://mobalytics.gg/diablo-4/builds | Shell, cross-game tabs, fonts |
| A1 | https://josephevenson08.github.io/project-defeat/ | The app as deployed: front door, wizard, planner shell |
| A2 | Repo files `src/styles/*`, `src/components/*`, `src/lib/animations.ts`, `src/features/tierlists/TierListsPanel.tsx`, `src/features/bis/BisPanel.tsx`, `index.html` (read 2026-10-01) | Current tokens, fonts, shell, a11y, provenance |

## Articles and announcements

| ID | Date | Source | Used for | Status |
|---|---|---|---|---|
| B5 | 2021-01-15 | Engadget, "Blizzard's Battle.net launcher is getting a much-needed redesign", https://www.engadget.com/battle-net-client-blizzard-front-end-upgrade-redesign-101045426.html | Background: last dated Battle.net app overhaul | Loaded |
| B6 | 2019-11-01 | MMO-Champion, "New Battle.net App Beta", https://www.mmo-champion.com/content/8810-New-Battle-net-App-Beta (Blizzard's own post https://news.blizzard.com/en-us/article/23189672/new-battle-net-app-beta showed no date) | Background: 2019 beta | Loaded |
| B7 | 2026-02-04 | Insider Gaming, "Overwatch Drops '2'...", https://insider-gaming.com/overwatch-2-to-be-renamed-overwatch-with-next-update/ (also Nintendo Soup, same date, https://nintendosoup.com/overwatch-2-renamed-to-just-overwatch-coming-to-switch-2-spring-2026/) | Overwatch rename | Loaded |
| B8 | 2026-08-31 | Aroged, "Blizzard updates official World of Warcraft website ahead of BlizzCon 2026", https://www.aroged.com/2026/08/31/blizzard-updates-official-world-of-warcraft-website-ahead-of-blizzcon-2026/ | WoW site refresh | Loaded |
| B9 | 2026-08-29 | Bolverk Games, "WoW Armory Finally Adds Classic, TBC and Mists of Pandaria Support", https://bolverkgames.com/wow/wow-armory-finally-adds-classic-tbc-and-mists-of-pandaria-support/ | Classic Armory, unannounced release | Loaded |
| R3 | 2026-04-11 | spilled.gg, "Riot Games confirms League of Legends launcher change is an intentional test...", https://spilled.gg/riot-games-league-legends-launcher-change-test-client-overhaul/ | Riot Client as hub | Loaded |
| R4 | 2025-12-18 (URL date) | Bloomberg, "Riot Has a Secret Plan to Remake Its 'League of Legends' Game", https://www.bloomberg.com/news/articles/2025-12-18/riot-has-a-secret-plan-to-remake-its-league-of-legends-game | League Next exists, timing | **Not opened** (paywall); title and URL date only |
| R5 | 2025-12-19 (URL date) | BigGo Finance, "Riot Games Announces 'League Next'...", https://finance.biggo.com/news/202512192220_League-of-Legends-League-Next-Overhaul-2027 | League Next: new client, 2027 target | **Not opened**; search-result summary only |
| V2 | 2025-07-26 | GamingOnLinux, "Valve reveal new Steam store menu and enhanced search, now in Beta", https://www.gamingonlinux.com/2025/07/valve-reveal-new-steam-store-menu-and-enhanced-search-now-in-beta/ | Merged menu, search suggestions, Valve aim | Loaded |
| V3 | 2025-11-07 | GamingOnLinux, "Steam's wider store page refresh is live...", https://www.gamingonlinux.com/2025/11/steams-wider-store-page-refresh-is-live-with-plans-to-improve-the-home-page-on-the-way/ | 1200 px pages, theater mode, home page later | Loaded |
| V4 | 2025-11-11 | HotHardware, "Steam Store Gets A Redesign With Wider Pages...", https://hothardware.com/news/steam-store-redesign-with-wider-pages | Valve's reasoning for 1200 px | Loaded |
| V5 | 2026-09-10 | PCGamesN, "Steam beta update brings UI overhaul to Steam Deck and Steam Machine", https://www.pcgamesn.com/steam/big-picture-mode-beta-update-2026 | Big Art Mode, screensaver, calendar | Loaded |
| V6 | 2023-06-14 | Engadget, "Steam overhauls notifications, UI elements and the in-game overlay", https://www.engadget.com/steam-overhauls-notifications-ui-elements-and-the-in-game-overlay-000839366.html | Background: overlay, notes, shared codebase | Loaded |
| E2 | 2026-06-19 | Tbreak, "Epic Games Launcher V2 is a ground-up rebuild that boots 5x faster", https://tbreak.com/epic-games-launcher-v2-faster-rebuild/ | Launcher V2 claims and planned features | Loaded |
| X2 | 2025-06-23 | Xbox Wire, "Xbox Insiders: Aggregated Gaming Library is coming to the Xbox PC app", https://news.xbox.com/en-us/2025/06/23/xbox-insiders-aggregated-gaming-library-is-coming-to-the-xbox-pc-app/ | Aggregated library, store badges | Loaded |
| X4 | 2025-09-29 | Xbox Wire, "Xbox September Update", https://news.xbox.com/en-us/2025/09/29/xbox-september-update-2025/ | My apps, Game Bar widgets, Rewards hub, Ally launch 16 Oct | Loaded |
| P2 | 2026-02-06 | PlayStation LifeStyle, "PS Store Finally Gets Feature Inexplicably Removed Years Ago", https://www.playstationlifestyle.net/2026/02/06/ps-store-feature-web-version-images-return/ | Web store screenshots restored | Loaded |
| P3 | 2026-04-12 | Push Square, "PS5's PS Store Is Getting a Netflix-Style Makeover Soon", https://www.pushsquare.com/news/2026/04/ps5s-ps-store-is-getting-a-netflix-style-makeover-soon | Beta store layout, tags (unconfirmed by Sony) | Loaded |
| U3 | 2025-04-28 (updated 2025-05-19) | Brace Design, "Bungie's Marathon: An Eye for Design", https://www.brace.design/single-post/bungie-s-marathon-an-eye-for-design | Marathon visual language | Loaded |
| U4 | 2026-06-19 | Shacknews, "Unpacking Destiny 2's final update and what comes next", https://www.shacknews.com/article/149684/destiny-2-the-final-update-panel-june-2026 | Director / Portal change | Loaded |
| U5 | 2026-09-21 | Game Informer, "Bungie Announces Plans To Restore Vaulted Destiny 2 Content...", https://gameinformer.com/2026/09/21/bungie-announces-plans-to-restore-vaulted-destiny-2-content-and-substantial-reworks-to | Bungie status; no UI details | Loaded |
| W2 | 2026-07-09 | Wowhead, "New Features on Wowhead: News Filters, Pinned Pages & More", https://www.wowhead.com/news/new-features-on-wowhead-news-filters-pinned-pages-and-more-382068 | News filters, pinned pages | Date and title loaded; **body did not** |
| W3 | 2026-06-24 | Wowhead, "[Updated] Wowhead in 2026 and Beyond - AI, Ads, and Performance Issues", https://www.wowhead.com/news/wowhead-in-2026-and-beyond-ai-ads-and-performance-issues-381993 | Statement on AI, ads, performance | Date and title loaded; **body did not** |
| W5 | 2010-05-07 | Wowhead, "Find Upgrades Button Now on Item Pages", https://www.wowhead.com/news/find-upgrades-button-now-on-item-pages-155492 | Background: age of the Find upgrades button | Date loaded |
| W4 | 2019-10-30 | Wowhead, "Upcoming Site Navigation Improvements - Design Preview", https://www.wowhead.com/news/upcoming-site-navigation-improvements-design-preview-295903 | Background only | Date loaded; body did not |
| WL2 | 2026-06-07 | Master of Warcraft, "Warcraft Logs Is Moving to Archon...", https://www.masterofwarcraft.net/2026/06/warcraft-logs-archon-app-june-29.html | Archon app, Lite mode, June 29 cutover | Loaded |
| WL3 | 2023-10-03 | Wowhead, "Introducing Archon - Warcraft Logs Parent Company Rebranded", https://www.wowhead.com/news/introducing-archon-warcraft-logs-parent-company-rebranded-335303 | Background: rebrand date | Date loaded; body did not |

## Tried and failed (not used as evidence)

| Date tried | URL | Result |
|---|---|---|
| 2026-10-01 | https://www.sheepesports.com/en/all/articles/lol-riot-begins-work-on-league-next-a-complete-modernization-set-for-2027/en | HTTP 403 |
| 2026-10-01 | https://www.gamespot.com/articles/league-of-legends-in-line-for-major-overhaul-here-are-all-of-the-changes-so-far/1100-6537097/ | HTTP 403 |
| 2026-10-01 | https://www.gamespot.com/articles/new-battlenet-app-launches-in-beta/1100-6471129/ | HTTP 403 |
| 2026-10-01 | https://medium.com/riot-games-ux-design/7-lessons-we-learned-while-building-a-modular-web-design-platform-5d867c81c9dd | HTTP 403 (cited in riot.md as undated background) |
| 2026-10-01 | https://hitmarker.net/news/league-of-legends-to-receive-a-total-overhaul-in-2027-riot-games-announces-1602724 | Loaded, no date; not cited |
| 2026-10-01 | https://techraptor.net/gaming/news/steam-store-refresh-2026 | HTTP 403 |
| 2026-10-01 | https://www.neowin.net/news/valve-is-redesigning-the-steam-store-menu-and-search-wants-user-feedback/ | HTTP 403 |
| 2026-10-01 | PC Gamer and two Tom's Hardware articles on Epic Launcher V2 | Only site chrome loaded |
| 2026-10-01 | Neowin and Guru3D on Epic launcher; https://www.unrealengine.com/news/state-of-unreal-2026-top-news-from-the-show | HTTP 403 |
| 2026-10-01 | https://videocardz.com/newz/microsoft-shows-new-unified-xbox-ui-direction-across-devices and https://videocardz.com/newz/overwatch-2-is-now-just-overwatch | HTTP 402 |
| 2026-10-01 | https://esports.gg/news/overwatch/overwatch-drops-the-2-in-major-franchise-turning-point/ | HTTP 403 |
| 2026-10-01 | https://www.creativebloq.com/3d/video-game-design/bungies-art-director-explains-marathons-controversial-art-style | Only site chrome loaded |
| 2026-10-01 | https://www.bungie.net/7/en/News/article/d2_may_21_2026 | Header only (client-rendered) |
| 2026-10-01 | https://fresh.warcraftlogs.com/ | HTTP 403 |
| 2026-10-01 | https://www.archon.gg/fellowship/articles/news/introducing-archon | HTTP 403 |
| 2026-10-01 | https://www.icy-veins.com/wow-classic/news/blizzard-quietly-added-an-armory-to-classic-wow-before-blizzcon/ | HTTP 403 |
