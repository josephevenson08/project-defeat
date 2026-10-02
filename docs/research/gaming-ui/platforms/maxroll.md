# Maxroll.gg

Looked at: 2026-10-01. Session 2, batch C. Source IDs refer to
`../sources.md`. Pages inspected in the Claude browser pane at a 1024 x 768 CSS px viewport
(`innerWidth` 1024), measured by computed-style script; screenshots timed out, so nothing here is
from a screenshot [NC10-NC12]. Maxroll has no WoW Classic or TBC content: its WoW section is retail
only (talent trees, guides, tier lists; no planner or sim) [NC15]. I therefore studied its
**Diablo IV planner and a planner-backed build guide**, the closest analogue to Project Defeat's
gear planner.

## What I saw (2026-10-01)

### Shell

- **Cross-game shell**: a left rail of game icons (Minecraft Dungeons 2, PoE 2, Diablo IV, PoE,
  Last Epoch, Diablo II, Borderlands 4, WoW, Clair Obscur, Diablo III, Lost Ark, Blue Protocol),
  a "Browse Games" menu where each game carries a genre tag (ARPG, MMORPG, Looter Shooter), a
  "Search Maxroll" field, a live-streamer chip and Sign In [NC10, NC11]. Same pattern as U.GG and
  Mobalytics (T1, T2).
- **Per-game sub-nav** for Diablo IV: Home, Getting Started, Build Guides, Meta, Tier Lists,
  Bosses, Resources, World Map, D4Planner, Community Builds [NC11].
- **Theme**: near-black `rgb(10,10,10)` page, `rgb(232,232,232)` text, Source Sans 3 at 16 px; one
  `prefers-color-scheme` rule found, 0 to 1 `prefers-reduced-motion` rules; no skip link
  [NC10, NC11]. Pagination buttons and set tabs are 6 to 8 px rounded on near-black greys (`rgb(18,18,18)` to
  `rgb(23,23,23)`) [NC10, NC12].
- **Game fonts loaded only for game content**: the planner page also loads DiabloOldFenris,
  DiabloSerif and Exocet alongside the site's Source Sans [NC11]; presumably for in-game-style item
  tooltips (*unverified*; I could not open a tooltip without a screenshot).
- **Home page**: a "Season ongoing" countdown, then a "Gaming" list of guide updates and a "Latest
  news" feed where every item shows game, author and date, e.g. "by Ava, October 1, 2026" [NC10].
- **Ownership and ads**: the footer reads "Maxroll a brand of IGN Entertainment" with Ziff Davis
  terms [NC11]. The guide page created 26 iframes, nearly all ad and ad-sync frames, and an "Ad-free"
  upsell sits in the sub-nav [NC12].

### The planner (D4Planner, empty profile)

- **Context header above the build** (seen): class select, level, New Profile / Save / My
  Profiles, then **"Season 15: Hell's Legacy"** on the left and a muted grey **"Game version:
  3.2.1.73552"** on the right (14 px, `rgb(149,152,155)`) [NC11]. The home page the same day
  carried 3.2.2 patch notes [NC10], so the label shows which build the data reflects even when it
  lags a hotfix.
- **Variants** (Variant 1, Edit) let one profile hold several builds [NC11].
- **One long page of collapsible sections**, in game order: Equipment (with Stat Priority and slot
  list Helm to Soul Shards, then Pros / Cons), Skills (Tree / List toggle, "0 points spent",
  "Available Points 83"), Paragon ("Available Points 342", boards, glyphs, attribute totals),
  Mercenary, War Plans, Summary, Loot Filters [NC11]. **Every section has its own rich-text Notes**
  box [NC11].
- **Stats panel** at the end, grouped Core / Resistances / Offensive / Defensive / Utility / PvP,
  with a difficulty context ("Torment IV") at its head [NC11].
- The planner itself starts about 1,000 px down the page at this width, below the intro copy, a
  tier-list prompt and an ad block [NC11].

### A planner-backed build guide (Heartseeker Rogue)

- **Byline block**: author, **season ("Season 15 - Hell's Legacy")**, **"Last Updated: September
  27, 2026"**, content tag (Endgame), Follow, and quick links to Changelog, FAQ, Get Link [NC12].
- **The guide's sections mirror the planner's**: Introduction, Equipment, Skills, Paragon,
  Mercenary, Loot Filter, FAQ & Mechanics, Summary, Changelog, with a numbered table of contents
  [NC12]. The planner is embedded as page blocks (class names `PlannerPageBlock`,
  `D4PlannerProfileSets`), not an iframe [NC12].
- **Set switcher**: seven named gear/skill sets, "GoD Starter" through "GoD Tower Push" and "OG
  Heartseeker", as 8 px-rounded buttons; one click swaps every embedded section [NC12].
- **Dated changelog** at the end (Sep 16, 18, 23) [NC12].
- Section headings carry a blue accent `rgb(5,122,240)` bar [NC12].

## Changes since 2024 (from dated sources)

- **PoE2Planner, 2024-12-15**: Maxroll and community builds browsable inside the planner with
  class filters and search, a rating system for community builds, notes in the planner, a header
  showing more build details, mobile improvements, and a public / private toggle [NC13].
- **D4Planner, reported 2026-04-30** (company post on X, read from a search snippet only;
  *unverified*): War Plans added to the planner and to generated build guides, paragon shortcodes
  in notes, Talisman and skill-tree updates [NC14]. The War Plans section and Talisman slot are
  present on the live planner [NC11], which is consistent.

## Techniques worth noting

- **Season name and exact game build printed in the planner header.** [NC11, NC12]
- **Guide = planner**: the article is laid out in the planner's own sections and embeds its sets,
  so reading and editing a build use the same structure [NC11, NC12].
- **Named set progression** (starter to endgame to a special case) switchable in place [NC11, NC12].
- **Notes per section**, not one free-text box per build [NC11, NC12].
- **Points spent / available** counters on each tree [NC11, NC12].
- **Last Updated date plus dated changelog** on every guide [NC11, NC12].

## Relevance to Project Defeat

Maxroll is the strongest model for joining guide text and a planner [NC11, NC12]. Project Defeat already keeps
BiS lists per phase; Maxroll's pattern would put a phase or build-stage switcher (Pre-raid, P1 to
P5) at the top of a spec page and have gear, gems and talents all follow it [NC12, A2]. The "Game version" and
"Last Updated" lines are a direct fit for the app's provenance needs [NC11, NC12]. The ad load (26 iframes on a
guide) and a planner that starts 1,000 px down the page are what to avoid [NC11, NC12].
