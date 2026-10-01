# Wowhead

Looked at: 2026-10-01. Source IDs refer to `../sources.md`. Page inspected: the TBC Classic item page
for Dragonspine Trophy, in a 1280 x 720 CSS px viewport [W1].

## What I saw (2026-10-01)

- **Game-version strip at the very top**: WoW, Retail, Forever, Classic, **TBC** (highlighted in
  green on a TBC page), Mists, and an overflow "..." [W1]. The version you are in is the strongest
  color on the page.
- **Header**: logo with the version under it ("WOWHEAD TBC"), a wide search field labelled "Search
  guides, news, database...", and sign-in buttons [W1].
- **Text nav**: News, Database, Tools, Guides, Community, Go Ad-Free, More, plus small utility
  icons [W1].
- **Icon-tile hub row** specific to the TBC section: Phase Three, Classes, Leveling, Best in Slot,
  Tier Lists, Raids, Attunements, Dungeons, Reputations, Professions; each a square art thumbnail
  with an uppercase label [W1]. That list overlaps almost exactly with Project Defeat's sections.
- **Item page**: breadcrumb (Database > Items > Armor > Trinkets), the item name as the H1 in a
  display face ("brother-1816"), and a row of actions: Favorite, Pin, Links, "Find upgrades...",
  View in 3D [W1]. A "Phase 1" tag sits next to the item in its tooltip block [W1].
- **Lower tabs carry counts**: "Dropped by (1)", "Guides (39)", "News (3)", "Comments (78)" [W1].
- **Tooltip**: the in-game-style tooltip uses the class `wowhead-tooltip` with a width restriction
  so lines wrap like the game's; item quality is colored (epic purple `rgb(163,53,238)`) and set in
  Verdana inside an otherwise Open Sans page [W1].
- **Theme**: near-black `rgb(16,16,16)` page, light grey text, 14 px Open Sans [W1].
- **Accessibility**: a skip link exists; one `prefers-reduced-motion` rule in readable CSS [W1].
- **Ads**: an autoplaying video ad occupied the area above the breadcrumb, and a display ad sat
  beside the item [W1].

## Changes since 2024 (from dated sources)

- **New features, July 2026**: Wowhead announced news filters and pinned pages, some for Premium
  users and some for everyone logged in [W2, 2026-07-09]. The article body did not load beyond
  promotional blocks, so details are *unverified*; the "Pin" button on the item page [W1] is
  consistent with it.
- **Statement on AI, ads and performance, June 2026**: the new head of content addressed community
  complaints about ads and performance and stated the site does not use AI to write content [W3,
  2026-06-24]. The page body did not load for me; the summary comes from search snippets and a
  Seramate repost dated 2026-06-24. *Unverified* beyond the headline.

## Background (pre-2024, context only)

- A navigation redesign preview was published on 2019-10-30 [W4]. The current top-of-page layout
  likely descends from it; I did not compare.
- The "Find upgrades" button on item pages dates from 2010-05-07 [W5]; long-standing, not modern.

## Techniques worth noting

- **Version context is always visible** and colored.
- **Hub of icon tiles** for the section's main jobs, below the global nav.
- **Tabs with counts** so you know where the content is before clicking.
- **In-game tooltip fidelity**: game fonts, game colors, game line widths.
- **Per-page action bar** (favorite, pin, share links, find upgrades).

## Relevance to Project Defeat

Wowhead is the reference the app's data already cites (tier lists, BiS). Its icon-tile hub matches
the app's SectionPicker idea, and "tabs with counts" is a cheap upgrade for the app's raid / loot
and boss tabs. The ad load is the clearest thing the app does better.
