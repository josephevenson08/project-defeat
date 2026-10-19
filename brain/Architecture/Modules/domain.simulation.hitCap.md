---
type: module
layer: domain
source: src/domain/simulation/hitCap.ts
lines: 139
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.hitCap

`src/domain/simulation/hitCap.ts` · **domain** layer · 139 lines

From the top of the file:

> The hit cap, for every spec: how much hit rating the gear has to bring before nothing the spec
> relies on misses the boss. Read from the simulator's own tables, so the Gear tab's "Hit 140 / 95"
> and the estimate agree on where hit stops paying.
> 
> - **Special attacks** (melee DPS and tanks): the table's miss chance for a yellow attack, which has
>   no dual-wield penalty. Talent hit (Precision), Heroic Presence and Improved Faerie Fire on the
>   boss each take some of it, exactly as they join `missReduction` in `calculatePhysicalDps`. White
>   swings from two weapons miss far more, so for a dual-wielder hit past this still pays.
> - **Ranged attacks** (Hunters): the ranged table's miss chance, the same base, with Surefooted.
> - **Spells** (casters): the spell table's miss chance down to its 1% floor, less talent hit, Inspiring
>   Presence and spell-hit buffs such as Totem of Wrath.
> - **Healers** have no cap: a heal cannot miss.

## Exports

**function** — `hitCapFor`, `hitCapWords`, `hitStanding`

**type** — `HitCap`, `HitCapInput`, `HitCapKind`, `HitCapSource`

## Imports

- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.character.applyRacialTraits]] — `src/domain/character/applyRacialTraits.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`
- [[domain.simulation.encounterTypes]] — `src/domain/simulation/encounterTypes.ts`
- [[domain.simulation.spellTable]] — `src/domain/simulation/spellTable.ts`
- [[domain.talents.talentModifiers]] — `src/domain/talents/talentModifiers.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.GearSheet]] — `src/features/gear/GearSheet.tsx`
- [[features.gear.WhatsLeft]] — `src/features/gear/WhatsLeft.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
