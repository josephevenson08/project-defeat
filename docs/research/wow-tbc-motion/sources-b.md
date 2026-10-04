# Sources (track B: usage rules, techniques, prior art)

Every source used in `usage-rules.md`, `techniques.md` and `prior-art.md`. IDs are prefixed **TB**
so they never collide with track A's IDs in `sources-a.md`.

**Tiers** (from `.claude/agents/gaming-ui-researcher.md`): **Primary** = the owner's own site,
documentation, licence, source code or the live page itself. **Reputable secondary** = established
publisher or recognised technical author. **Weak** = aggregators, forums, wikis on ad networks,
search snippets; never the only support for a claim.

**Load status** values: *loaded* (WebFetch summary), *loaded-raw* (fetched with curl and read as
text), *partial* (shell or excerpt only), *failed* (with HTTP status).

All accessed **2026-10-04**. No web.archive.org links were requested in this pass (see `log-b.md`,
"Gaps"); the Blizzard legal pages carry no dates, so an archive snapshot would be the only way to
pin the version read.

## Blizzard and Microsoft legal pages (B1)

| ID | Tier | Title | Publisher | Author | Date | URL | Load | Supports |
|---|---|---|---|---|---|---|---|---|
| TB1 | Primary | Blizzard Entertainment Logo and Trademark Guidelines | Blizzard Entertainment | not shown | no date on page | https://www.blizzard.com/en-us/legal/8bcb0794-6641-4ce3-a573-8eb243bab342/blizzard-entertainment-logo-and-trademark-guidelines | loaded + loaded-raw | Marks only for UGC activities whose Activity Policy grants it; fan site policy named; non-commercial; no logo alteration; TM symbol on first use; credit lines incl. WoW and TBC; no merchandise; no "Acme Warcraft" combos |
| TB1a | Primary | Same guidelines, alternate URL (French slug, English text) | Blizzard Entertainment | not shown | no date | https://www.blizzard.com/en-us/legal/38fd0408-8431-469a-99bc-2cd9eb9462c8/recommandations-concernant-l-usage-des-marques-blizzard-entertainment | loaded | Confirms the fan site sentence in TB1 |
| TB2 | Primary | Blizzard Legal FAQ | Blizzard Entertainment | not shown | no date | https://www.blizzard.com/en-us/legal/c1ae32ac-7ff9-4ac3-a03b-fc04b8697010/blizzard-legal-faq | loaded (one timeout on a mistyped URL first) | Fan sites allowed with notices; screenshots on personal sites; images/audio for personal non-commercial use; music for personal use; no product names in domains; licences revocable |
| TB3 | Primary | Copyright Notices | Blizzard Entertainment | not shown | no date | https://www.blizzard.com/en-us/legal/5515ca11-1c96-42a0-b853-e7876a0d19bf/copyright-notices | loaded | WoW (©2004) and TBC (©2006) copyright lines |
| TB4 | Primary | Terms of Use for Blizzard's Websites | Blizzard Entertainment | not shown | last revised 2018-09-26 | https://www.blizzard.com/en-us/legal/29232b30-6ae1-4d74-b1c5-8bd1df9e0b63/terms-of-use-for-blizzards-websites | loaded | Site materials: personal use only, no downloading beyond caching, no derivative uses, keep notices |
| TB5 | Primary | Blizzard End User License Agreement | Blizzard Entertainment | not shown | last updated 2024-03-21 | https://www.blizzard.com/en-us/legal/fba4d00f-c7e4-4883-b8b9-1b4500a402ea/blizzard-end-user-license-agreement | loaded | No derivative works except as Blizzard allows; no data-mining of platform; no explicit fan-site clause |
| TB6 | Primary | Blizzard Developer API Terms of Use | Blizzard Entertainment | not shown | last updated 2019-10-01 | https://www.blizzard.com/en-us/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use | loaded | No trademarks in app title/URL; identify Blizzard as data source; no paid tiers; 30-day retention for API data |
| TB7 | Primary | Blizzard Video Policy | Blizzard Entertainment | not shown | no date | https://www.blizzard.com/en-us/legal/dd76b654-f2c4-4aaa-ba49-ca3122de2376/blizzard-video-policy | loaded | Scope is videos; covers footage, music, sounds; non-commercial with partner-program exception |
| TB8 | Primary | Game Content Usage Rules | Microsoft (Xbox) | not shown | "Last Updated: January 2015" | https://www.xbox.com/en-US/developers/rules | loaded + loaded-raw | Scope: games "published and owned by Microsoft Studios"; no mention of Blizzard; required notice format; no logos |
| TB9 | Weak | Fansite kit (Wowpedia) | Fandom | community | unknown | https://wowpedia.fandom.com/wiki/Fansite_kit | failed (HTTP 402); search snippet only | Not cited in any claim. Snippet said the old fan site kit is now only on third-party sites (*unverified*) |

