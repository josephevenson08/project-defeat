---
type: module
layer: domain
source: src/domain/raids/serpentshrineCavernBosses.ts
lines: 216
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.serpentshrineCavernBosses

`src/domain/raids/serpentshrineCavernBosses.ts` · **domain** layer · 216 lines

From the top of the file:

> `encounterOrder` here is the recommended clear order, not a hard gate: the first five bosses can
> be killed in any sequence, and only after all five are dead does the ramp to Lady Vashj open.
> 
> Tier 5 tokens redeem into several different set pieces per class, so the token entries are followed
> by the specific catalog items they can be traded for. Warlock Tier 5 is the Corruptor Raiment set,
> but the item catalog currently stores those pieces under the Tier 4 "Voidheart" names — those
> entries are flagged so the mismatch is visible rather than silently propagated.

## Exports

**const** — `serpentshrineCavernBosses`

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
