---
type: module
layer: domain
source: src/domain/buffs/buffExclusivity.ts
lines: 155
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.buffExclusivity

`src/domain/buffs/buffExclusivity.ts` · **domain** layer · 155 lines

From the top of the file:

> Buffs that compete for one provider's single slot.
> 
> **The planner was over-crediting badly without this.** One Paladin credited a raid with all five
> Greater Blessings *and* all three auras; one Warrior with both shouts. A raid leader reading that
> would think a single Paladin covered Kings, Might, Wisdom, Salvation and Sanctuary at once, which
> is not a small error — it is the difference between bringing one Paladin and bringing four.
> 
> Each group caps how many of its buffs a given number of providers can supply: **n providers cover
> at most n of the group**, chosen in the stated priority order.
> 
> `basis` matters and is not decoration. A **game rule** is enforced by the client and stated in a
> tooltip; a **raid convention** is how raids actually run and could be argued with. The two are kept
> distinct so a future reader can tell which lines are facts and which are defaults, rather than
> discovering the difference by being surprised.

## Exports

**function** — `applyExclusivity`, `exclusiveGroupFor`

**const** — `exclusiveGroups`

**type** — `ExclusiveGroup`, `ExclusivityBasis`

## Imports

_None._

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
