---
type: module
layer: domain
source: src/domain/talents/sampleTalents.ts
lines: 25
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.talents.sampleTalents

`src/domain/talents/sampleTalents.ts` · **domain** layer · 25 lines

From the top of the file:

> Talent trees, ingested from Wowhead's TBC talent calculator by `tools/ingest/ingest-talents.mjs`.
> 
> **Warrior only so far**, deliberately. Nine classes of talents is comparable in size to the item
> catalogue, so one class is built end to end first — grid, ranks, prerequisites, per-rank
> descriptions — to prove the shape before the other eight are ingested against it. Adding a class
> is a one-line change to `TREES_BY_CLASS` in the ingester plus a re-run.
> 
> Nothing here is hand-written. A talent's name is the name of its rank-1 spell and its description
> is that spell's description, joined from two separate payloads on the calculator page.

## Exports

**function** — `getTalentData`

**const** — `classesWithTalents`

## Imports

- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`

## Imported by

- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
