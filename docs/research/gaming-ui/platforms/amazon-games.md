# Amazon Games: New World: Aeternum and Throne and Liberty sites

Looked at: 2026-10-01. Session 2, batch B. Source IDs (NB...) are listed in `../sources.md`. Pages opened
in the Claude browser pane at a **1024 x 768 CSS px** viewport (`innerWidth` 1024) and read with a
computed-style script; the pane was hidden, so **no screenshots**.

## What I saw on the live sites (2026-10-01, 1024 px)

**One component library under both games.** Both sites are built from classes prefixed `ags-`
(Amazon Game Studios): `ags-SiteHeader`, `ags-ButtonV2`, `ags-SlotModule`, `ags-LanguagePicker`
[NB13, NB14]. Throne and Liberty's home page had 517 elements with `ags-` classes [NB14]. Both share
the same skip button, footer structure (social links, "Amazon Game Studios Home Page", Legal / Privacy
/ Cookie / ad-choices links) and "BACK TO TOP" link [NB13, NB14]. Each game swaps in its own faces [NB13, NB14]:

| | New World: Aeternum [NB13] | Throne and Liberty [NB14] |
|---|---|---|
| Display face | IM Fell DW Pica (old-style serif), uppercase, tracked wide (about 0.3 em on section heads) | "Ellipsis" / "TLHeader", uppercase, slightly negative tracking, 58 px |
| UI / body face | Amazon Ember 13 to 16 px | Ellipsis / "TL" light 16 px; footer in "Duty" |
| Page color | dark brown-grey `rgb(39,38,36)` | black `rgb(0,0,0)` |
| Accent | pale gold `rgb(255,241,206)` category labels, peach `rgb(255,219,178)` news titles | bronze `rgb(197,151,104)` on the "Amazon Games iD / FREE REWARDS" block |
| Button radius | 0 px (uppercase, transparent fill) | 0 px (uppercase, transparent fill) |

So this is the Blizzard / Riot pattern again: one shared system, a display face and accent per game
[NB13, NB14].

**Skip link present on both.** Both pages start with a "Skip to main Content" control
(`ags-SiteHeader-skipToMainContent`) [NB13, NB14]. It is a `<button>`, not an anchor, so a probe that
looks only for `<a>` skip links misses it; I found it by its class [NB13, NB14].

**Structure.** New World: an "AVAILABLE NOW" hero with WATCH TRAILER, a NEWS strip of three cards
(category label + title), "Discover the Island of Aeternum" feature carousel, player and press quotes,
then the footer [NB13]. Throne and Liberty: a hero for the current expansion ("THE FROZEN DIVIDE:
NIX") with DOWNLOAD FOR FREE NOW and WATCH TRAILER, an "Amazon Games iD" account-linking block listing
free rewards with a LINK ACCOUNT button, then RECENT NEWS cards and ALL NEWS [NB14]. Neither home page
has a site search field [NB13, NB14].

**News cards carry a category but no date** on either home page (for example "General", "Update")
[NB13, NB14]. This runs against the first-run trend of printing dates next to news (T5) [NB13, NB14].

**Defects seen.**
- On Throne and Liberty the four news-card titles computed to `rgb(0,0,238)`, the browser's default
  link blue, on the dark card variant (`...info-heading--darkBackground`) [NB14]. I could not take a
  screenshot to confirm how it looked, so the visual effect is *unverified*; the computed value is
  what the page reported.
- On New World the footer logo link's accessible name is the raw translation key
  `footer.nav.newWorldLogoLink` [NB13].
- 20 of 24 images (New World) and 17 of 35 (Throne and Liberty) had no `alt` [NB13, NB14].
- No readable `prefers-reduced-motion` rule on either (1 unreadable sheet each, so *unverified*)
  [NB13, NB14].

## Changes since 2024

- **New World stops new content (October 2025).** Amazon said Season 10 and the Nighthaven update
  would be the last content release, with servers kept up through 2026 [NB15, 2025-10-28]. Engadget
  tied this to Amazon's company-wide layoffs and its cutback on in-house MMO development [NB27,
  2025-10-30]. (Batch B first cited Insider Gaming here; it was re-tiered Weak and replaced in the
  merge step.)
- **New World shutdown date (January 2026).** Amazon announced the game is delisted and goes offline
  on 31 January 2027, with in-game currency sales ending 20 July 2026 [NB16, 2026-01-15]. The live
  home page still leads with "AVAILABLE NOW" and these posts appear in its news strip [NB13].
- **Throne and Liberty changes publisher (August 2026).** Amazon announced it will hand Western
  publishing back to NC (through FirstSpark Games) from Q4 2026, with accounts transferring
  automatically [NB17, 2026-08-12]. The live footer already links an "NC THRONE AND LIBERTY SITE" and
  shows an NC logo [NB14].
- No redesign announcement for either site was found.

## Techniques worth noting

- **Shared `ags-` library with per-game faces**: the same evidence for T1 as Blizzard and Riot [NB13, NB14].
- **Square, transparent, uppercase buttons** on both game sites (supports T7) [NB13, NB14].
- **Account-link block as a content section** ("Amazon Games iD" with listed rewards) [NB13, NB14].
- **Skip link as the first control** on both sites [NB13, NB14].

## Relevance to Project Defeat

Amazon's two sites show a cheap way to run several themed products from one library: keep the
header, buttons, cards and footer identical and swap only faces and three or four color tokens [NB13, NB14]. The
app's Alliance / Horde token swap is the same idea at smaller scale [A2]. The Throne and Liberty link-blue
titles are a reminder to set link colors inside every themed card variant, not just on the page [NB14].
