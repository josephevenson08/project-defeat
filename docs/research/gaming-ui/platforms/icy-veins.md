# Icy Veins

Looked at: 2026-10-01. Session 2, batch C. Source IDs refer to
`../sources.md`. Pages inspected in the Claude browser pane at a 1024 x 768 CSS px viewport
(`innerWidth` 1024), measured by computed-style script; screenshots timed out, so nothing here is
from a screenshot [NC16-NC18]. Main page studied: the **TBC Classic Elemental Shaman gear / best
in slot guide**, the page type that overlaps most with Project Defeat's BiS data [NC17].

## What I saw (2026-10-01)

### TBC Classic hub

- **Hub layout**: an H1 "World of Warcraft TBC Classic Guides and News", a row of topic links
  (Reputation, Tier Lists, Dungeons and Raids, Professions) and one entry per class, then "Latest
  TBC Classic News" [NC16].
- **News items carry relative dates and authors**, e.g. "Burning Crusade Classic Hotfixes,
  September 29th", "1d ago by Starym" [NC16]. Much of the "TBC Classic" news feed was actually WoW
  Forever news [NC16].
- **Theme**: page `rgb(19,19,26)`, Inter throughout (Remix Icon for icons), H1 18 px bold white
  [NC16]. A skip link is present; 1 `prefers-reduced-motion` rule; 0 `prefers-color-scheme` rules;
  4 stylesheets unreadable, so counts are a floor [NC16]. 40 iframes on the hub page, almost all
  ad-related [NC16].
- Footer: owned by Vedatis S.A.S., listing sister brands including U.GG [NC16].

### TBC Classic gear / BiS guide (Elemental Shaman)

- **Guide header**: breadcrumb (Home / TBC Classic / Shaman / Elemental Shaman / Gear), H1
  "TBC Classic Elemental Shaman Phase 5 / Tier 6 Gear and Best in Slot", class / spec / page
  chips, **"Last Updated: Jan 12, 2026 - 12:03 PM (8mo ago)"** with the author [NC17]. The label
  is grey 13 px; the relative age is white 13 px (classes `guide-header__updated-label`,
  `guide-header__updated-relative`) [NC17].
- **Guide sub-nav**: Introduction, Spells, Talents, Rotation, Stats, Enchants, Gear, Pre-Raid Gear
  [NC17].
- **Phase tabs, newest first**: Phase Five, Phase Four, Phase Three, Phase Two, Phase One, with
  Phase Five selected by default [NC17]. Selected tab: `rgb(38,38,52)` fill, 1 px cyan
  `rgb(0,149,195)` border, bold white; others dark with a grey border and grey text; 5 px radius
  [NC17].
- **Each phase block**: the tier set and which boss drops each token piece, the set bonuses in
  plain words, prose on key items, then a **two-column "Slot / Item/Source" table** [NC17].
- **Source printed inline with every item**, in one format: "Cowl of Gul'dan: Kil'jaeden — Sunwell
  Plateau"; non-raid sources use the same slot, e.g. "Jewelcrafting", "Exalted with The Scale of
  the Sands", "41 Badge of Justice", "Coren Direbrew — Blackrock Depths during Brewfest" [NC17].
  Tier tokens are shown in brackets after the piece [NC17].
- **"Other useful gear" table** below each BiS table, alternatives ordered best to easiest [NC17].
- **Item links**: quality-colored (epic `rgb(163,53,238)`, class `q4`), linking to
  wowclassicdb.com with a `data-wowhead` attribute; both wowclassicdb's tooltip script and
  Wowhead's `power.js` are loaded [NC17]. Table cells sit on `rgb(29,29,39)`; table 919 px wide
  [NC17].
- **Changelog at the foot**: "08 Dec. 2025: Updated for TBC Anniversary." and "15 May 2022: Added
  more helm options." [NC17].
- **Provenance gap** (seen): the title says "Phase 5 / Tier 6" while the default tab is Phase Five
  (Sunwell) [NC17]; the same day WoWSims labelled its TBC sims "Phase 3 (2.2 - T6)" [NC5]. A reader
  cannot tell from this page which phase the live servers are in [NC5, NC17].

### Retail guide, for comparison

- The retail Elemental Shaman guide puts a **patch chip "12.1"** above and in the H1 ("Elemental
  Shaman DPS Guide — 12.1"), the same Last Updated line, a sub-nav (Overview, Leveling, Easy Mode,
  Talents, Rotation, Gear, Stats, Enchants, Mythic+, Macros), and a **rating strip** (Damage, Raid,
  Mythic+, Utility, Survivability, Mobility) near the top [NC18].
- It also promotes "The Icy Veins app" and a "WoW Class Codex Addon" [NC18]: a bridge into the
  game client (T10).
- The TBC page uses the same `guide-header` component classes as the retail page [NC17, NC18], so
  the redesign has probably reached the Classic section; this is my inference, not stated anywhere
  I found (*unverified*).

## Changes since 2024 (from dated sources)

- **Redesign beta, 2026-05-19**: Icy Veins launched the first beta of a redesign for its WoW
  Retail section: more curated side links on guides, wider content, interactive rotation and
  talent tools replacing lists, and a dark color scheme with fewer side-panel distractions; other
  sections to follow gradually [NC19]. The announcement reads as a design brief in four lines: easier
  navigation, more width, tools over lists, darker and calmer [NC19].
- **TBC Anniversary update, 2025-12-08** to the gear guide, per its changelog [NC17].

## Techniques worth noting

- **Every item paired with its source** in a fixed "Item: Boss — Instance" format [NC17, NC18].
- **Phase tabs** that keep all phases on one page, newest first [NC17, NC18].
- **"Last Updated" with an absolute timestamp plus relative age** in the guide header [NC17, NC18].
- **Patch chip in the title** (retail) [NC17, NC18].
- **Best and "easier to get" alternatives** in separate tables per phase [NC17, NC18].
- **Dated changelog** at the foot of each guide [NC17, NC18].

## Relevance to Project Defeat

Icy Veins' TBC BiS page is laid out almost exactly like the app's BiS data: phase, slot, item,
source [NC17, A2]. Two things are worth copying: the one-line "Boss — Instance" source format, and the
absolute-plus-relative "Last Updated" stamp [NC17]. One thing to do better: say which phase is live and
which phase a list targets, since Icy Veins' header and WoWSims' status line point at different
phases on the same day, and neither page says which one the live servers are in [NC5, NC17].