## Libraries, CDNs and licences (B2)

| ID | Tier | Title | Publisher | Author | Date | URL | Load | Supports |
|---|---|---|---|---|---|---|---|---|
| TB10 | Primary | GSAP 3.13 release ("GSAP is now 100% free") | GSAP / Webflow | GSAP team | 2025-04-29 | https://gsap.com/blog/3-13/ | loaded | All bonus plugins (SplitText, MorphSVG, DrawSVG) free incl. commercial use; plugins in public npm/GitHub |
| TB11 | Primary | GSAP Standard "No Charge" License | GSAP / Webflow | not shown | effective 2025-04-30, modified 2025-05-30 | https://gsap.com/standard-license/ | loaded | Free for any person/entity; one prohibited use: no-code visual animation builders competing with Webflow; covers all plugins |
| TB12 | Primary | cdnjs GSAP library listing, API and file headers | cdnjs / Cloudflare | n/a | checked 2026-10-04 | https://cdnjs.com/libraries/gsap ; https://api.cdnjs.com/libraries/gsap | loaded + loaded-raw (HTTP status checks) | Latest 3.15.0; DrawSVGPlugin.min.js 200 at 3.13.0 and 3.15.0, 404 at 3.12.5; SplitText, MorphSVGPlugin 200 at 3.15.0; file header points to gsap.com/standard-license |
| TB13 | Primary | DrawSVG plugin docs | GSAP | GSAP team | undated | https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/ | loaded | Animates stroke-dashoffset/dasharray; element list; needs a stroke applied |
| TB14 | Primary | gsap.matchMedia() docs | GSAP | GSAP team | undated (feature since 3.11.0) | https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ | loaded | Conditions incl. reduced motion; auto-revert of tweens and ScrollTriggers |
| TB15 | Primary | three.js r128 `examples/js` post-processing files (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader) | three.js via jsDelivr | mrdoob et al. | r128 (2021) | https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js (and siblings) | loaded-raw (HTTP 200 each, header read) | Non-module bloom files exist for r128; UnrealBloomPass uses a 5-mip blur chain |
| TB16 | Primary | three.js r128 GodRaysShader.js and webgl_postprocessing_godrays example | three.js (GitHub) | mrdoob et al. | r128 | https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/js/shaders/GodRaysShader.js | loaded-raw | Depth-mask radial blur, 3 passes x 6 samples, after Sousa 2008 |
| TB17 | Primary | three.js r128 docs: WebGLRenderer, ShaderMaterial | three.js (GitHub) | mrdoob et al. | r128 | https://raw.githubusercontent.com/mrdoob/three.js/r128/docs/api/en/renderers/WebGLRenderer.html ; .../materials/ShaderMaterial.html | loaded-raw | powerPreference values; setPixelRatio purpose; uniforms/attributes model |
| TB18 | Primary | cdnjs three.js r128 file list | cdnjs | n/a | checked 2026-10-04 | https://api.cdnjs.com/libraries/three.js/r128?fields=files | loaded-raw | cdnjs r128 ships only three.js / three.min.js / module builds, no examples |
| TB42 | Primary | three.js r128 `src/geometries/PolyhedronGeometry.js` | three.js (GitHub) | mrdoob et al. | r128 | https://raw.githubusercontent.com/mrdoob/three.js/r128/src/geometries/PolyhedronGeometry.js | loaded-raw | Builds non-indexed geometry (comment at line 38), so corners repeat per face |
| TB15b | Primary | three.js r128 example pages (unreal_bloom, unreal_bloom_selective, points_waves, gpgpu_water) | three.js (GitHub) | mrdoob et al. | r128 | https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/webgl_postprocessing_unreal_bloom_selective.html | loaded-raw (HTTP 200 only, not read in full) | Existence of reference examples at r128 |

