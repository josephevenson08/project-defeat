# Sony: playstation.com, PlayStation Store (web and PS5)

Looked at: 2026-10-01 (session 1). Source IDs refer to `../sources.md`.

## What I saw on playstation.com (2026-10-01, 1280 px)

- First probe right after load returned an empty body (client-rendered); a second probe a few
  seconds later read the full page [P1]. Recorded so the method is clear.
- A **"Skip to main content"** link is the first focusable element [P1].
- Shared global nav: Store, PS5, Games, PS Plus, Accessories, News, Support, Search, with a thin
  black Sony bar above it [P1].
- Body on **white**, text near-black, in Sony's **SST** typeface; hero headings in SST at weight 300
  (light) around 34 px [P1]. Bebas Neue, SST Condensed and campaign faces also load [P1].
- **Per-banner theming:** hero slides carry `theme--dark` or `theme--light` classes, and a campaign
  banner sets its own CSS custom properties inline (for example a `--brand-yellow` token) [P1]. So
  a light site hosts dark, campaign-colored blocks without a separate stylesheet per campaign [P1].
- Hero: carousel with previous/next arrows and dot pagination, one white "Play now" button that
  looks pill-shaped in the screenshot (radius not measured) [P1].
- 0 `prefers-reduced-motion` rules found in readable CSS (*unverified*, cross-origin sheets) [P1].

## Changes since 2024 (from dated sources)

- **PS Store web screenshots restored (February 2026).** Screenshots returned to game pages on the
  web store after having been removed; videos were still missing on web [P2].
- **PS5 store redesign in beta (April 2026, not confirmed by Sony).** A beta image showed large
  "Netflix-style" tiles with hover trailers, descriptive tags such as Open World and Story Rich that
  can be combined in search, and a "Browse by Mood or Genre" row [P3]. Push Square sourced it to a
  social-media post; Sony had not acknowledged it [P3]. Treat as *unverified*.

## Techniques worth noting

- **Light-first marketing site** with dark, art-led hero blocks, themed per block [P1].
- **Campaign tokens as inline custom properties** on a component, not a new theme [P1].
- **Tag chips as filters** (proposed PS5 store, *unverified*): descriptive tags doubling as search
  facets [P3].
- **Skip link and a conventional, predictable global nav** [P1].

## Relevance to Project Defeat

The per-block `theme--dark` / campaign-token approach is the same mechanism the app already uses
for faction (`data-faction`) and section accents (`--section-accent`, `--panel-accent`) [P1, A2]. The
tag-chip filtering idea applies to item and spec lists (for example: slot, source, phase, armor
type), but it rests on an unconfirmed beta [P3].
