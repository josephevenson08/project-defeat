# Blizzard: Battle.net app, blizzard.com, WoW / Diablo IV / Overwatch sites

Looked at: 2026-10-01. Sources are listed in `../sources.md` (IDs in brackets).

## What I saw on the live sites (2026-10-01)

Inspected in a browser (computed styles and DOM read with a script, plus screenshots of a 1280 x 720 CSS px
viewport, downscaled in the capture).

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
  translucent red fill, the secondary a translucent black fill [B1]. The page loads "Blizz Quadrata"
  too, but the headings I sampled were the sans face, not the serif.
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

**Not seen / could not check.** The global nav rendered as a blank bar in my screenshots at the
moment of capture (it is a shadow-DOM component and its links were not readable from the page
script). My count of `prefers-reduced-motion` rules was zero on every site, but that count cannot see
inside shadow roots, so whether these components honor reduced motion is *unverified*. No skip link
was found in the light DOM on any of the four pages.

## Battle.net desktop app

- **No redesign dated 2024 or later was found.** The last major front-end overhaul I could date was
  the rollout announced in January 2021 (Engadget, 2021-01-15) [B5], following a beta announced in
  2019 [B6]. Background only, not "modern" for this research. Several search summaries described
  that 2021 change as a 2025 update; the dated articles do not support that, so I did not use them.
- What that 2021 work claimed, for context: games as icons in a horizontal bar, favorites, full-page
  news, a single notifications hub, and keyboard / screen-reader / contrast improvements [B5].
- The app itself is a desktop install; I did not install or inspect it.

## Changes since 2024 that touch the web UI

- **WoW site refresh, August 2026.** Aroged reported that the WoW home page now gathers current news,
  the current and Classic versions, subscriptions and system requirements on one page, shows the WoW
  Token price in the world-status area, and has a more cohesive visual design across pages [B8,
  2026-08-31]. No Blizzard statement was quoted. This matches what I saw on the home page [B1].
- **Armory for Classic, late August 2026.** The official Armory gained Classic versions without a
  news post; players noticed it first (Bolverk Games; Icy Veins' article returned 403) [B9,
  2026-08-29]. I opened the Armory on 2026-10-01: a hero band, then three controls in a row:
  **Game Version** (World of Warcraft, World of Warcraft Classic, Burning Crusade Classic, Mists of
  Pandaria Classic), **Region**, and a character/guild **Search** field; below that a "Log In to View
  Your Characters" prompt [B10]. At this 1280 px viewport the global nav was collapsed to a menu icon, the WoW
  crest and an account icon [B10]. So Blizzard itself now offers TBC Classic character pages,
  which is directly adjacent to Project Defeat's planner.
- Overwatch 2 was renamed back to "Overwatch" in February 2026 [B7]; the live site's logo and title
  read "Overwatch" [B2]. A naming change, but it shows a rebrand being carried by one shared
  component system without a structural redesign.

## Techniques worth noting

- **Design-system-as-web-components** so one team can theme a nav, button and card per franchise.
- **Theming by token, not by layout:** the same masthead / news / card order with a different
  display face, accent color and button radius per game.
- **Platform chrome stays neutral** (Poppins/Archivo, pill buttons, blue-navy surface on
  blizzard.com) while game pages go fully in-world.
- **Version switcher first** on WoW, because the same brand now means several games.

## Relevance to Project Defeat

Project Defeat already themes by token (`[data-faction='horde']` swapping surfaces and metal), which
is the same idea Blizzard uses across franchises. WoW's own site uses a gold hairline border and
near-square (0 to 2 px) corners on its buttons, close to the app's `--radius: 2px` and metal-edge
lines.
