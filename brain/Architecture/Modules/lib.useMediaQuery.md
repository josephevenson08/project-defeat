---
type: module
layer: lib
source: src/lib/useMediaQuery.ts
lines: 55
generated: true
tags: [brain/architecture, layer/lib]
---

# lib.useMediaQuery

`src/lib/useMediaQuery.ts` · **lib** layer · 55 lines

From the top of the file:

> Whether a CSS media query currently matches, kept in sync as the viewport changes.
> 
> This exists because one layout decision genuinely cannot be expressed in CSS: below 900px the
> stat rail collapses behind a disclosure, and a *collapsed* section should not have its rows in the
> document at all. Hiding them with `display: none` would leave a screen reader announcing a
> heading with nothing under it and would keep the entrance animation querying elements nobody can
> see. Everything else about the responsive layout stays in `global.css`, where it belongs.
> 
> **`useSyncExternalStore` rather than `useState` plus a listener.** The `change` event is the
> documented API and it is genuinely reliable in a real browser — a window being dragged, a phone
> rotating. What it is not reliable under is **CDP viewport emulation**, which is how this app gets
> checked at 375px: changing the emulated viewport from 1425px to 375px was measured delivering
> **zero** `resize` and **zero** `change` events, while `matchMedia(...).matches` flipped correctly.
> An implementation that only writes state from those events therefore renders a mobile rail on a
> desktop viewport indefinitely, which is what the first version of this hook did.
> 
> React asks this store for the answer on every render pass, so a missed event costs a stale frame
> that the next unrelated render repairs — verified: switching planner sub-tab restored the desktop
> rail with no media event having fired. `resize` is subscribed alongside `change` as belt and
> braces; under emulation neither arrives, and the snapshot re-read is what actually saves it.
> 
> The practical stake is small — nobody resizes a phone across 900px mid-session — but a hook that
> is only correct when an event arrives is the kind of thing that is discovered much later and by
> someone else.

## Exports

**function** — `useMediaQuery`

## Imports

_None._

## Imported by

- [[features.character.CharacterRail]] — `src/features/character/CharacterRail.tsx`
- [[features.stats.StatsRail]] — `src/features/stats/StatsRail.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
