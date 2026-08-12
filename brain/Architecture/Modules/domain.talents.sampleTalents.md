---
type: module
layer: domain
source: src/domain/talents/sampleTalents.ts
lines: 53
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.talents.sampleTalents

`src/domain/talents/sampleTalents.ts` · **domain** layer · 53 lines

From the top of the file:

> Talent trees, ingested from Wowhead's TBC talent calculator by `tools/ingest/ingest-talents.mjs`.
> 
> All nine classes, 579 talents across 27 trees. Warrior was built end to end first — grid, ranks,
> prerequisites, per-rank descriptions — to prove the shape; the other eight then came from the same
> payload with no change to the parser, only tree ids.
> 
> Nothing here is hand-written. A talent's name is the name of its rank-1 spell and its description
> is that spell's description, joined from two separate payloads on the calculator page.
> 
> **Six of the 27 trees are named something else in the payload**, in Vanilla-era internal terms, and
> every one was confirmed by reading the tree's contents rather than trusting the label:
> Paladin `Combat` is Retribution (it holds Benediction and Improved Seal of the Crusader), Warlock
> `Curses` is Affliction and `Summoning` is Demonology, Shaman `ElementalCombat` is Elemental, Druid
> `FeralCombat` is Feral, and Hunter `BeastMastery` is Beast Mastery.

## Exports

**function** — `getTalentData`

**const** — `classesWithTalents`, `talentIconNames`

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
