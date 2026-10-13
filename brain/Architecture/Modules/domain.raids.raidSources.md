---
type: module
layer: domain
source: src/domain/raids/raidSources.ts
lines: 8
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.raidSources

`src/domain/raids/raidSources.ts` · **domain** layer · 8 lines

From the top of the file:

> When the five raids' loot tables were read from Wowhead, as an ISO date, for the source line under
> the top bar. `tools/ingest/ingest-raid-loot.mjs` records it in each `tools/ingest/data/raid-loot.*.json`
> (all five were read the same day); a test checks this against those files, so a re-ingest that
> forgets to move it fails rather than printing an old date.

## Exports

**const** — `raidLootFetchedAt`

## Imports

_None._

## Imported by

- [[domain.raids.index]] — `src/domain/raids/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
