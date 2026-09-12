---
type: module
layer: domain
source: src/domain/bis/rankedSource.ts
lines: 336
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.bis.rankedSource

`src/domain/bis/rankedSource.ts` · **domain** layer · 336 lines

From the top of the file:

> Turns Wowhead's free-text "Source" column into the structured `RankedGearSource` the app can query.
> 
> **The data was always there and was always unusable.** Every one of the 1,430 ranked rows carries a
> source string from the guide — `Drop: (Serpentshrine Cavern)`, `Profession: Tailoring - BoP only`,
> `Vendor: (41 Badges of Justice)` — and `bisLists` was folding it into the free-text `notes` field.
> A reader could see it; nothing could ask a question of it. "Which of my BiS pieces drop in SSC" and
> "what do I have to craft" were unanswerable against data that already held both answers.
> 
> So this parses rather than re-sources. The JSON stays the raw pinned scrape — typos included, see
> below — and the interpretation lives here where it can be tested, which is the same split the rest
> of the ingest uses.
> 
> **Nothing here guesses a type.** A string this cannot classify keeps whatever it *did* yield —
> usually the instance name — and leaves `type` undefined, because absent means unknown and `'Other'`
> would be an invented answer. `UNCLASSIFIED_INSTANCES` is asserted empty by a test, so a guide
> revision that adds an instance fails loudly instead of quietly widening the unknown pile.

## Exports

**function** — `parseRankedSource`

**const** — `UNCLASSIFIED_INSTANCES`

## Imports

- [[domain.bis.bisTypes]] — `src/domain/bis/bisTypes.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.bis.index]] — `src/domain/bis/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
