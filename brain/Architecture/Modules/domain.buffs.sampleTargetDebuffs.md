---
type: module
layer: domain
source: src/domain/buffs/sampleTargetDebuffs.ts
lines: 170
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.buffs.sampleTargetDebuffs

`src/domain/buffs/sampleTargetDebuffs.ts` · **domain** layer · 170 lines

From the top of the file:

> The raid debuffs applied to the simulated target.
> 
> Same treatment the thirty-three raid buffs got, and it found the same thing. Every number below
> was read by hand off the Wowhead tooltip of the spell rank named in `spellId`, then cross-checked
> against wowsims/tbc `sim/core/debuffs.go` @3301fca5. All six previously carried
> `needsVerification` with a note calling them "approximate pending final Wowhead audit"; five of
> the six were not approximate, they were wrong:
> 
> - **The three armor debuffs were in the wrong unit entirely.** They were fractions — 20%, 8%, 5%
>   — and TBC has no percentage armor debuff. Sunder Armor is 520 flat per stack, Faerie Fire 610,
>   Curse of Recklessness 800. Against this app's own level 73 target the old model removed 33% of
>   10,643 armor (3,512) where the real three remove 4,010, and against any other target it was
>   wrong by a different amount, because a fraction scales with the target and a flat value does
>   not.
> - **Winter's Chill was applied to every school.** It is Frost only, so it was handing +10% crit
>   to Shadow Priests and Balance Druids, for whom it does nothing.
> - **Improved Seal of the Crusader was physical only.** Its tooltip says "all attacks", and
>   wowsims puts the one bonus into both `PhysicalCritChance` and `SpellCritChance`. Casters were
>   getting nothing from a debuff that helps them exactly as much as it helps a Warrior.
> 
> Curse of the Elements' 10% is the one value that survived intact.
> 
> **Two entries have been added since that audit**, both to the same standard and both because a
> talent-provided effect was being credited to a whole class: Expose Weakness (Survival) on
> 2026-08-21, and Improved Faerie Fire (Balance) on 2026-08-23.
> 
> **Where the two sources conflict, the tooltip wins** — the rule the buff pass set. Here nothing
> conflicted: all six agreed to the digit, including the numbers that overturned what shipped.
> 
> **What `notModelled` means for a debuff.** Only Winter's Chill carries it, and the reason is
> narrow and fixable: no spell school is recorded anywhere in `SignatureAbility` or the simulation,
> so a Frost-only debuff can be applied to every spell or to none. Applying it is the error being
> corrected here, so it is applied to none and listed with its real effect instead. Curse of the
> Elements is school-scoped too but stays modelled, because the schools it covers (Arcane, Fire,
> Frost, Shadow) are every modelled caster except Elemental Shaman, whose Nature damage it misses —
> named in its notes rather than hidden. That is the line: applied when it is right for most specs
> and the exception is written down, `notModelled` when applying it would be wrong for most.

## Exports

**function** — `getTargetDebuffById`

**const** — `modelledTargetDebuffs`, `sampleTargetDebuffs`, `unmodelledTargetDebuffs`

## Imports

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

- [[Buffs Debuffs and Consumables]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