## Graphics technique references (B2)

| ID | Tier | Title | Publisher | Author | Date | URL | Load | Supports |
|---|---|---|---|---|---|---|---|---|
| TB19 | Reputable secondary | The Book of Shaders, ch. 13 "Fractal Brownian Motion" | thebookofshaders.com | Patricio Gonzalez Vivo, Jen Lowe | undated | https://thebookofshaders.com/13/ | loaded | fBm = summed noise octaves; lacunarity and gain; domain warping variant |
| TB20 | Reputable secondary | Domain warping | iquilezles.org | Inigo Quilez | 2002 (per page menu) | https://iquilezles.org/articles/warp/ | loaded-raw (WebFetch 404, curl 200) | f(p + h(p)); nested fbm warping code pattern |
| TB21 | Reputable secondary | GPU Gems 3, ch. 13 "Volumetric Light Scattering as a Post-Process" | NVIDIA | Kenny Mitchell (EA) | 2007 (book) | https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process | loaded | Screen-space radial sampling toward light; density/weight/decay/exposure; occlusion pre-pass |
| TB22 | Reputable secondary | WebGL Water (demo page) | madebyevan.com | Evan Wallace | undated (c. 2011) | https://madebyevan.com/webgl-water/ | loaded | Heightfield water, caustics, needs OES_texture_float / OES_standard_derivatives |
| TB23 | Reputable secondary | three.js fundamentals: Responsive Design (HD-DPI section) | threejsfundamentals.org (Google copyright) | Gregg Tavares (*author name not shown on the raw file; unverified*) | 2018 | https://raw.githubusercontent.com/gfxfundamentals/threejsfundamentals/master/threejs/lessons/threejs-responsive.md | loaded-raw | 3x DPR = 9x pixels; leaving DPR at 1 is the common choice for heavy scenes |

## Accessibility and platform references (B2)

| ID | Tier | Title | Publisher | Author | Date | URL | Load | Supports |
|---|---|---|---|---|---|---|---|---|
| TB24 | Primary | prefers-reduced-transparency | MDN | MDN contributors | last modified 2026-04-20 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency | loaded | Experimental, not Baseline; OS settings that set it |
| TB25 | Primary | Navigator.deviceMemory | MDN | MDN contributors | undated | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory | loaded | Coarse power-of-two GiB; secure context; limited availability |
| TB26 | Reputable secondary | prefers-reduced-motion: Sometimes less movement is more | web.dev (Google) | Thomas Steiner | 2019 (*publication date not captured; unverified*) | https://web.dev/articles/prefers-reduced-motion | loaded | Vestibular rationale; JS matchMedia change listener pattern |
| TB27 | Primary | Understanding SC 2.2.2 Pause, Stop, Hide | W3C WAI | W3C | WCAG 2.2 | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | loaded | Level A; auto-starting motion > 5 s alongside content needs pause/stop/hide |
| TB28 | Primary | Understanding SC 2.3.3 Animation from Interactions | W3C WAI | W3C | WCAG 2.2 | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html | loaded | Level AAA; interaction-triggered motion can be disabled; parallax example |
| TB29 | Primary | Understanding SC 2.3.1 Three Flashes or Below Threshold | W3C WAI | W3C | WCAG 2.2 | https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html | loaded | Level A; no more than three flashes per second; stricter red-flash test |
| TB30 | Primary | MDN browser-compat-data, css/at-rules/media.json | MDN (GitHub) | MDN contributors | main branch, read 2026-10-04 | https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/at-rules/media.json | loaded-raw | prefers-reduced-transparency: Chrome 118, Edge mirror, Firefox 113 behind a flag, Safari no; prefers-reduced-motion: Chrome 74, Firefox 63, Safari 10.1 |
| TB31 | Reputable secondary | The Role of Animation and Motion in UX | Nielsen Norman Group | Page Laubheimer | 2020-01-12 | https://www.nngroup.com/articles/animation-purpose-ux/ | loaded | UI animation should be subtle, brief, purposeful; decorative motion distracts |

