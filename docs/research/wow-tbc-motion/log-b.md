# Research log, track B (usage rules, techniques, prior art)

Researcher: track B agent. Date: 2026-10-04. Rules followed: `.claude/agents/gaming-ui-researcher.md`
(tiers, one source ID per factual sentence, weak never sole support, quotes under 15 words).
Tools: WebSearch, WebFetch, and curl from a shell for raw HTML/CSS/JS and HTTP status checks.
No browser tools (per brief). Files written only in `docs/research/wow-tbc-motion/`:
`usage-rules.md`, `techniques.md`, `prior-art.md`, `sources-b.md`, `log-b.md`. Track A's files
(`identity.md`, `sources-a.md`, `log-a.md`) were not opened for editing.

## Local reading first

- `.claude/agents/gaming-ui-researcher.md`: citation and honesty rules.
- `docs/features.md` lines 98-104 and 125-141: icons vendored (1,972 files), icon names from a
  pinned WoWSims commit, zone maps credited "under the Game Content Usage Rules".
- `src/domain/professions/zoneMaps.json` line 3: the attribution string.
- `docs/design/prototypes/round4/motion-3d-portal.html` lines 383-520 and 660-730: GSAP 3.12.5
  plus ScrollTrigger/Flip/TextPlugin from cdnjs, three r128 from cdnjs; scene and motion layer.

## Queries and fetches

