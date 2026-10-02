# Bungie: Bungie.net / Destiny, Marathon

Looked at: 2026-10-01 (session 1; Marathon skip link rechecked in the merge step). Source IDs refer
to `../sources.md`.

## What I saw (2026-10-01, 1280 px)

- **destinythegame.com redirects to `bungie.net/7/en/Destiny`.** In my browser that page stayed an
  **empty shell**: a dark `rgb(18,23,28)` background, a loading spinner, and no text after waiting
  several seconds; WebFetch of a Bungie.net news article also returned only the "Bungie.net" header
  [U1]. The fonts it loaded were Neue Haas Grotesk Text, a Bungie icon font and Material Icons [U1].
  I have **no observation of the Destiny site's layout** and do not describe it.
- **marathonthegame.com** (Next.js) loaded its content into the DOM [U2]:
  - Nav: News, Creators, Store, Rewards, Account, language, and a "Buy Now" button [U2].
  - Button: flat **acid yellow-green (`#c0fe04`) rectangle, square corners**, black uppercase text
    in a display face named "khInterference" [U2].
  - Headings and body in a custom "marathonShapiro" face; a monospace ("ppFraktionMono") and
    TT Interphases Pro also load [U2].
  - News list items show **source + date + title** in uppercase, for example
    "BUNGIE.NET 09.24.2026 THE FUTURE OF MARATHON" [U2].
  - Two `prefers-reduced-motion` rules were found in the readable CSS [U2]; no skip control of any
    kind was found [K1].
  - My screenshot at load was almost entirely black with only the logo mark visible (likely an
    intro animation or video still loading); I did not see the rendered hero [U2].

## Changes since 2024 (from dated sources)

- **Marathon's visual identity (2025).** A design-studio blog (a weak source) describes Marathon's
  look as Y2K cyberpunk crossed with acid graphic-design posters, built on loud color coding, hazard
  stripes and explicit labels [U3]. It covers the game more than the website [U3]. A Creative Bloq
  interview with the art director did not load, so it is not used.
- **Destiny 2 in-game navigation reversal (June 2026).** The June 2026 update brought back the
  Director (the map-style activity screen) as the centre of activities and folded the Portal (a menu
  of activity categories) into nodes along the bottom of the Director [U4]. Shacknews did not report
  Bungie's reasons [U4]. This is in-game UI, not web.
- Bungie announced in September 2026 that vaulted Destiny 2 content will return and that Marathon
  is getting substantial reworks [U5]. Nothing UI-specific was given [U5].

## Techniques worth noting

- **Brand-specific display type and one aggressive accent** (Marathon), square-cornered buttons
  [U2].
- **Dated, sourced news lines** in a monospace-feeling uppercase row [U2].
- **Spatial navigation over category lists** in the Destiny 2 reversal (in-game, observation only)
  [U4].
- A client-rendered site that shows nothing without JavaScript (Bungie.net) is a cautionary example
  [U1].

## Relevance to Project Defeat

The app's raid section is closer to a spatial picker (raid cards, boss cards) than a flat list,
which the Destiny 2 change supports, though that is one in-game data point [A1, U4]. The Bungie.net
empty shell is a reminder to keep the app's static first paint meaningful [U1].
