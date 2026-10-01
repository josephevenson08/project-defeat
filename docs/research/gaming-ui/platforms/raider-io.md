# Raider.IO

Looked at: 2026-10-01. Source IDs refer to `../sources.md`. Page inspected: the home page at a 1280 x 720 CSS px
viewport [RI1].

## What I saw (2026-10-01)

- **Game-version strip at the top**: Retail (highlighted), Forever, Classic Era, Mists [RI1].
- **Search with a keyboard hint**: "Search characters and guilds..." with a visible **Ctrl K**
  shortcut badge and a filter icon inside the field [RI1]. This is the "Ctrl/Cmd+K opens search"
  convention common in web apps, applied to a game site.
- **Nav**: Raids, Mythic+, Recruitment, Talent Builds, Stats, Events (Blizzard-branded), Merch Shop
  (with a NEW badge), Discord Alerts, Extras, Go Premium; a red "Get App & AddOn" button [RI1].
- **Live content up front**: embedded live streams and a row of team / creator avatars with
  YouTube badges, then a "Race to World First" tracker [RI1].
- **Type and theme**: near-black `rgb(17,17,17)` page, 13 px Salesforce Sans body; it also loads
  Friz Quadrata (the WoW UI face), Bebas Neue Pro and other display faces [RI1].
- **Accessibility**: no skip link found; no `prefers-reduced-motion` rule in readable CSS
  (*unverified*, cross-origin sheets not readable) [RI1].
- A large third-party display ad was pinned to the bottom of the viewport [RI1].

## Changes since 2024

- No dated redesign announcement found (search "Raider.IO redesign 2025 new character page UI"
  returned nothing relevant). Nothing here is presented as a 2024+ change except what was seen live.

## Techniques worth noting

- **Ctrl K search** with the shortcut printed in the field.
- **Version strip** identical in purpose to Wowhead's.
- **Live, time-bound content** (race to world first, streams) as the home page lead.

## Relevance to Project Defeat

The visible Ctrl K badge is a small, well-understood way to add global search to a tool that already
has many sections. Raider.IO and Wowhead now both treat "which game version" as the first choice on
the page, which supports the app keeping "TBC Classic · Phase 2" visible at all times (it does, in
the rail brand).
