# How WoW fan tools and Blizzard's own sites use motion (B3)

Track B, 2026-10-04. Sources in `sources-b.md`.

## Method and its limits (read first)

The brief ruled out browser tools, so nothing here was *watched*. For each site I fetched the
shipped HTML and its linked CSS with curl and searched them as text for `@keyframes` names,
`prefers-reduced-motion` blocks, `<video>`/`<canvas>` tags, autoplay flags and animation-library
filenames (three.js, GSAP, Lottie, PixiJS). That shows **what motion a site has prepared and how it
guards it**, not how much plays on screen, and it misses anything styled from JavaScript. Counts
are distinct keyframe names, not uses. Wowhead blocked the fetch (HTTP 403) and is left out rather
than described from memory [TB39]. Warcraft Logs returned only a 3 KB shell, so it is also left
out. Treat everything below as *seen in source on 2026-10-04*, not *seen on screen*.

## Site by site

### Raider.IO (rankings and Mythic+ / raid progress)

- Its single stylesheet (about 1.08 MB) defines 62 distinct keyframe animations [TB32].
- The names are almost all **state and feedback** motion: loaders and spinners, panel and menu
  open/close, tooltip zoom, progress-bar fill, and "pulse"/"glow" cues on boss-progress cards for a
  new best pull, plus a live-stream pulse [TB32].
- There is a small amount of **event flourish**: a seasonal "recap" feature with its own
  scroll-hint, quiz and story animations, and what appear to be April-joke animations [TB32].
- Ten `prefers-reduced-motion: reduce` blocks switch off specific animations, including the icon
  spinners and the recap scroll hint [TB32].
- The home page config includes YouTube embeds flagged for autoplay for live events [TB32].
- No three.js, GSAP, Lottie or Pixi filename appears in the HTML [TB32].

### World of Warcraft official site (Blizzard)

- The five stylesheets on the home page (about 1.9 MB together) define 13 keyframe animations:
  carousel bounce and fade, expand/collapse fades, and loading spinners [TB33].
- None of those five files contains a `prefers-reduced-motion` query [TB33]. Scripts may handle it;
  that is not checked here.
- No `<video>` element is in the static HTML; the page is assembled by scripts [TB33].
- The TBC Classic Anniversary launch article loaded, but its static HTML showed no video or embed
  markers; its body was not analysed [TB38].

### Icy Veins (guides)

- Five stylesheets (about 179 KB) with **no** keyframe animations and one reduced-motion query
  [TB34].
- The footer says Icy Veins is not affiliated with or endorsed by Blizzard [TB34].

### Warcraft Wiki (warcraft.wiki.gg)

- The main page describes itself as an officially recognised wiki for the Warcraft universe
  [TB35]. Its static HTML has no keyframes, video or canvas; its MediaWiki stylesheets were not
  fetched [TB35].
- Background, 2018: the wiki's own forum recorded ad technology causing 20-40 second loads and
  hundreds of requests on logged-out visits [TB37]. Search summaries say this history fed the 2023
  move off Fandom to wiki.gg (*unverified*, weak sources only [TB41]).

### WoWSims (TBC simulator launcher)

- The TBC launcher is a static grid of class and spec icon links with one inline style block and
  no keyframes, video or canvas in the HTML [TB36]. The simulator pages behind it were not
  inspected.

## What this suggests for Project Defeat

These are inferences from the five sites above, not findings any one source states.

1. **The tools players use for numbers barely move.** Icy Veins and WoWSims ship no keyframes at
   all on the pages checked [TB34][TB36], and Raider.IO's large set is overwhelmingly loaders,
   reveals and change cues [TB32]. That matches the general guidance that UI motion should signal
   feedback or state and that decorative motion distracts [TB31].
2. **Celebratory motion is tied to an event.** Raider.IO's richer animations sit on a seasonal
   recap feature and live-event cues, not on the everyday ranking tables [TB32]. For us, the
   equivalent is a portal swell when the user switches phase or saves a build, not a constantly
   busy backdrop.
3. **Even Blizzard's own site keeps CSS motion modest.** Carousels, fades and spinners are the
   whole keyframe list in its home-page CSS [TB33]. No sign of a WebGL backdrop was found in the
   static source, though a script-built one cannot be ruled out [TB33].
4. **Reduced-motion handling is the respected pattern.** Raider.IO turns off specific animations
   under reduce [TB32] and Icy Veins has a reduce query [TB34]; WCAG asks that auto-playing motion
   can be paused [TB27]. Our prototype already goes further, with a full still frame and two
   toggles.
5. **Non-affiliation is said in plain words.** Icy Veins puts it in the footer [TB34]; Blizzard's
   guidelines ask for a credit line and forbid implying sponsorship [TB1]. See `usage-rules.md`.

## Tasteful vs too much, for a data tool

| Tasteful (keep) | Too much (avoid) |
|---|---|
| A slow, peripheral 3D backdrop, paused when hidden or off-screen | A backdrop that competes with the tables (bright bloom behind text, fast camera moves) |
| One short swell on a meaningful change: phase switch, build saved, gear upgraded | Looping pulses on many cards at once |
| Count-up numbers and bar fills when values change (as Raider.IO-style progress fills do [TB32]) | Animating numbers that did not change, or on every scroll |
| A rune ring that draws once on first view, then sits still or turns very slowly | Rune rings, embers and portal all animating in the same viewport |
| Motion and 3D toggles always visible; reduced-motion gives a still frame | Autoplay video or audio |
| Loaders and skeletons for real waits | Intro sequences that delay reaching the planner |

## Gaps

- No on-screen observation of any site (browser tools were excluded).
- Wowhead and Warcraft Logs could not be inspected [TB39].
- Blizzard's armory and Classic-specific pages returned 404 at the URLs tried; the current URLs
  were not found in this pass (`log-b.md`).
- The official site's JavaScript was not searched for WebGL or reduced-motion handling.
