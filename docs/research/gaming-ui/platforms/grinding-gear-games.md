# Grinding Gear Games: Path of Exile 2 site

Looked at: 2026-10-01. Session 2, batch B. Source IDs (NB...) are listed in `../sources.md`. Pages opened
in the Claude browser pane at a **1024 x 768 CSS px** viewport (`innerWidth` 1024) and read with a
computed-style script; the pane was hidden, so **no screenshots**.

## What I saw on the live site (2026-10-01, 1024 px)

Pages: pathofexile2.com (which redirected to `/early-access`) [NB9] and pathofexile2.com/home [NB10].

**Type: the same serif family this app uses.** Loaded faces were FontinRegular, **Cinzel**,
OptimusPrincepsSemiBold and Noto Sans JP [NB9]. Main nav items (Home, Full release, Game, Community,
Trade, Shop) are Optimus Princeps 24 px in a muted bronze `rgb(131,112,83)` [NB9]. Section heads mix
Optimus Princeps and Cinzel at 32 to 80 px; body copy is Fontin 16 px in grey `rgb(140,140,140)` or
`rgb(182,182,182)` on a dark textured background image [NB9, NB10]. Headings are not uppercased or
tracked (`text-transform: none`, `letter-spacing: normal`) [NB9, NB10].

**Buttons drawn with CSS `border-image`.** The main call to action ("Get Access Now!") is an `<a>`
with class `poe2-button-crimson`, a 0 px radius, no fill, and a `border-image` taken from an image on
GGG's CDN; the label is Cinzel 32 px in pale gold `rgb(218,193,142)` [NB9]. So the ornate frame is a
stretchable image border around ordinary text, not a picture of a button [NB9]. Every sampled button had a
0 px radius [NB9].

**A game switcher in the account bar.** The top strip is a thin account bar: a "Switch games" toggle
(`ggg-switcher__toggle`), a "Get access now!" button, Sign In, Create Account, Support and a language
button [NB10]. Below it sits the game's own nav [NB10]. Community and Trade are marked with an outward arrow
(⤤) because they open on pathofexile.com, the Path of Exile 1 domain [NB9].

**Home page order:** a full-release banner ("Path of Exile 2 Fully Releases on December 11"), then
"Get Exclusive Rewards", then **News** cards each stamped with a full date and time (for example
"Sep 24, 2026, 7:10 PM"), then **Livestreams** with streamer name and live viewer count, then the
early-access pitch and the official-channel footer [NB10]. The early-access page lists store links for
Steam, Epic, PlayStation and Xbox [NB9].

**Other details.** The page carries a `darkreader-lock` meta tag, which tells the Dark Reader browser
extension not to recolor it, and a web app manifest [NB9]. 20 of 36 images had no `alt` [NB9].

**Accessibility probe.** No skip link. 48 of 51 stylesheets are cross-origin (web.poecdn.com) and
unreadable, so "0 reduced-motion rules" is *unverified* [NB9].

## Changes since 2024

- **Early access, December 2024.** Path of Exile 2 entered paid early access on 6 December 2024 after
  a three-week delay; the director said the delay came from merging account systems across Path of
  Exile 1, Path of Exile 2 and console realms [NB12, 2024-10-29]. That shared account is what the
  "Switch games" toggle in the account bar sits on top of [NB10].
- **Full release date, August 2026.** GGG announced at Gamescom Opening Night Live that the 1.0
  release is on 11 December 2026 [NB11, 2026-08-25]; the home page banner says the same [NB10]. The
  nav already has a "Full release" item pointing to a registration page [NB9, NB10].
- No article about a redesign of the site itself was found; I did not search GGG's forum archive.

## Techniques worth noting

- **Ornate frames as `border-image`** around live text: the frame stays crisp at any width and the
  label stays real, selectable, translatable text [NB9, NB10].
- **Two-layer header:** a thin publisher/account bar with a game switcher above the game's own nav [NB9, NB10].
- **Timestamped news and live viewer counts** on the home page [NB9, NB10].
- **Off-site links marked** with an arrow in the nav [NB9, NB10].

## Relevance to Project Defeat

This is the closest visual match to the app found in this batch: a dark, serif-led game site using
Cinzel for headings and calls to action, square corners and muted metallic colors [NB9]. Its
`border-image` buttons are a direct technique for the app's bevelled panels and buttons: one sliced
frame image (or an SVG) can replace stacked gradients and box-shadows while the text stays real [NB9, A2]. The
outward-arrow marker on off-site nav items would suit the app's links to Wowhead and other tools [NB9].
