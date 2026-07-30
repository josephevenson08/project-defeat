---
name: roadmap-feature
description: Build a new feature in Project Defeat end-to-end — a new panel, a new tab, a new domain area, or the next roadmap item. Use when the user asks to implement, wire up, or continue a roadmap phase item (save/load builds, gear comparison, rotation modeling, talent trees, encounter settings, addon import), or asks "what's next" on this project.
---

# Building a feature

## Read the state first

`brain/Project/Roadmap Board.md` has the current phase status and the two cheapest real wins.
`brain/Architecture/Architecture Map.md` has the layer rules. Read both before writing code — they
are generated, so they are not stale.

Then check for unmerged work before starting anything new: `.claude/worktrees/` holds throwaway git
worktrees from background agents, and this project has already accumulated finished-but-unwired
features there. `git worktree list` and a diff against `main` take a minute and have twice now
turned out to be where the actual next step was.

## The layer rule

```
components/   presentational shell + primitives, zero domain knowledge
features/     panels + the calculation functions that drive them
domain/       typed TBC rules, formulas, and data
```

**`domain/` must never import from `features/` or `components/`.** Everything else is negotiable;
this is not. It is what keeps the domain reusable and the graph readable.

A new domain area gets its own folder under `src/domain/<area>/` with `<area>Types.ts` for the types
and `sample<Thing>.ts` for the data, plus an `index.ts` barrel if it has more than about three files.

## Wiring a panel into the app

`src/App.tsx` owns all planner state and passes it down; panels are presentational plus a callback.
The tab list is `APP_TABS` and the tab union is `AppTab`. Adding a tab means: add to the union, add to
`APP_TABS`, and render it with `{activeTab === 'x' && <XPanel />}`.

Panels wrap in `<Panel title eyebrow className>`. Wide panels take `grid-column: 1 / -1` via a
`*-panel-shell` class in `src/styles/global.css`.

**Do not add a component that nothing renders.** The most common failure mode in this repo is a
finished panel or a written module that no code path reaches — `buildSerialization.ts` and the raids
panel both sat that way. If you build it, wire it in the same change, or say clearly that you did not.

## Note on `src/styles/global.css`

It uses CRLF line endings. Append with CRLF or the diff shows the whole file as changed.

## Before you call it done

```bash
npx tsc -b        # must be clean — noUnusedLocals is on, so a half-wired import IS an error
npm run lint
npm run build
npm run test      # Playwright; needs a browser (npx playwright install)
npm run brain     # new modules and domain data flow into the vault automatically
```

`npx tsc -b` failing on an unused import is worth pausing on rather than deleting the import: it
usually means someone started wiring something up and stopped, and deleting the import throws away
the intent. Find out what it was for.

## Then update the honest docs

- `README.md` current features and known limitations
- `ROADMAP.md` phase status
- The `PHASES` array in `tools/brain/generate-brain.mjs` — status text is authored there, and the
  roadmap board reads from it

State what is still missing as specifically as what you added. A feature note that reads "rotation
modeling added" when only the caster path uses it is the kind of thing that costs a future session an
hour of confusion.
