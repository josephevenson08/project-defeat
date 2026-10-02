# HoYoverse: Genshin Impact and Honkai: Star Rail sites, HoYoLAB, HoYoPlay

Looked at: 2026-10-01. Session 2, batch B. Source IDs (NB...) are listed in `../sources.md`.
Pages were opened in the Claude browser pane at a **1024 x 768 CSS px**
viewport (`innerWidth` 1024, logged on every page) and read with a computed-style script. The pane
was hidden during this session, so **no screenshots** were possible; everything below comes from the
DOM and computed styles, not from looking at the rendered page.

## What I saw on the live sites (2026-10-01, 1024 px)

**Game sites are art pages built from one in-house block system.**
- genshin.hoyoverse.com/en/ and hsr.hoyoverse.com/en-us/ both render most of the page out of elements
  with `pz-` class names (843 on Genshin, 377 on Star Rail) [NB1, NB2]. On Star Rail the page scripts
  load from `act.hoyoverse.com/puzzle/hkrpg/...`, so the `pz-` prefix appears to be a shared "puzzle"
  page builder [NB2]. That the same builder runs every HoYoverse game site is my inference from two
  sites, *unverified*.
- Neither page has an `h1`, `h2` or `h3` in the DOM; titles are styled `div`s or images [NB1, NB2].
- Star Rail has 101 `img` elements and none carries `alt` text [NB2]. Genshin's visible images also
  had empty `alt` attributes [NB1].
- Genshin's top items (Redeem Codes, Top-Up Bonus, Official Site, PC Download) are not `<a>` links:
  the only visible anchors on the page were footer links and two logos [NB1].

**Viewport-scaled type.** The root font size is set from the viewport, not fixed: 53.3 px on Genshin
and 72.9 px on Star Rail at 1024 px wide, which makes body text come out at odd sizes such as 9.07 px
and 13.87 px [NB1, NB2]. The whole page scales like a picture rather than reflowing [NB1, NB2]. On Genshin the
body has `overflow: hidden` and the document is exactly one viewport tall, so it behaves as a
full-screen slide deck, not a scrolling page [NB1]. Star Rail scrolls (3,808 px tall) [NB2].

**Type and color.** Each game loads its own subset web fonts with hashed family names (Genshin also
loads one called `hk4e`, the game's internal code name) over a Tahoma / Helvetica fallback [NB1, NB2].
Text sits on art; the colors sampled are warm browns and creams on Genshin (`rgb(118,87,65)` on the
Download label, `rgb(255,253,242)` on the event-calendar title) and pale green and blue on Star Rail
(`rgb(234,250,208)`, `rgb(88,147,196)`) [NB1, NB2]. The Download button is an image with a 0 px
radius container; its shape is in the artwork [NB1].

**Content is "what's live this version".** Both home pages lead with the current version number
("Version 7.1 Now Available" on Genshin; Star Rail's page title names Version 4.6), then the new
limited characters or weapons, then numbered event cards ("01 / 05") with start dates [NB1, NB2].
Genshin shows a "Version 7.1 Event Calendar" block [NB1].

**Downloads route to the launcher.** Genshin's PC button reads "PC Download (HoYoPlay)"; Star Rail's
reads "Download via HoYoPlay" [NB1, NB2].

**Accessibility probe.** No skip link and no readable `prefers-reduced-motion` or
`prefers-color-scheme` rule on either game site; 3 of 65 (Genshin) and 1 of 53 (Star Rail) stylesheets
were unreadable cross-origin, so the zero counts are *unverified* [NB1, NB2].

**Cookie notice.** Every HoYoverse page showed a cookie banner with a single "OK" button and a "Learn
more" link; I did not press OK [NB1-NB4].

## HoYoLAB (hoyolab.com, seen 2026-10-01, 1024 px)

- **The first thing it asks is which games you play.** A "Choose content that interests you" dialog
  listed Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, HoYoLAB, Honkai Impact 3rd, Tears of
  Themis and more, with Skip and Submit [NB3]. I skipped nothing and submitted nothing; the dialog
  stayed open while I read the page.
- **Layout:** a top bar with Home / Channel and a central search field; a feed in the main column with
  Following / Recommended / Events tabs; a right rail of tools [NB3].
- **Tools rail:** Check-In, Teyvat Interactive Map, Battle Chronicle, Enhancement Progression
  Calculator, Traveler's Diary, Card Plaza, HoYoSketch and widget links [NB3]. The publisher's own
  community site carries the planner-type tools (calculator, map, stats) beside the feed.
- **Feed cards** print author, relative time and game on one line ("1d ago • Honkai: Star Rail"), then
  topic tags in blue, then view / comment / like counts [NB3].
- **Theme:** dark navy page `rgb(12,15,29)`, white text at 85% / 65% / 45% opacity for three levels of
  emphasis, one blue accent `rgb(85,109,229)`, system font stack (`-apple-system`, Segoe UI ...), no
  web fonts loaded [NB3]. Buttons are rounded (14 to 18 px radius on Skip / Submit / Load more) [NB3].
- **App shell:** a Nuxt app (`window.__NUXT__` present) that rendered empty for about 4 seconds before
  content appeared [NB3].
- Accessibility probe: no skip link; no readable reduced-motion or color-scheme rules (0 of 203
  sheets unreadable, so this count is complete for the light DOM) [NB3].

## HoYoPlay launcher

- **Seen:** hoyoplay.hoyoverse.com is a one-screen download page titled "HoYoverse's One-Stop Game
  Platform", with a single "Download Now" call to action [NB4].
- **Reported (weak sources, *unverified*):** HoYoverse announced HoYoPlay in April 2024 as one PC
  launcher for Genshin Impact, Honkai Impact 3rd and Honkai: Star Rail, replacing separate per-game
  launchers; both articles say the announcement was posted on HoYoLAB [NB5, NB6]. The merge step
  searched reputable outlets and HoYoverse's support site for a better source and found none it could
  load (support pages HTTP 403, HoYoLAB "Loading..." only). Search snippets give 17 June 2024 as
  the date Genshin's PC launcher switched to HoYoPlay; the official news page (Genshin news 124130)
  rendered as an empty shell and the fan wiki returned 402, so that date is *unverified* [NB7].
- I did not install the launcher.

## Changes since 2024

- **One launcher for all PC games:** seen today, where both game sites send PC players to HoYoPlay,
  "One-Stop Game Platform" [NB1, NB2, NB4]. The 2024 date comes from weak sources only and is
  *unverified* [NB5, NB6].
- No dated redesign of the game sites or HoYoLAB was found. Search ("HoYoLAB redesign new version
  update 2025") returned only app-store version pages and fan posts, which I did not use.

## Techniques worth noting

- **Version-as-headline:** the current patch number and its events are the home page [NB1-NB3].
- **Interest picker as onboarding** on the community hub, so the feed is filtered by game from the
  first visit [NB1-NB3].
- **Tools rail beside the feed:** calculators and maps are one click from news [NB1-NB3].
- **Opacity steps for text hierarchy** (85 / 65 / 45 %) on one dark surface, with a single accent [NB1-NB3].
- Counter-lesson: art-first pages built from images and `div`s, with no headings, no alt text and
  viewport-scaled type, are visually rich but weak for screen readers and zoom [NB1-NB3].

## Relevance to Project Defeat

HoYoLAB is the closest HoYoverse surface to this app: a dark hub where the publisher puts a
calculator, a map and character stats next to news [NB3]. Its three-step text opacity and one-accent
palette are a simple way to keep dense panels calm [NB3]. The game sites are a warning more than a model:
the app should keep real headings and alt text even where the look is "in-game" [NB1, NB2].
