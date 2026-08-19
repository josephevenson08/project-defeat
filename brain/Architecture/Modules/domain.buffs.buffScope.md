---
type: module
layer: domain
source: src/domain/buffs/buffScope.ts
lines: 50
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.buffScope

`src/domain/buffs/buffScope.ts` · **domain** layer · 50 lines

From the top of the file:

> How far a buff reaches, which in TBC is the question a raid composition turns on.
> 
> - `Party` — the caster's group of five, and nobody else. **24 of the 33 raid buffs.** Every totem,
>   every aura, both Warrior shouts, Arcane Brilliance, Prayer of Fortitude, Gift of the Wild.
> - `Raid` — everyone. Only the five Greater Blessings, which is exactly what "Greater" buys.
> - `Single` — one player, chosen at cast time: Innervate, Power Infusion, Thorns, Shadow Protection.
>   Where the provider sits is irrelevant, so for coverage these behave like `Raid`.
> - `Target` — the six debuffs. They land on the boss; one applier anywhere in the raid covers it.
> 
> **This is the difference between a useful composition tool and a misleading one.** Treating every
> buff as raid-wide tells a raid leader Battle Shout is covered when five of twenty-five players
> have it. Group assignment *is* raid composition in TBC, and this field is what makes that
> computable instead of guessed.

## Exports

**function** — `getBuffScope`, `getBuffScopeEvidence`, `isPartyScoped`

**const** — `scopedBuffCount`

**type** — `BuffScope`

## Imports

_None._

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
