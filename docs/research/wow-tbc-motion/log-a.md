# Research log, question A (TBC look, motion, and TBC Anniversary)

- Date: 2026-10-04. Researcher: Claude (subagent), following the citation and honesty rules in `.claude/agents/gaming-ui-researcher.md`.
- Tools: WebSearch and WebFetch (text fetch, summarised by a small model). No browser was used, by instruction, so nothing here was "seen" on a rendered page; every web claim is "reported by source".
- No images were downloaded or embedded. Blizzard art is described from text only, and I did not view the Anniversary key art.
- Scope decision: Warcraft Wiki is community-edited, so it is tiered Weak even though it is the most detailed source on zone and raid look. Claims resting on it alone are labelled *(weak only)* in `identity.md`.
- Scope decision: WebFetch output is a model summary. Where a summary added generic "colour palette" lists not tied to page text (Outland, Draenei, Naaru, Aldor, Scryers), I did not use those lists.
- Read first: `docs/design/prototypes/round4/motion-3d-portal.html` (grep only) to see what it already does: water plane shader, octahedron crystal with orbiting shards and halo, additive particles, fog, GSAP timelines and ScrollTrigger scrubs, and its own palette tokens.

## Queries and fetches

| # | Query or URL | Result | Decision |
|---|---|---|---|
| Q1 | search: Burning Crusade Classic Anniversary realms launch date announcement | 9 results (Blizzard Watch, Wowhead, Massively OP, Game Rant, wiki, Blizzard News) | Followed Blizzard News, Wowhead, Blizzard Watch |
| Q2 | fetch news.blizzard.com 24242436 (pre-patch title) | Loaded | Accepted as TA1 |
| Q3 | fetch Wowhead 379872 | Loaded header and date | Accepted as TA8 (date only) |
| Q4 | fetch blizzardwatch.com/tag/wow-classic-anniversary-realms/ | Loaded listing | Used only to find leads; dropped as TA12 once TA7 loaded |
| Q5 | search: news.blizzard.com ... Serpentshrine Tempest Keep Phase 2 now live | Warcraft Tavern, Icy Veins, Massively OP, boost-seller guides | Fan/commercial; followed Warcraft Tavern only as backup |
| Q6 | search: Blizzard announces Burning Crusade Classic Anniversary Edition 2025 trailer | Wowhead trailer post, Blizzard News, MMO-Champion, GameSpace, YouTube | Search summary said "February 5, 2025" (wrong year); ignored the snippet, used dated pages |
| Q7 | fetch Wowhead 380282 (trailer) | Shell: header only | Accepted as TA15 for title only |
| Q8 | fetch worldofwarcraft.blizzard.com/en-us/news/24242436 | Loaded | Accepted as TA2; its vague "visual themes" paragraph not used |
| Q9 | fetch MMO-Champion 13995 | Loaded; mostly comments | Accepted as TA16, Weak |
| Q10 | search (Blizzard domains only): "Overlords of Outland" ... Serpentshrine | Blizzard pages for 2021 BCC and 2026 Anniversary | Took only the 2026 Anniversary pages; 2021 BCC pages rejected as a different release |
| Q11 | fetch worldofwarcraft.blizzard.com/en-us/news/24276751 | Loaded | Accepted as TA3 |
| Q12 | fetch news.blizzard.com 24272608 | Loaded | Accepted as TA4 |
| Q13 | search: Burning Crusade login screen Dark Portal animated glue screen Illidan statue | Icy Veins, PCGamesN, wikis, Engadget, Blizzard forum | Followed PCGamesN, wikis, Engadget; forum rejected |
| Q14 | fetch warcraft.wiki.gg/wiki/Login_screen | Loaded; no animation detail | Accepted as TA19, Weak |
| Q15 | fetch PCGamesN login housing article | Loaded | Accepted as TA20 |
| Q16 | fetch warcraft.wiki.gg The_Dark_Portal_(cinematic) | Loaded | Accepted as TA21, Weak |
| Q17 | fetch wiki Netherstorm; wiki Outland | Loaded both | TA24, TA23 accepted; Outland palette list not used |
| Q18 | search: Burning Crusade art direction Outland sky interview artist retrospective | Artbook pages, ArtStation, Dexerto, concept-art sites | No artist interview found; rejected (concept-art hosting, no claims needed) |
| Q19 | fetch Wikipedia TBC; search: Wowhead Serpentshrine Cavern raid guide overview | Wikipedia loaded; SSC results mostly boost-seller guides | TA45 accepted (Weak); boost sellers rejected as commercial SEO |
| Q20 | fetch wiki Coilfang_Reservoir; wiki Serpentshrine_Cavern | Loaded | TA28, TA29 |
| Q21 | fetch wiki The_Eye (disambiguation, no content); wiki Tempest_Keep | First failed (disambiguation); second loaded | TA26 accepted |
| Q22 | fetch wiki The_Eye_(Tempest_Keep); search: Kael'thas gravity lapse phase 5 shock barrier | Wiki loaded; search gave guides | TA27 accepted; followed Warcraft Tavern guide |
| Q23 | fetch Warcraft Tavern Kael'thas guide; Warcraft Tavern Phase 2 live | Loaded | TA34, TA13 (Weak) |
| Q24 | search: Phase 3 Black Temple Hyjal now live August 2026; then (Blizzard, Blizzard Watch, Wowhead only) BCC Anniversary Black Temple | First: fan/commercial; second: Blizzard News, Wowhead, Blizzard Watch | Used the second set: TA5, TA6, TA7 |
| Q25 | search: TBC Anniversary pre-patch new login screen; fetch wiki Naaru | No login-screen source; wiki loaded | Gap logged; TA36 accepted (per-naaru colours not used) |
| Q26 | search (reputable domains): naaru A'dal appearance chiming; fetch Icy Veins Anniversary overview | Found A'dal quest text; Icy Veins returned 403 | Icy Veins failure logged |
| Q27 | fetch Wowhead TBC quest 10210 (A'dal); Blizzard Watch "Cycle of the Naaru" (2017) | Quest loaded; KYL had no visual description | TA35 accepted as Primary text; KYL rejected (no relevant content) |
| Q28 | fetch wiki Hellfire_Peninsula, Fel, Blood_elf | Loaded | TA37, TA38, TA39 |
| Q29 | fetch wiki Scryers, Aldor | Loaded; colour statements unsupported by quoted text | TA41, TA42 accepted for non-colour facts; colours marked unverified |
| Q30 | search: TBC logo design green fel flame lettering; fetch Engadget KYL Dark Portal (2014) | Logo results are logo aggregators and PNG sites; Engadget had no visual description | Took Logos-World only; PNG/Pinterest/Steam rejected; Engadget TA46 kept for a single narrow point |
| Q31 | fetch logos-world.net WoW logo; search: WoW Classic tooltip default dark blue background grey border | Logos-World loaded; tooltip search only gave addon pages | TA43 (Weak); addon pages rejected (they describe add-ons, not default UI) |
| Q32 | fetch raw.githubusercontent Gethe/wow-ui-source classic_era tooltip file; search "TOOLTIP_DEFAULT_BACKGROUND_COLOR"; `gh` via Bash; fetch the repo page | 404; search irrelevant; `gh` not installed; repo page only lists live/ptr/beta branches | Gave up; tooltip colours left *unverified* |
| Q33 | fetch wiki Quality; wiki Twisting_Nether | Loaded | TA44, TA25 |
| Q34 | search: Anniversary key art launcher wallpaper; search: PC Gamer TBC retrospective Outland skies | Wallpaper sites, wiki, Battle.net shop; zone-ranking blogs | Wallpaper sites and blogs rejected (weak, no editorial standard); shop page followed |
| Q35 | fetch us.shop.battle.net Dark Portal Pack; fetch wiki BCC Anniversary Edition | Shop redirected to a Battle.net sign-in (OAuth) page; not followed. Wiki loaded | Shop contents left *unverified*; TA18 accepted |
| Q36 | search: Blizzard announces Burning Crusade coming to Classic Anniversary realms 2025; fetch Blizzard Watch 25 Nov 2025 and 7 Jan 2026 | Loaded | TA10, TA9 |
| Q37 | search (reputable domains): anniversary realms announced 2025; fetch Blizzard Watch 21 Nov 2024; Wowhead 382650 | Loaded | TA11 (background), TA6 |
| Q38 | fetch YouTube gKw5lbapjvI; fetch Massively OP 5 Feb 2026 | YouTube: footer only; Massively OP: 403 | Both failed; not used |
| Q39 | fetch GameSpace trailer article; fetch Icy Veins housing article | GameSpace loaded; Icy Veins 403 | TA17 (Weak); its long quote not reproduced |
| Q40 | fetch wiki Dark_Portal, Draenei | Loaded | TA22, TA40 (palette section not used) |
| Q41 | fetch wiki Lady_Vashj_(tactics), Al'ar | Loaded | TA31, TA32 |
| Q42 | search (Wowhead only): SSC guide; fetch Wowhead SSC overview and Hydross guide | Both guides loaded as shells | Rejected (TA47 noted, no claims) |
| Q43 | fetch wiki Hydross_the_Unstable, High_Astromancer_Solarian | Loaded | TA30, TA33 |
| Q44 | grep `round4/motion-3d-portal.html` | Read palette tokens and Three.js/GSAP calls | Used for the item-colour observation in 1.6 |
| Q45 | fetch Warcraft Tavern Phase 2 arrives; Blizzard Watch Phase 3 live | Loaded | TA14, TA7 |

## Failures summary

- 403: Icy Veins (two pages), Massively OP. Shell or empty: Wowhead trailer post body, Wowhead SSC and Hydross guides, YouTube trailer page. Disambiguation: wiki "The_Eye". 404: GitHub raw tooltip file. Not installed: `gh`. Sign-in wall: Battle.net shop (redirect not followed).
- Not found anywhere: an Anniversary-specific login screen or launcher art description; an artist interview on Outland skies; the Eye's skybox; default tooltip colours; the TBC logo typeface; faction tabard colours.

## Recheck (2026-10-04)

What I checked, and what I changed:

1. **IDs resolve.** Script-compared every `TA` ID used in `identity.md` with the IDs defined in `sources-a.md`: 45 used, 45 defined, no orphans either way. TA12 and TA47 are listed only as rejected and are not cited.
2. **Every factual line cited.** Script-listed bullets in `identity.md` without a TA ID; none remain apart from lines labelled Interpretation, Observation or *unverified*.
3. **Tiers.** Blizzard pages and in-game quest text are Primary (6: TA1 to TA5, TA35). Blizzard Watch, Wowhead News, PCGamesN, Engadget are Reputable secondary (9). Warcraft Wiki, Wikipedia, Warcraft Tavern, MMO-Champion, GameSpace, Logos-World are Weak (30). Every claim that rests only on Weak sources carries *(weak only)* (66 lines); nothing in this file is a trend or recommendation, so no weak-only claim is used as sole support for one.
4. **Changes made in recheck:** split the login-screen line so the 2007 to 2008 run dates (wiki only) are labelled weak; reworded the Phase 2 announcement line so its mid-April date is credited to the weak fan site, not to Blizzard; fixed two log cross-references (tooltip now Q31 and Q32, shop now Q35).
5. **Dates and currency.** Section 0 states that Phase 2 (14 May 2026) was superseded by Phase 3 (27 August 2026). The 2024 Blizzard Watch item and the 2014 Engadget item are labelled background. The TBC-era login screen is described as 2007 to 2008 history, not as current Anniversary art. Future phases (3.5, 4) are marked *unverified*. One search summary gave the launch year as 2025; that was ignored and the dated pages (2026) were used.
6. **Quotes.** Script-checked quoted strings in `identity.md`: none is 8 words or longer; the longest is 5 words. GameSpace's long description of the trailer was paraphrased, not quoted.
7. **No images.** No files downloaded; Blizzard art is described from text only, and I state that I did not view the key art.
8. **Counts.** 45 sources cited (6 Primary, 9 Reputable secondary, 30 Weak), 2 rejected and listed, about 15 more rejected in the query table (boost sellers, wallpaper and PNG sites, addon pages, forum threads, 2021 BCC pages). 13 items marked *unverified*. 0 claims dropped after recheck; 2 re-labelled.

## Lead verification (2026-10-04)

The Phase 3 finding was checked independently because it affects the whole app, not only the animation.
Blizzard's own page for TA5 loaded with the title "BCC Anniversary Edition: Black Temple Now Live", and
Blizzard Watch (TA7) loaded with the Phase 3 article. Phase 3 (Black Temple, Mount Hyjal) is the live phase
on Anniversary realms as of 2026-10-04. TA5 is now a loaded Primary source, not a search result.