| # | Query or URL | Result | Decision |
|---|---|---|---|
| Q1 | search: Blizzard Game Content Usage Rules legal | Blizzard legal pages (video, API, website terms, FAQ, EULA), 80.lv, a law-firm blog, wowwiki archive | Fetched the Blizzard pages; rejected 80.lv, law blog, wowwiki (secondary/weak and not needed) |
| Q2 | search: Blizzard fan site kit policy WoW trademark logo guidelines | Trademark guidelines, Wowpedia fansite kit, designyourway, MMO-Champion | Accepted guidelines (TB1); Wowpedia kept as weak background (TB9); rejected designyourway (SEO) and forum |
| F1 | TB1 trademark guidelines | loaded; then curl for exact credit-line text | Accepted, Primary. Page undated |
| F2 | Legal FAQ at a mistyped UUID | timeout | Failure: my URL error. Retried with the URL from Q1 |
| F3 | TB2 Legal FAQ | loaded | Accepted, Primary. Undated |
| Q3 | search: Blizzard "Game Content Usage Rules" Microsoft fan | Xbox Wire 2015, xbox.com rules, Harvard JOLT paper, forums | Fetched xbox.com rules (TB8); rejected forums; JOLT paper noted but not needed |
| F4 | TB8 xbox.com/en-US/developers/rules | loaded; curl confirmed "Last Updated: January 2015" and the Microsoft Studios scope sentence | Accepted, Primary. Key finding: scope does not name Blizzard |
| F5 | TB3 copyright notices | loaded | Accepted |
| F6 | TB6 Developer API terms (twice, two prompts) | loaded | Accepted; relevant only if the app calls Blizzard APIs |
| F7 | TB4 website terms | loaded | Accepted; revised 2018-09-26 |
| F8 | TB5 EULA | loaded | Accepted; updated 2024-03-21 |
| F9 | blizzard.com/en-us/legal index | header only (JS-rendered) | Failure; could not list all policies |
| Q4 | search: Blizzard Video Policy updated 2024 OR 2025 | Video policy, forums, TechCrunch (Twitch) | Fetched TB7; rejected forums and off-topic results |
| F10 | TB7 video policy | loaded | Accepted; undated |
| Q5 | search: blizzard.com legal "fan site" policy ... | Trademark guidelines (alt URL TB1a), FAQ, video, EULA, Wikipedia | Accepted TB1a as confirmation; **no standalone fan site policy found** |
| F11 | TB9 Wowpedia Fansite kit | HTTP 402 | Failure; weak snippet only, used as background marked *unverified* |
| Q6 | search: GSAP free all plugins Webflow 2025 license DrawSVG SplitText | gsap.com 3.13 blog, CSS-Tricks, Medium, SEO sites | Accepted only gsap.com (TB10, TB11); rejected CSS-Tricks/Medium/SEO as unnecessary once primaries loaded |
| F12 | TB10 gsap.com/blog/3-13 | loaded; 2025-04-29 | Accepted |
| F13 | TB11 gsap.com/standard-license | loaded; effective 2025-04-30, modified 2025-05-30 | Accepted |
| F14 | TB12 cdnjs.com/libraries/gsap + api.cdnjs.com + HTTP HEAD-style checks | latest 3.15.0; DrawSVG 200 at 3.13.0/3.15.0, 404 at 3.12.5 | Accepted. Key finding for the prototype |
| F15 | TB15 jsDelivr three@0.128.0 examples/js files | all HTTP 200; UnrealBloomPass header read | Accepted |
| F16 | TB18 api.cdnjs.com three.js r128 files | four core builds only | Accepted |
| F17 | TB24 MDN prefers-reduced-transparency | loaded | Accepted |
| F18 | TB27, TB28, TB29 WCAG 2.2 Understanding pages | loaded | Accepted |
| F19 | TB14 gsap.matchMedia docs; TB13 DrawSVG docs | loaded | Accepted |
| F20 | TB19 Book of Shaders ch. 13 | loaded | Accepted, Reputable secondary |
| F21 | iquilezles.org/articles/warp (WebFetch) | 404, then 301 loop | Failure via WebFetch; curl with a browser UA returned 200 and the text (TB20) |
| F22 | TB21 GPU Gems 3 ch. 13 | loaded | Accepted |
| F23 | threejs.org/manual/en/responsive.html (WebFetch and curl) | 404 / JS shell | Failure; manual has moved. Used threejsfundamentals source markdown (TB23) instead |
| Q7 | search: three.js manual responsive devicePixelRatio | forum threads, GitHub issues | Rejected (forums, weak); kept looking for the manual text |
| F24 | TB17 three.js r128 docs (raw GitHub) | 200; powerPreference and setPixelRatio text read | Accepted |
| F25 | TB16 GodRaysShader.js r128; TB15b example pages | 200 | Accepted (examples only checked for existence) |
| F26 | TB22 madebyevan.com/webgl-water | loaded | Accepted. Companion Medium article 403, not used |
| F27 | TB25 MDN deviceMemory; TB26 web.dev reduced motion | loaded; author Thomas Steiner seen in page source | Accepted |
| F28 | TB30 MDN browser-compat-data media.json | parsed with Python | Accepted |
| F29 | TB31 NN/g animation article | loaded | Accepted |
| F30 | TB42 three.js r128 PolyhedronGeometry.js | grep showed "build non-indexed geometry" | Accepted (supports a code comment) |
| F31 | curl: wowhead.com/tbc, raider.io, warcraft.wiki.gg, wowsims.github.io/tbc, icy-veins.com/tbc-classic, worldofwarcraft.blizzard.com (home, /wowclassic, /character/us/), fresh.warcraftlogs.com | wowhead 403; wowclassic and armory 404; WCL 3 KB shell; others 200 | Used TB32-TB36; logged failures |
| F32 | linked CSS for the 200 pages; keyframe and reduced-motion counts | see `sources-b.md` | Accepted as "seen in source" |
| F33 | WebFetch wowhead.com/tbc | header only | Failure; Wowhead excluded from B3 |
| Q8 | search: Burning Crusade Classic Anniversary official site | Blizzard news posts, wiki, store articles | Used one Blizzard news URL (TB38, partial). Other facts in the snippet (release date etc.) belong to track A and were not used |
| Q9 | search: Wowhead site redesign new layout 2025 | Wowhead news posts 2019, forum thread | Fetched two posts (TB40): 2019 and body empty. Rejected as evidence |
| Q10 | search: warcraft.wiki.gg Wowpedia move 2023 | Wowpedia forum (402 on fetch), Wikipedia, MMO-Champion, GameRifts, wiki.gg Forum:Ads | Accepted Forum:Ads (TB37) as dated background; others weak (TB41), used once and marked *unverified* |
| F34 | Raider.IO via WebFetch | title only | Failure; curl result (TB32) used instead |
| F35 | jsDelivr UnrealBloomPass.js / EffectComposer.js tails | `THREE.UnrealBloomPass =`, `THREE.EffectComposer =`, `THREE.Pass =` assignments; constructor signature (resolution, strength, radius, threshold) | Confirms the load order and the sketch's arguments in techniques.md section 6 |

