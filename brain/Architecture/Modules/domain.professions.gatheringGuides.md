---
type: module
layer: domain
source: src/domain/professions/gatheringGuides.ts
lines: 470
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.gatheringGuides

`src/domain/professions/gatheringGuides.ts` · **domain** layer · 470 lines

From the top of the file:

> The gathering climbs, one range at a time.
> 
> **Written here, not taken from anywhere.** `professionTypes.ts` records the standing rule that
> wow-professions.com's routes and orderings are linked and never copied; the same applies to every
> other guide this file cites. What is borrowed is the *shape* — prose, then a table, then maps —
> because that shape answers the questions in the order a player asks them. The claims inside it
> were each checked against at least two published guides and against this repo's own Wowhead
> ingest, and every range records which.
> 
> **The skill requirements were not taken on trust and did not need correcting.** All thirteen ore
> requirements and all thirty-two herb requirements published by icy-veins.com and
> warcrafttavern.com agree with each other exactly, and agree with the `requiredSkill` this repo
> read off Wowhead's own object pages during the node ingest — 45 of 45. One web search summary
> disagreed, putting Fel Iron at 275; three detailed sources say 300 and so does the ingest, so the
> summary is simply wrong. It is recorded here because "I checked and nothing moved" is a result,
> and the next person to wonder whether it is worth re-checking should be able to see that it was.

## Exports

**const** — `gatheringGuides`

## Imports

- [[domain.professions.gatheringRangeTypes]] — `src/domain/professions/gatheringRangeTypes.ts`

## Imported by

- [[domain.professions.gatheringPlan]] — `src/domain/professions/gatheringPlan.ts`
- [[domain.professions.index]] — `src/domain/professions/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
