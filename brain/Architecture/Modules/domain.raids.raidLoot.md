---
type: module
layer: domain
source: src/domain/raids/raidLoot.ts
lines: 261
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.raidLoot

`src/domain/raids/raidLoot.ts` · **domain** layer · 261 lines

From the top of the file:

> What the Raids tab asks of the loot (port step 2, the decided boss journal): where each drop sits
> on every spec's Wowhead Phase 2 list, what kind of drop it is, where it drops, which drops match a
> search across all five raids, and who in a raid wants each one.
> 
> Everything here reads the same data the rest of the app does — the raid files, the item catalogue
> and `bisRankings.json` — so a rank on a loot row cannot disagree with the planner's Ranked Gear.

## Exports

**function** — `lootItem`, `lootKind`, `lootKindLabel`, `lootRankFor`, `lootRanks`, `lootSources`, `lootWowItemId`, `raidDropCount`, `raidersFrom`, `searchRaidLoot`, `setPiecesFor`, `sortLoot`, `whereItDrops`, `whereItDropsText`, `whoWants`

**const** — `firstPicks`, `getWowheadList`, `isContested`, `listKey`, `wowheadLists`

**type** — `LootKind`, `LootRank`, `LootSearchResult`, `LootSource`, `Raider`, `SpecRef`, `Want`, `WowheadList`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`
- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`
- [[domain.raids.sampleRaidBosses]] — `src/domain/raids/sampleRaidBosses.ts`
- [[domain.raids.sampleRaids]] — `src/domain/raids/sampleRaids.ts`

## Imported by

- [[domain.raids.index]] — `src/domain/raids/index.ts`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
