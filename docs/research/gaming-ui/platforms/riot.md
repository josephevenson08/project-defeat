# Riot Games: Riot Client, leagueoflegends.com, playvalorant.com

Looked at: 2026-10-01. Source IDs refer to `../sources.md`.

## What I saw on the live sites (2026-10-01)

Inspected in a browser (computed styles, DOM, screenshot of a 1280 x 720 CSS px viewport).

**Same template, two games.** Both sites are Next.js apps (a `next-route-announcer` element is
present in each) and share one page skeleton [R1, R2]:
1. A Riot-wide top bar: Riot Games logo with a dropdown (the cross-game switcher), the game's own
   links (Game Overview, Champions, News, Esports...), a search icon, a language globe, and a
   bright "Play Now" button [R1].
2. A full-bleed key-art hero with the game logo, one uppercase sentence saying what the game is, and
   one CTA ("Play for Free") [R1, R2].
3. A "Featured News" / "The Latest" strip of cards. Every card shows a **category label, a date,
   a title and a one-line summary** (for example "GAME UPDATES 9/28/2026") [R1, R2].
4. Light-background sections after the hero: headings and body switch to dark navy text on a pale
   ground, so the page alternates dark key-art and light reading areas [R1, R2].

**Type and buttons.**
- League: display headings in "Beaufort for LOL" (a flared, engraved-looking face), uppercase, 700;
  UI text in "Spiegel"; primary button a flat **gold (`#c8aa6e`) rectangle with square corners**
  (0 px radius) and dark text [R1].
- VALORANT: headings in "Tungsten" (very condensed), uppercase, slightly tracked; buttons in DIN Next,
  **VALORANT red (`#ff4655`), square corners** [R2]. Inter and a set of Noto faces load for
  localisation [R2].

**Not found:** no skip link in the DOM of either page; no `prefers-reduced-motion` or
`prefers-color-scheme` rules in the readable stylesheets (cross-origin sheets could not be read, so
this is *unverified* rather than absent).

## Riot Client and League client (2024 onward)

- **Client as hub.** In April 2026 Riot confirmed it was testing a launch flow where the Riot Client
  opens first and League opens from it, so the game client stays lean and the Riot Client carries
  updates, events, esports and social [R3, 2026-04-11]. Riot called the reported blank screens and
  launch failures bugs, not intended behavior [R3].
- **"League Next".** Reported in December 2025 as a ground-up modernization of League targeted at
  2027, including a new client that is integrated with the in-game experience rather than a separate
  app beside it [R4, 2025-12-18; R5, 2025-12-19]. I could not open the Bloomberg piece (paywall) or
  GameSpot's summary (HTTP 403), and I did not open the BigGo page either; details here come from
  search-result snippets only, so the client specifics are *unverified* beyond "a new client is
  planned".
- I did not install the Riot Client; nothing here describes its current screens from observation.

## Background (pre-2024, context only)

Riot's UX team wrote about building a shared modular web platform so players would not relearn
patterns on every Riot site (Medium, Riot Games UX Design). The page returned HTTP 403 and I could
not confirm its date, so it is background and *unverified*.

## Techniques worth noting

- **Square, flat, single-color CTAs** in each game's signature color, rather than gradients or pills.
- **News cards with category + date always visible**, which makes the strip scannable as a feed.
- **Dark hero, light body**: long-form reading areas are light even on "dark" game brands.
- **Uppercase condensed display faces** for headings, a neutral sans for everything else.
- **One cross-game top bar** that every game site shares, with the game switcher in the logo.

## Relevance to Project Defeat

League's gold rectangle with square corners and engraved display face is the nearest big-studio
analogue to the app's metal-edge, Cinzel-headed look, and it is current (seen 2026-10-01). Riot's
always-visible category and date on news cards is a cheap pattern for any list of guides or updates.
