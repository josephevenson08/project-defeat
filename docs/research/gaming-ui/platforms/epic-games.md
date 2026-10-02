# Epic Games: Epic Games Store (web) and Epic Games Launcher

Looked at: 2026-10-01 (session 1; skip link checked in the merge step). Source IDs refer to
`../sources.md`.

## What I saw on the live web store (2026-10-01, 1280 px)

- Top bar: Epic logo, "Store", Support, Distribute; at the right a language globe, "Sign In", and a
  blue "Download" button [E1].
- Second row: a rounded, filled "Search store" field followed by three text tabs: **Discover,
  Browse, News** [E1].
- Hero: one featured game on near-black, logo art on the left, title, two-line pitch and a white
  "Now Available" button with a **10 px radius** [E1].
- Type: **Inter** for headings (700, 32 px for the hero title) and body; Inter Tight and Recursive
  Mono also load, plus Noto faces for other scripts and a "Fortnite" display face [E1].
- A "Skip to main content" link is present (found in the merge-step re-probe) [K1].
- Overall: neutral, product-led, almost no brand ornament; the game art carries the color [E1].

The desktop launcher was not installed, so nothing below about it is from observation.

## Changes since 2024 (from dated sources)

- **Launcher V2, announced June 2026.** At Unreal Fest (June 2026) Epic presented a ground-up
  rebuild of its launcher, with about 5x faster cold start, a private beta first and public release
  after it, inside a roadmap of about 12 months [E4]. Epic told developers the current launcher
  causes problems for everyone, and VGC attributes the slowness to excessive backend calls [E4]. A
  weaker source adds a 6.5x faster restore from the system tray and an Epic VP's description of the
  rebuild; both are *unverified* [E2].
- **Planned store features:** user reviews on product pages, patch notes inside the store, improved
  search, player profiles and avatars, cross-region gifting, chunked Fortnite installs [E4].
- Neither article I could open disclosed the technology stack, so claims elsewhere about what it is
  built on are not used [E4].
- Epic's own State of Unreal 2026 recap page returned HTTP 403, so I have no primary Epic text.

## Techniques worth noting

- **Speed as the headline UI feature**: the redesign is pitched first on load time, then on layout
  [E4].
- **Search + three plain tabs** (Discover / Browse / News) as the entire navigation model [E1].
- **Product pages that carry patch notes and reviews**, moving information that used to live
  off-site into the page where the decision is made [E4].
- **Neutral system typography (Inter)** so the storefront never competes with game art [E1].

## Relevance to Project Defeat

The Discover / Browse / News split is a very small navigation model [E1]. The patch-notes-in-the-page
idea maps onto showing "what changed in this phase" next to the BiS list it affects, instead of in a
separate log [E4].
