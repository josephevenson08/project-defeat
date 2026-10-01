# Valve: Steam store and client

Looked at: 2026-10-01. Source IDs refer to `../sources.md`.

## What I saw on the live store (2026-10-01)

- One horizontal store menu under the Steam header, with dropdowns labelled Browse, Recommendations,
  Categories, Hardware, Ways to Play and Special Sections, and a "search the store" field at the right
  end of the same bar [V1]. No left-hand link column on the home page.
- Body text in Motiva Sans (the only web font loaded), 12 px base, on the familiar blue-slate
  `rgb(31,42,53)` surface with pale blue-grey text [V1].
- Content containers capped at 1200 and 1300 px max-width (counted from computed styles) [V1].
- A seasonal sale takeover (Autumn Sale artwork, end date in the hero) at the top of the home page.

## Changes since 2024 (from dated sources)

1. **Store menu and search, July 2025.** In the Steam Client Beta from 2025-07-25, Valve merged the
   blue top bar and the left link column into a single top menu that appears on more pages and
   hides while scrolling down [V2, 2025-07-26]. The search dropdown gained recently viewed items,
   popular searches, and suggestions for categories, tags, publishers and developers, plus a route
   into advanced search [V2]. Valve's stated aim, quoted by GamingOnLinux: easier access to places
   users "most frequently visit" [V2].
2. **Wider store pages, November 2025.** Game pages widened to 1200 px (from 940 px per
   GamingOnLinux, 900 per HotHardware), on both client and web; screenshots and trailers gained a
   theater mode and a full-screen mode via buttons at the lower right; search-result and bundle art
   got larger [V3, 2025-11-07; V4, 2025-11-11]. HotHardware reports Valve's reasoning: the hardware
   survey shows many 4K monitors, but most players do not run the client or browser full screen, so
   1200 px was a balance between more content and a page that stays easy to navigate [V4]. Valve
   said similar changes for the home page were coming later [V3].
3. **Big Picture / Steam Deck UI, September 2026 beta.** A "Big Art Mode" library view that gives
   the selected game a large piece of art, an optional screensaver of recent games and screenshots,
   and a personalized release calendar in the Recommended tab [V5, 2026-09-10]. PCGamesN notes the
   art mode echoes the community Decky Loader mod [V5].

## Background (pre-2024, context only)

- The June 2023 desktop client update rebuilt the in-game overlay, added synced per-game notes and
  shared one front-end codebase across desktop, Steam Deck and Big Picture [V6, 2023]. Older than the
  window; it explains why later features ship to all three surfaces at once.

## Techniques worth noting

- **Consolidated navigation**: one top bar instead of a top bar plus a side column, with search
  always present.
- **Search as a navigation surface**: the dropdown suggests recent and popular items before you
  type a full query.
- **Measured content width** chosen from usage data (windowed, not full screen), with an opt-in
  theater / full-screen view for media rather than a wider default.
- **Per-surface layouts on one codebase** (desktop, Deck, Big Picture).

## Relevance to Project Defeat

The app has one filter field in the gear slot pane and no global search. Steam's 2025 change makes
search a persistent part of the top bar and seeds it with recent items, which maps onto "recently
viewed items / specs / bosses" here. The 1200 px decision is also a useful reference for the
app's main pane width on large monitors.
