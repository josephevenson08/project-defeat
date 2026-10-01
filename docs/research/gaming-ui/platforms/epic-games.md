# Epic Games: Epic Games Store (web) and Epic Games Launcher

Looked at: 2026-10-01. Source IDs refer to `../sources.md`.

## What I saw on the live web store (2026-10-01)

- Top bar: Epic logo, "Store", Support, Distribute; at the right a language globe, "Sign In", and a
  blue "Download" button [E1].
- Second row: a rounded, filled "Search store" field followed by three text tabs: **Discover,
  Browse, News** [E1].
- Hero: one featured game on near-black, logo art on the left, title, two-line pitch and a white
  "Now Available" button with a **10 px radius** [E1].
- Type: **Inter** for headings (700, 32 px for the hero title) and body; Inter Tight and Recursive
  Mono also load, plus Noto faces for other scripts and a "Fortnite" display face [E1].
- Overall: neutral, product-led, almost no brand ornament; the game art carries all the color.

The desktop launcher was not installed, so nothing below about it is from observation.

## Changes since 2024 (from dated sources)

- **Launcher V2, announced June 2026.** At Unreal Fest (June 2026) Epic presented a rebuilt launcher
  and storefront [E2, 2026-06-19]. Reported claims: about 5x faster cold start and about 6.5x faster
  from the system tray; a private beta first, then public rollout inside a 12-month roadmap [E2].
  Tbreak quotes an Epic VP describing it as pulling the guts out and putting new guts in [E2].
- **Planned store features:** user reviews on product pages, patch notes inside the store, improved
  search, universal controller support, player profiles and avatars, cross-region gifting [E2].
- Search snippets claimed the Unreal Engine runtime is being removed from the launcher and that the
  rebuild cost about $400 million. The one article I could open says the tech stack was **not
  disclosed** [E2], so both claims are *unverified* and not used elsewhere.
- Epic's own State of Unreal 2026 recap page returned HTTP 403, so I have no primary Epic text.

## Techniques worth noting

- **Speed as the headline UI feature**: the redesign is pitched first on load time, then on layout.
- **Search + three plain tabs** (Discover / Browse / News) as the entire navigation model.
- **Product pages that carry the game's community, patch notes and reviews**, i.e. moving
  information that used to live off-site into the page where the decision is made.
- **Neutral system typography (Inter)** so the storefront never competes with game art.

## Relevance to Project Defeat

The Discover / Browse / News split is a very small navigation model. The patch-notes-in-the-page
idea maps onto showing "what changed in this phase" next to the BiS list it affects, instead of in a
separate log.
