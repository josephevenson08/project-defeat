---
type: module
layer: domain
source: src/domain/buffs/buffScope.ts
lines: 75
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.buffScope

`src/domain/buffs/buffScope.ts` · **domain** layer · 75 lines

From the top of the file:

> How far a buff reaches, which in TBC is the question a raid composition turns on.
> 
> - `Party` — a group of five. Every totem, every aura and both Warrior shouts reach only the caster's
>   own group. **Four reach any group:** Gift of the Wild, Prayer of Fortitude, Arcane Brilliance and
>   Prayer of Spirit say "the target's party", so the caster picks the group and one caster covers
>   every group with a cast each (`castOnAnyGroup`). Until 2026-10-09 they were treated as
>   caster's-group-only, which told a raid it was missing Fortitude in four groups with a Priest in one.
> - `Raid` — everyone. Only the five Greater Blessings, which is exactly what "Greater" buys.
> - `Single` — one player, chosen at cast time: Innervate, Power Infusion, Thorns, Shadow Protection.
>   Where the provider sits is irrelevant, so for coverage these behave like `Raid`.
> - `Target` — the debuffs. They land on the boss; one applier anywhere in the raid covers it.
> 
> The scope is what the tooltip says. **How far a buff reaches in a raid** can differ, and
> `isPartyScoped` is the answer the composition tool uses: the four buffs above, and Heroism and
> Bloodlust on Anniversary realms (`anniversaryRaidWide`), reach further than their scope says.
> 
> **This is the difference between a useful composition tool and a misleading one.** Treating every
> buff as raid-wide tells a raid leader Battle Shout is covered when five of twenty-five players
> have it. Group assignment *is* raid composition in TBC, and this field is what makes that
> computable instead of guessed.

## Exports

**function** — `castOnAnyGroup`, `getBuffScope`, `getBuffScopeEvidence`, `isPartyScoped`

**const** — `anniversaryRaidWide`, `scopedBuffCount`

**type** — `BuffScope`

## Imports

_None._

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`

## Concepts & phases

- [[Step 2 Walkthrough]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
