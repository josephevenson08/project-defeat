---
type: module
layer: domain
source: src/domain/raids/karazhanBosses.ts
lines: 330
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.karazhanBosses

`src/domain/raids/karazhanBosses.ts` · **domain** layer · 330 lines

From the top of the file:

> Karazhan, complete — 147 drops across eleven encounters, plus the raid's notable trash.
> 
> **This file used to say it listed "only the drops that still matter to a Phase 2 raider".** It held
> 45 rows, which was a defensible trim while Karazhan was old content nobody opened in this app, and
> stopped being one when the raid tab grew a card per encounter: clicking Attumen showed three rows
> against a real table of fourteen, and the card's own "3 drops" label made the gap look like a fact.
> 
> The tables now come from `tools/ingest/ingest-raid-loot.mjs`, which reads Wowhead's own embedded
> drop data, so every row carries a real `wowItemId` and is re-runnable rather than remembered. 135
> of the 147 resolve to a catalogue item; the other 12 are tier tokens, enchanting formulas, a
> schematic, a quest reward and the mount — real drops with no stat block here, each flagged and
> saying so rather than rendering as an item with nothing on it.
> 
> Two encounters do not drop their own loot and would silently come back empty if that were ever
> forgotten: the **Chess Event** rewards a chest object rather than Echo of Medivh, and the **Opera
> Event** is three different fights, with the Wizard of Oz loot on The Crone rather than Dorothee.
> The ingest script records where each one actually lives.
> 
> Encounter order is the standard clear route; the tower is only partly linear, and Illhoof, Aran,
> Netherspite and Nightbane sit off the critical path.

## Exports

**const** — `karazhanBosses`

## Imports

- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`

## Imported by

- [[domain.raids.sampleRaidBosses]] — `src/domain/raids/sampleRaidBosses.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
