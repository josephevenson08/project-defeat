# EA: ea.com, a franchise page on ea.com, the EA app

Looked at: 2026-10-01. Session 2, batch A. Sources are listed in `../sources.md` (IDs NA13 to NA18).

## What I saw on the live site (2026-10-01)

Inspected in the Claude browser pane in my own tab, viewport `innerWidth` 1024 px. Computed styles and
DOM read by script; **no screenshot** (pane hidden). A cookie/consent banner was present; I did
not accept or dismiss it, and read the page underneath it [NA13].

**Publisher hub (ea.com).** Dark navy surfaces (largest blocks `rgb(0,7,31)`, `rgb(21,28,50)`,
`rgb(43,48,68)`) with one white block [NA13]. Two custom faces load: **electronicartsdisplay** for
headings (38 to 42 px, weight 700, sentence case) and **electronicartstext** for labels and card
titles (18 px 700) [NA13]. Primary CTAs ("Play Now", "Buy Now", "Learn More") are solid blue
`rgb(37,90,246)` with 14 px electronicartstext 700 labels and a **6 px radius**; carousel tabs and
"See Latest Games" use 8 px [NA13].

**Two stacked bars.** A slim "network" bar (48 px tall at this width) with the EA wordmark, then a
"local" bar (62 px) built with Radix menus that collapsed to a mobile menu at 1024 px [NA13]. The
collapsed menu holds Games (Latest Games, Coming Soon, Free-to-Play, EA Sports, EA Originals, Games
Library, EA app Deals), platforms (PC, PlayStation, Xbox, Nintendo Switch, Mobile, Pogo),
Experiences (The EA App, EA Play, Playtesting), About, Commitments and Resources (including Player
and Parental Tools and Accessibility) [NA13]. I found no skip link and no search input in the DOM
[NA13].

**Franchise page (Battlefield 6, on ea.com).** Same domain and same two bars, but the page loads
its own four faces, **bfdisplay, bfheading, bfbody, bfutility**, each declared with EA's face as
the fallback (for example `bfdisplay, electronicartsdisplay, sans-serif`) [NA14]. Headings are
**64 px uppercase** ("SEASON 4 TOP GUN STATS", "COMPETITIVE BATTLEFIELD RETURNS"); feature tabs
("MAPS", "MODES", "CLASSES") are 36 px uppercase with 4.32 px tracking [NA14]. The "BUY NOW"
button is a **square (0 px)** cyan-blue `rgb(0,132,201)` block with black uppercase text [NA14].
Surfaces are near-black and gunmetal (`rgb(6,7,7)`, `rgb(36,43,47)`, `rgb(47,56,62)`) [NA14].

**Accessibility signals.** No skip link found on either page; 0 `prefers-reduced-motion` rules in
16 readable stylesheets on the home page and none on the Battlefield page, with no unreadable
sheets and no shadow DOM, so on this probe reduced-motion handling looks absent rather than hidden
[NA13, NA14]. That is still a CSS-only check: motion could be gated in JavaScript, so treat it as
*unverified* [NA13, NA14].

## Changes since 2024

- **ea.com rebuilt, August 2026.** Archived copies of the home page through 2026-08-01 are built
  from EA custom elements (`ea-elements-loader`, `ea-link`, `ea-cta`, `ea-game-box`, `ea-tile`,
  `ea-local-nav-shelf-…` and more); copies from 2026-09-02 on are a Next.js build with
  CSS-module class names such as `NetworkNav_…`, matching the live page [NA15, NA13]. The EA faces
  were declared both before and after [NA15]. I found no EA post or press article about the
  rebuild, so its date and purpose are *unverified* beyond the archive window [NA15].
- **Brand refresh by Instrument (reported 2025).** Instrument's case study says EA kept its
  "heritage blue" at the centre, widened the palette, and grew Electronic Arts Display into a
  family with Serif, Mono and Text styles, plus a motion toolkit [NA16]. The page has no date
  (copyright 2026); a design blog dated it 2025-10-24 [NA17]. The live site's
  electronicartstext face and blue CTAs are consistent with that, but I cannot tell from the page
  which parts of the site came from this project [NA13].
- **Origin shut down, 17 April 2025;** the EA app became the only EA PC client because Origin was
  32-bit [NA18, 2025-01-21]. This consolidates two launchers into one [NA18].
- I could not find a dated, reputable account of any EA app interface redesign in 2024 to 2026. A
  search snippet mentioned a navigation overhaul in the release notes; the page behind it returned
  403, so it is not used.

## Techniques worth noting

- **Font tokens with a fallback chain:** a franchise face is declared first and the publisher face
  second, so a franchise page re-skins the shared components by swapping one variable [NA14].
- **Neutral, rounded hub; square, uppercase franchise page** on the same domain [NA13, NA14].
- **Platform-holder style nav groups** (games, platforms, experiences, about) collapsing to one
  menu below desktop width [NA13].

## Relevance to Project Defeat

The `bfdisplay, electronicartsdisplay` chain is a tidy example of the theming-by-token approach the
app already uses for factions: the identity face first, the house face as a safe fallback [NA14].
EA also shows the cost of skipping basics: no skip link and no readable reduced-motion rules on a
freshly rebuilt site [NA13, NA14].
