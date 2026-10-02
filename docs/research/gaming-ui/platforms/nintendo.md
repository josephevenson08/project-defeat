# Nintendo: nintendo.com (US), the web Nintendo Store / eShop product pages, companion apps

Looked at: 2026-10-01. Session 2, batch A. Sources are listed in `../sources.md` (IDs NA1 to NA7).

## What I saw on the live site (2026-10-01)

Inspected in the Claude browser pane in my own tab, viewport `innerWidth` 1024 px (height 768). Computed
styles and DOM read by script; **no screenshot** (the pane was hidden, so the capture timed out), so
colours of large image areas and the hero are not described.

**One neutral face for everything.** Every text role I sampled on the home page and on a game's store
page uses **Geologica Variable**, body at weight 300 in dark grey (`rgb(72,72,72)`), headings at 600
(28 px H1/H2 on the home page, 21 px H2 on the game page) [NA1, NA2]. No other web font was loaded
apart from a video-player icon face (`NOAVideo`) [NA2]. Text is sentence case, not uppercase [NA1].

**Light page, one red.** No element sets a page background, so the page sits on the browser's white
canvas; the only large filled colour is Nintendo red `rgb(230,0,18)` (`#e60012`) on the CTAs [NA1].
Primary buttons ("Learn more", "Start shopping", "See all news articles") are red with white 18 px
Geologica 600 text and a **6 px radius** [NA1]. Cards round their corners at **8 px** (often split
as 8 px top / 8 px bottom on image and text halves) [NA1].

**A game page is a store page.** The Fire Emblem: Fortune's Weave page lives under `/store/products/`
and uses exactly the same face, grey and red 6 px buy button as the hub; the game gets no display
font or colour of its own [NA2]. Its top block is breadcrumbs (Home / Nintendo Store / Games), an
image carousel, the rating descriptors, a **Version** control (Nintendo Switch 2), an edition picker
and the price/buy button; marketing sections ("Meet the characters", a character gallery) follow
below [NA2].

**Navigation.** The header shows the Nintendo logo, "Nintendo Store", a main menu with three groups
(Explore, Shop, Support), Wish List, Search, cart and Account [NA1]. The search field's placeholder
promises one box for "games, hardware, news, support, and more" [NA1]. Home-page sections, in
order: Featured, Nintendo Today!, Online store, Gaming systems, Nintendo Switch Online + Expansion
Pack, News, Characters, Digital best sellers, Digital new releases [NA1].

**Accessibility signals.** A "Skip to main content" link is the first element on both pages; the
readable CSS has **11 `prefers-reduced-motion` rules** and no `prefers-color-scheme` rules
[NA1, NA2]. The page is a Next.js build (`next-route-announcer` present) with no shadow DOM, so the
probe could read nearly everything (one stylesheet unreadable on the home page) [NA1].

## Changes since 2024

- **Typeface swap, late 2025.** Archived copies of nintendo.com/us from 2024-03-01 through
  2025-10-15 declare **Museo Sans** (plus its rounded, condensed and display cuts); copies from
  2025-12-01 on declare **Geologica** [NA3]. I could not find a Nintendo announcement or press
  article about this change, so its exact date and any stated reason are *unverified*; the
  window comes only from archive captures [NA3]. The change also narrowed the type system from
  several Museo cuts to one variable face [NA3].
- **Store app, November 2025.** Nintendo released a Nintendo Store app for iOS and Android in the
  US, Canada, Mexico, Brazil, several European countries and Japan; it browses the store, shows
  a signed-in player's play activity, and pushes wishlist sale alerts, but sends purchases to the
  web store [NA5, 2025-11-05].
- **"My Nintendo Store" renamed "Nintendo Store", 27 May 2026,** to match the app; Nintendo said
  the service itself does not change [NA4, 2026-05-11]. The live header reads "Nintendo Store"
  [NA1].
- **Nintendo Today!, March 2025.** A phone app with a daily animated calendar of news, filtered by
  the franchises the player picks, plus home-screen widgets [NA6, 2025-03-27]. The web home page
  now has a "Nintendo Today!" section [NA1].
- **Personalisation opt-ins, December 2025.** Nintendo UK told players to enable two account
  settings to get a "Year in Review" and personalised recommendations [NA7, 2025-12-12].

## Techniques worth noting

- **Brand by one colour, not by type.** Nintendo dropped a multi-cut type family for one neutral
  variable sans and lets `#e60012` carry the brand [NA1, NA3].
- **Game pages are product pages first:** version and edition pickers sit above the story
  sections [NA2].
- **One search box across games, hardware, news and support** [NA1].
- **Web plus phone:** news and wishlists moved to apps, purchases stay on the web [NA5, NA6].

## Relevance to Project Defeat

Nintendo is the clearest counter-example in the sample to the "per-game display face" idea: one
neutral face, light background, rounded 6 to 8 px corners, even on game pages [NA1, NA2]. It suits
a family-audience store, not an in-world planner, so it argues against copying the store look
rather than for it [NA1]. The useful borrow is the skip link plus many reduced-motion rules on a
Next.js site [NA1].