## Key findings worth flagging

1. The app's map credit cites "the Game Content Usage Rules", which is Microsoft's policy, scoped
   to Microsoft Studios games and not naming Blizzard (TB8). Suggested rewording in
   `usage-rules.md` section 1.
2. No current standalone Blizzard fan site policy was found, although the trademark guidelines
   refer to one (TB1). Logo use therefore has no located grant; recommendation is no logos.
3. The prototype's GSAP 3.12.5 cannot load DrawSVG from cdnjs (404); 3.13.0+ can (TB12), and the
   plugin is free under the Standard License (TB10, TB11).

## Recheck (2026-10-04, end of session)

What I checked:

- **Every cited ID exists.** Grepped all `TB` IDs in the three content files against
  `sources-b.md`: 42 distinct IDs cited, all defined. TB9 and TB40 are defined but not cited (logged as
  rejected/background).
- **Every factual sentence has an ID.** Re-read `usage-rules.md` and the opening of
  `techniques.md` line by line. Changes made:
  - Removed an unsourced aside that Microsoft's 2015 rules predate its ownership of Blizzard (no
    source loaded for the acquisition date).
  - Removed an unsourced sentence that GSAP is "not open-source" (only weak sources said it).
  - Corrected a fBm cost figure: two-level warping is five fBm calls per TB20, not fifteen.
  - Reworded the icon provenance line: `docs/features.md` says the icon *names* come from WoWSims,
    not where the image files came from.
  - Replaced a mention of a specific Blizzard store pack (search-snippet only) with generic
    "store and promotional banners".
  - Marked the "short factual game text" cell in the summary table as our inference.
  - Fixed two internal cross-references (query numbers in usage-rules section 1; section number
    for the plugin-free stroke draw).
  - Corrected the island sketch to jitter by position, after confirming in r128 source that
    polyhedron geometry is non-indexed (TB42).
  - Brought the matchMedia note in line with the prototype (it uses matchMedia for breakpoints and
    a separate listener for reduced motion).
- **Weak sources never sole support.** TB41 supports one background sentence, marked
  *unverified*; TB9 supports nothing. No recommendation rests on a weak source.
- **Quotes.** The only quoted source phrases are under 15 words ("published and owned by Microsoft
  Studios"; "under the Game Content Usage Rules", the app's own string). Blizzard's full credit
  lines are longer than 15 words, so they are described and pointed to (TB1), not reproduced.
- **Dates.** Undated Blizzard pages are labelled "no date on page"; nothing older than 2024 is
  presented as current practice except WCAG/MDN/three.js references, which are standards or the
  pinned r128 version.

Citation audit counts: sources 44 rows (Primary 33, Reputable secondary 7, Weak 3, failed with no tier 1 (TB39));
claims re-sourced 1 (fBm cost), removed 3, marked *unverified* 4 (fan site policy existence; icon
vendoring fit; Microsoft rules' reach; wiki.gg move history).

## Gaps

- No web.archive.org snapshots were requested. The Blizzard legal pages are undated, so the
  version read on 2026-10-04 is not pinned. Worth archiving TB1, TB2, TB4 before relying on them.
- The current Blizzard fan site policy, if it exists, was not found.
- Whether Microsoft's Game Content Usage Rules now cover Blizzard titles is unverified.
- No on-screen observation of prior-art sites; Wowhead and Warcraft Logs not inspected.
- Code sketches are untested; they need a pass in the prototype before use.
- `prefers-reduced-transparency` support figures come from MDN's compat data as of today and will
  change.