## Live pages inspected (B3)

No browser was used (the brief forbade browser tools). "Seen" below means **the shipped HTML and
linked CSS, fetched with curl on 2026-10-04 and searched as text** — keyframe names, media queries,
`<video>`/`<canvas>` tags and library filenames. It cannot show what actually moves on screen, and
JS-injected styles are invisible to it.

| ID | Tier | Page | URL | Load | What was measured |
|---|---|---|---|---|---|
| TB32 | Primary (live source) | Raider.IO home | https://raider.io/ | loaded-raw (HTML 74 KB, 1 CSS file 1.08 MB) | 62 distinct `@keyframes`; 10 `prefers-reduced-motion` blocks; YouTube embeds with autoplay in live-event config; no three.js/GSAP/Lottie filenames in HTML |
| TB33 | Primary (live source) | World of Warcraft official site home | https://worldofwarcraft.blizzard.com/en-us/ | loaded-raw (HTML 39 KB, 5 CSS files 1.9 MB) | 13 distinct `@keyframes` (carousel bounce/fade, expand fade, spinners); 0 `prefers-reduced-motion` in those 5 files; no `<video>` in static HTML |
| TB34 | Primary (live source) | Icy Veins TBC Classic hub | https://www.icy-veins.com/tbc-classic/ | loaded-raw (HTML 194 KB, 5 CSS files 179 KB) | 0 `@keyframes`, 1 `prefers-reduced-motion`; footer disclaimer of non-affiliation |
| TB35 | Primary (live source) | Warcraft Wiki main page | https://warcraft.wiki.gg/wiki/Warcraft_Wiki | loaded-raw (HTML 76 KB; MediaWiki `load.php` CSS not fetched) | Calls itself an officially recognised wiki; no keyframes/video in HTML |
| TB36 | Primary (live source) | WoWSims TBC launcher | https://wowsims.github.io/tbc/ | loaded-raw (HTML 13 KB, one inline style) | Static grid of class/spec icon links; no keyframes, video or canvas in HTML |
| TB37 | Primary (wiki's own record; background, 2018) | Forum:Ads (Warcraft Wiki, carried over from Wowpedia) | https://warcraft.wiki.gg/wiki/Forum:Ads | loaded | 2018 thread: ad tech caused 20-40 s loads and hundreds of requests |
| TB38 | Primary | "WoW: Burning Crusade Classic Anniversary Edition Now Live!" | https://worldofwarcraft.blizzard.com/en-us/news/24242436/ | partial (HTML 200; title read; no video/embed markers found in static HTML) | Only that the page exists; body not analysed |
| TB39 | — | Wowhead TBC hub | https://www.wowhead.com/tbc | failed (curl 403; WebFetch returned header only) | Nothing usable; not cited for any claim |
| TB40 | Weak | Wowhead news posts on layout (2019) | https://wowhead.com/news=292439/new-layout-for-wowhead-guides ; https://www.wowhead.com/news/upcoming-site-navigation-improvements-design-preview-295903 | loaded (headline only) | Rejected: 2019, no body content; logged only |
| TB41 | Weak | Search snippets on the 2023 Wowpedia to wiki.gg move | WebSearch result summaries (Wikipedia, MMO-Champion, GameRifts) | snippet | Background only, marked *unverified* where used |
