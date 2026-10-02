# Riot Games: Riot Client, leagueoflegends.com, playvalorant.com

Looked at: 2026-10-01 (session 1; skip links rechecked in the merge step). Source IDs refer to
`../sources.md`.

## What I saw on the live sites (2026-10-01)

Inspected in a browser (computed styles, DOM, screenshot of a 1280 x 720 CSS px viewport) [R1, R2].

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

**Not found:** no skip control of any kind (link or button, light DOM or open shadow roots) on either
page, confirmed by the merge-step re-probe [K1]. No `prefers-reduced-motion` or
`prefers-color-scheme` rules in the readable stylesheets; cross-origin sheets could not be read, so
this is *unverified* rather than absent [R1, R2].

## Riot Client and League client (2024 onward)

- **Riot Client as the front door, 2026.** Riot's support FAQ (dated 2026-05-27) says that from 2026
  every Riot game on PC launches through the Riot Client, rolled out to groups of players over time
  [R8]. Riot's stated reason is one place to build shared features (patch notes, news, social,
  esports) instead of rebuilding them in each game [R8]. A weak source reported in April 2026 that
  Riot called the blank screens and launch failures seen in the test bugs; that detail is
  *unverified* [R3].
- **A new League client.** Riot's FAQ ties the change to a League client update in 2027 and a
  standalone TFT client [R8]. GameDaily (January 2026) reported the new client will be fully
  integrated with the in-game experience rather than a separate app beside it [R7]. Bloomberg's
  December 2025 headline reported a plan to remake League; I could not open it (paywall) [R4].
- I did not install the Riot Client; nothing here describes its current screens from observation.

## Background (context only, date unknown)

Riot's UX team published a post about building a modular web design platform [R6]. The page returned
HTTP 403, so only its title is known and its date and content are *unverified* [R6].

## Techniques worth noting

- **Square, flat, single-color CTAs** in each game's signature color, rather than gradients or pills
  [R1, R2].
- **News cards with category + date always visible**, which makes the strip scannable as a feed
  [R1, R2].
- **Dark hero, light body**: long-form reading areas are light even on "dark" game brands [R1, R2].
- **Uppercase condensed display faces** for headings, a neutral sans for everything else [R1, R2].
- **One cross-game top bar** that every game site shares, with the game switcher in the logo [R1].

## Relevance to Project Defeat

League's gold rectangle with square corners and engraved display face is the nearest big-studio
analogue to the app's metal-edge, Cinzel-headed look, and it is current (seen 2026-10-01) [R1, A2].
Riot's always-visible category and date on news cards is a cheap pattern for any list of guides or
updates [R1, R2].
