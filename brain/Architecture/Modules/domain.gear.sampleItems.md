---
type: module
layer: domain
source: src/domain/gear/sampleItems.ts
lines: 3942
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.sampleItems

`src/domain/gear/sampleItems.ts` · **domain** layer · 3942 lines

From the top of the file:

> Hand-written item entries, now a **provenance layer** rather than the catalogue itself.
> 
> Read `src/domain/gear/itemCatalogue.ts` before trusting anything here. Reconciling these entries
> against ingested wowsims data and then against live Wowhead tooltips scored curated 0 / ingested 119
> across every verifiable conflict — so the stats, sockets and item levels below are superseded and no
> longer reach the UI. What survives the merge is the information wowsims has none of: drop location,
> roles, crafting materials, trinket effects.
> 
> Do not add mechanical data here. Re-run `node tools/ingest/ingest-items.mjs` instead.
> 
> ## What `needsVerification` means on an entry here
> 
> **It is about the provenance, not the stats** — for all but one entry. 119 of the 120 flagged
> entries match an ingested row, so `itemCatalogue.ts` builds the item from the ingest and overlays
> only `PROVENANCE_FIELDS`; their stat blocks are dead weight that never reaches the app. Most of
> their notes still say "stats are approximate pending final Wowhead audit", which described a real
> risk when this file *was* the catalogue and describes unused data now. Read such a note as "the
> drop location, vendor and roles are unverified", because that is all the flag can still govern.
> 
> The exception is an entry with **no matching ingested row**, which ships whole, stats included. One
> flagged entry is in that state today (Blessed Book of Nagrand) and it is deliberate: its value is
> confirmed and the flag marks a schema gap, not a doubt. `catalogueMeta.unmatchedCuratedCount` is
> the number to watch — every entry in it is one whose invented numbers would reach the paperdoll.
> 
> Four entries were deleted outright for being fictional (Training Sword, Practice Longbow, Shield of
> Rehearsal, Voidheart Cover). All four were selectable in a gear dropdown. If you find another,
> check `getItemsForSlot` before assuming it is harmless.

## Exports

**const** — `sampleItems`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[domain.gear.itemCatalogue]] — `src/domain/gear/itemCatalogue.ts`

## Concepts & phases

- [[Phase 2 - Gear Gems Enchants]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
