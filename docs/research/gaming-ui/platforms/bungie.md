# Bungie: Bungie.net / Destiny, Marathon

Looked at: 2026-10-01. Source IDs refer to `../sources.md`.

## What I saw (2026-10-01)

- **destinythegame.com redirects to `bungie.net/7/en/Destiny`.** In my browser that page stayed an
  **empty shell**: a dark `rgb(18,23,28)` background, a loading spinner, and no text after waiting
  several seconds; WebFetch of a Bungie.net news article also returned only the "Bungie.net" header
  [U1]. The fonts it loaded were Neue Haas Grotesk Text, a Bungie icon font and Material Icons [U1].
  I have **no observation of the Destiny site's layout** and do not describe it.
- **marathonthegame.com** (Next.js) loaded its content into the DOM [U2]:
  - Nav: News, Creators, Store, Rewards, Account, language, and a "Buy Now" button.
  - Button: flat **acid yellow-green (`#c0fe04`) rectangle, square corners**, black uppercase text
    in a display face named "khInterference" [U2].
  - Headings and body in a custom "marathonShapiro" face; a monospace ("ppFraktionMono") and
    TT Interphases Pro also load [U2].
  - News list items show **source + date + title** in uppercase, for example
    "BUNGIE.NET 09.24.2026 THE FUTURE OF MARATHON" [U2].
  - Two `prefers-reduced-motion` rules were found in the readable CSS [U2].
  - My screenshot at load was almost entirely black with only the logo mark visible (likely an
    intro animation or video still loading); I did not see the rendered hero.

## Changes since 2024 (from dated sources)

- **Marathon's visual identity (2025).** A design blog describes Marathon's look as Y2K cyberpunk
  crossed with acid graphic-design posters, built on loud color coding, hazard stripes and explicit
  labels so objects state their purpose [U3, 2025-04-28]. It covers the game more than the
  website. A Creative Bloq interview with the art director appeared in search results but the page
  body did not load, so I do not quote it.
- **Destiny 2 in-game navigation reversal (June 2026).** The Monument of Triumph update (June 2026)
  brought back the Director (the map-style activity screen) as the centre of activities and folded
  the Portal (a menu of activity categories; search snippets say it arrived in 2025, *unverified*) into nodes along the bottom of the
  Director [U4, 2026-06-19]. Shacknews did not report Bungie's reasons. This is in-game UI, not web,
  but it is a current example of a studio moving back from a list-of-categories menu to a spatial map.
- Bungie announced in September 2026 that vaulted Destiny 2 content will return and that Marathon
  is getting substantial reworks [U5, 2026-09-21]. Nothing UI-specific was given.

## Techniques worth noting

- **Brand-specific display type and one aggressive accent** (Marathon), square-cornered buttons.
- **Dated, sourced news lines** in a monospace-feeling uppercase row.
- **Spatial navigation over category lists** in the Destiny 2 reversal (in-game, observation only).
- A client-rendered site that shows nothing without JavaScript (Bungie.net) is a cautionary example.

## Relevance to Project Defeat

The app's raid section is closer to a spatial picker (raid cards, boss cards) than a flat list,
which the Destiny 2 change supports, though that is one in-game data point. The Bungie.net empty
shell is a reminder to keep the app's static first paint meaningful.
