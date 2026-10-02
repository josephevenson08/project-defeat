# UI refresh: plan

**Status: planned, not started.** Written 2026-10-02 and waiting on the owner's go-ahead. Nothing in
the app has changed yet.

This plan turns the [gaming UI research](../research/gaming-ui/README.md) (25 platforms, 2024 to
2026, every claim cited) into work on Project Defeat. Each item names the recommendation it comes
from in [`recommendations.md`](../research/gaming-ui/recommendations.md) (R1–R12), so the reasoning
and sources can be traced back.

**The headline from the research:** the strongest trend across all 25 platforms, and in the four
tools closest to this app (WoWSims, Icy Veins, Maxroll, Blitz), is printing phase or patch, source,
and how old the data is right beside the numbers. Phase 2 below is that.

---

## Phase 1: small wins

About one session, low risk, and visible right away.

| # | Change | From | Where |
| --- | --- | --- | --- |
| 1.1 | **Tab title and link previews.** Change the browser tab title from `project-defeat` to "Project Defeat: TBC Phase 2 Planner". Add a meta description and Open Graph / Twitter tags with `docs/images/social-preview.jpg` (copied into `public/`), so a link pasted into Discord shows a proper card. | Found during the code check; not in the research | `index.html`, `public/` |
| 1.2 | **Preload the heading font.** The loading intro briefly draws its title in a fallback serif before Cinzel arrives. Add `<link rel="preload">` for `cinzel-variable.woff2`. Check the built `href` gets the `/project-defeat/` base path. | R7 | `index.html` |
| 1.3 | **Section and change colors as tokens.** The five section hues are hex strings in `SectionPicker.tsx`. Move them to `--section-*` tokens on `:root`, and add a shared `--delta-up` / `--delta-down` pair for Compare and Ranked Gear. The site should look identical afterwards. | R6 | `src/styles/global.css`, `src/components/layout/SectionPicker.tsx` |
| 1.4 | **"Import your character" in the empty planner**, as an equal second option beside "Equip the recommended set". It opens the same `/pdexport` paste flow as the front page. (The research's original "export to addon" idea isn't possible: the addon only reads the game, it can't write to it.) | R5 | `src/features/gear/GearPanel.tsx` |

## Phase 2: show where the data comes from

The top recommendation from the research.

| # | Change | From | Where |
| --- | --- | --- | --- |
| 2.1 | **Provenance chip.** One small component, e.g. "Wowhead · Phase 2 · updated 12 Sep (3 wk ago)". Use it in tier list headers (moving the source link up from the panel foot), BiS rows and loot rows. | R2 | new component; `TierListsPanel.tsx`, `BisPanel.tsx`, raid loot views |
| 2.2 | **Record when each dataset was fetched.** The data has no dates today, so the chip's date must come from the ingest scripts writing a `fetchedAt` date into their JSON. That gives an honest "data as of" date, never an invented one. | R2 | `tools/ingest/*` (BiS, recommendations, tier lists, raid loot), their JSON outputs |
| 2.3 | **"TBC Classic · Phase 2" chip in the top bar on every screen**, not only inside the planner. If more phases arrive, this becomes the phase switcher. | R4 | `AppShell.tsx` |
| 2.4 | **Counts in tab labels**, e.g. "Ranked Gear (14)". `TabDefinition` gains an optional `count`. | R2 | `TabNav.tsx` and the tabs that use it |
| 2.5 | **One plain-language line on the stat strip**, e.g. "Hit: 1.2% under cap", only where the app already knows the cap. | R11 | stat strip component |

## Phase 3: search across the whole app

| # | Change | From | Where |
| --- | --- | --- | --- |
| 3.1 | **Global search with Ctrl K.** A search field in the top bar that finds items, bosses, specs and professions, jumps straight to them, and shows recently viewed items before you type. The placeholder teaches the query ("Dragonspine Trophy, Gruul, Fury"). It builds an index over the data already in `src/domain`, with no backend. The gear slot filter stays as the local filter. | R1 | `AppShell.tsx`, new search component |

---

## Not now

- **Phase presets beside "Equip the recommended set" (R10).** The BiS data holds Phase 2 only, so
  this first needs Pre-raid and Phase 1 lists ingested through `tools/ingest/ingest-bis.mjs`. It is
  its own data project.
- **Labelling how finished each simulation is (R12).** Only worth doing if some specs' simulations
  are clearly less complete than others.
- **Keep as they are (R3, R8, R9).** The square, dark, Cinzel-headed look matches how game-themed
  sites look in 2026. The accessibility work (skip link, focus rings, reduced motion) is ahead of
  most of the genre. The two-level navigation shouldn't get deeper.

## How each phase ships

1. One commit per phase, or per item for the bigger ones.
2. New tests for each change, plus the full Playwright suite, `npx tsc -b`, lint and build.
3. Checked in the browser, with screenshots before and after.
4. Pushed after the owner approves, since a push changes the live site.

## Open questions for the owner

- Start with Phase 1, or reorder?
- Approve each push, or push each phase once it passes?
- For 2.2, is the date the data was *fetched* the right "updated" date to show? (The alternative,
  when the source last changed its page, isn't reliably available.)
