# Blizzard: Battle.net app, blizzard.com, WoW / Diablo IV / Overwatch sites

Looked at: 2026-10-01 (session 1; skip links and shadow-DOM motion rules rechecked in the merge
step). Sources are listed in `../sources.md` (IDs in brackets).

## What I saw on the live sites (2026-10-01)

Inspected in a browser (computed styles and DOM read with a script, plus screenshots of a 1280 x 720
CSS px viewport, downscaled in the capture) [B1-B4].

**One shared component library, many skins.** All four sites (blizzard.com,
worldofwarcraft.blizzard.com, diablo4.blizzard.com, overwatch.blizzard.com) are built from the same
custom elements: `blz-nav`, `blz-masthead`, `blz-button`, `blz-card`, `blz-news`, `blz-carousel`,
`blz-tab-controls`, `blz-platform-select`, `blz-timestamp` and more [B1-B4]. The global nav element
carries a `theme` attribute (for example `theme=wow-site-homepage`) and a `search-url` that points
at the WoW armory search on the WoW site [B1]. Game-specific pieces sit beside the shared ones:
Diablo IV adds `forge-icon` and `cosmetic-section-divider` [B3].

**Per-game type, shared structure.**
- WoW: section headings in Montserrat 600 at about 52 px, body in Open Sans; buttons uppercase
  Montserrat with a thin gold (`#f8b700`) border; the primary button has a 2 px radius and a
  translucent red fill, the secondary a translucent black fill [B1]. The page also loads "Blizz
  Quadrata", but the headings I sampled were the sans face, not the serif [B1].
- Diablo IV: headings in "Old Fenris" (serif) at weight 100, uppercase, in a parchment tone
  (`rgb(210,200,174)`); buttons in Poppins 600, dark red fill, 4 px radius [B3].
- Overwatch: hero line in "Big Noodle Too" (condensed italic display), section heads in "Config"
  uppercase 600, a solid orange "Play Now" button with a 2 px radius [B2].
- blizzard.com (the publisher hub): Poppins headings, Archivo body, **pill-shaped** translucent
  buttons (100 px radius), a game grid with PC / Console / Mobile filter tabs and `blz-game-tile`
  cards [B4].

**Page structure is the same template on each game site:** full-bleed key-art masthead with logo,
one-line pitch, one primary and one secondary CTA; then a "latest updates" news strip; then feature
cards; then purchase/edition comparison; then a social footer [B1-B3]. The WoW home page leads with a
product switcher of three logos (WoW: Forever, Midnight, Classic) above the masthead, so the first
decision a visitor makes is which game version they mean [B1].

**Accessibility (corrected in the merge step).** Session 1 reported no skip link and zero
`prefers-reduced-motion` rules on all four sites, but its probe could not see inside shadow roots.
A re-probe that walked the open shadow roots found a "Skip to Main Content" link on blizzard.com,
Overwatch and Diablo IV (Overwatch and Diablo IV also have "Skip to Footer Content"), and none on
the WoW home page [K1]. Each of the four sites has exactly one `prefers-reduced-motion` rule in its
shadow-root style sheets [K1]. The global nav rendered as a blank bar in the session-1 screenshots
at the moment of capture [B1].

## Battle.net desktop app

- **No redesign dated 2024 or later was found.** The last major front-end overhaul I could date was
  the rollout announced in January 2021 [B5]. It followed a beta announced in 2019 (date from a weak
  fan-news source; Blizzard's own post shows no date) [B6]. Both are background only. Several search
  summaries described the 2021 change as a 2025 update; the dated article does not support that, so
  they were not used [B5].
- What that 2021 work claimed, for context: games as icons in a horizontal bar, favorites, full-page
  news, a single notifications hub, and keyboard / screen-reader / contrast improvements [B5].
- The app itself is a desktop install; I did not install or inspect it.

## Changes since 2024 that touch the web UI

- **WoW site refresh, late August 2026.** Archived copies of the WoW home page show a change between
  2026-08-25 and 2026-09-04 (a "System Requirements" entry appears) [B12]. The live home page gathers
  news, the current and Classic versions, subscriptions and system requirements on one page [B1].
  A weak source adds that the WoW Token price now shows in the world-status area and that pages got a
  more cohesive look; those details are *unverified* [B8].
- **Armory for Classic, by 2026-08-27.** The earliest archived copy of the Armory page, from
  2026-08-27, already lists Burning Crusade Classic and Mists of Pandaria Classic [B11]. That it
  shipped without a news post comes only from a weak source and is *unverified* [B9]. I opened the
  Armory on 2026-10-01: a hero band, then three controls in a row: **Game Version** (World of
  Warcraft, World of Warcraft Classic, Burning Crusade Classic, Mists of Pandaria Classic),
  **Region**, and a character/guild **Search** field; below that a "Log In to View Your Characters"
  prompt [B10]. At this 1280 px viewport the global nav was collapsed to a menu icon, the WoW crest
  and an account icon [B10]. So Blizzard itself now offers TBC Classic character pages, which is
  directly adjacent to Project Defeat's planner [B10].
- Overwatch 2 was renamed back to "Overwatch" from the season starting 2026-02-10 [B13]; the live
  site's logo and title read "Overwatch" [B2]. The rename was carried by the same shared component
  system without a visible structural change [B2, B13].

## Techniques worth noting

- **Design-system-as-web-components** so one team can theme a nav, button and card per franchise
  [B1-B4].
- **Theming by token, not by layout:** the same masthead / news / card order with a different
  display face, accent color and button radius per game [B1-B3].
- **Platform chrome stays neutral** (Poppins/Archivo, pill buttons, blue-navy surface on
  blizzard.com) while game pages go fully in-world [B4].
- **Version switcher first** on WoW, because the same brand now means several games [B1, B10].

## Relevance to Project Defeat

Project Defeat already themes by token (`[data-faction='horde']` swapping surfaces and metal), which
is the same idea Blizzard uses across franchises [A2, B1-B4]. WoW's own site uses a gold hairline
border and near-square (0 to 2 px) corners on its buttons, close to the app's `--radius: 2px` and
metal-edge lines [A2, B1].
