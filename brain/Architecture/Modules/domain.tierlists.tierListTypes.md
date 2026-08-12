---
type: module
layer: domain
source: src/domain/tierlists/tierListTypes.ts
lines: 48
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.tierlists.tierListTypes

`src/domain/tierlists/tierListTypes.ts` · **domain** layer · 48 lines

From the top of the file:

> Which of Wowhead's three tier lists a placement came from.
> 
> This is **not** the app's `CharacterRole`, and the difference is load-bearing. `CharacterRole`
> classifies a spec once — Feral Druid is `Physical DPS` and nothing else. Wowhead publishes three
> separate lists and a spec may appear on more than one of them at different tiers: Feral Druid is
> C-tier on the DPS list and S-tier on the tank list, which is a real statement about the spec, not a
> contradiction. Collapsing the two axes would force a choice between those two placements.

## Exports

**type** — `SpecPlacement`, `SpecTierList`, `SpecTierPlacement`, `TierListRole`, `TierRow`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[domain.tierlists.index]] — `src/domain/tierlists/index.ts`
- [[domain.tierlists.tierLists]] — `src/domain/tierlists/tierLists.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
