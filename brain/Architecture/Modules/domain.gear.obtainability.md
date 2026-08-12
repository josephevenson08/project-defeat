---
type: module
layer: domain
source: src/domain/gear/obtainability.ts
lines: 57
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.gear.obtainability

`src/domain/gear/obtainability.ts` · **domain** layer · 57 lines

From the top of the file:

> Items the catalogue carries that no character can actually acquire and equip.
> 
> Why this exists: the upstream item database is the *game's* item table, not a list of gear players
> can wear. It includes encounter props, developer test items and unused art. Left in the equip pool
> these do not merely clutter the picker — `getDefaultItemForSlot` picks by highest item level, so
> before this list existed **all 27 specs defaulted their weapon slots to Kael'thas's encounter
> weapons**. Every stat total, simulation and stat weight in the app started from a weapon that
> cannot be held, and the upgrade finder could never beat ilvl 175 so it never proposed a weapon.
> 
> The evidence, rather than recall:
> 
> - **The seven ilvl 175 weapons are the only items at that item level in a 4,505-item catalogue.**
>   The next rung down is 164, which is Sunwell — the highest obtainable gear in all of TBC, two
>   phases past this app's Phase 2 target of ~141. An item eleven levels above the expansion's
>   ceiling is not gear anyone wears. They are what Kael'thas summons in phase 2 of his fight in
>   Tempest Keep, and they despawn with the encounter.
> - **Trashbringer is the sole item at ilvl 155**, wedged between 154 and 156, and its Wowhead page
>   carries no source tab at all — no drop, no vendor, no quest. Same for Andonisus and for the
>   uncorrupted Ashbringer, which was never obtainable in-game.
> 
> Deliberately *not* on this list: Sulfuras, Thunderfury, Atiesh, the Warglaives and Thori'dal. Those
> are real legendaries a character can genuinely carry, and all of them sit at or below 164.

## Exports

**function** — `isObtainable`

**const** — `unobtainableItems`, `unobtainableWowItemIds`

## Imports

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Imported by

- [[domain.gear.characterItemRules]] — `src/domain/gear/characterItemRules.ts`
- [[domain.gear.defaultGear]] — `src/domain/gear/defaultGear.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
