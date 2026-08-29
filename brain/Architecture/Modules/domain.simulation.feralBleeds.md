---
type: module
layer: domain
source: src/domain/simulation/feralBleeds.ts
lines: 167
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.feralBleeds

`src/domain/simulation/feralBleeds.ts` · **domain** layer · 167 lines

From the top of the file:

> Rake and Rip, the two bleeds that make a Feral druid — and the reason it has been the worst spec in
> this model at 2.3x.
> 
> **Bleeds ignore armor, and upstream says so in a comment rather than leaving it to be inferred.**
> `sim/core/spell_resistances.go`:
> 
>     if spell.SpellSchool.Matches(SpellSchoolPhysical) {
>         // All physical dots (Bleeds) ignore armor.
>         if spellEffect.IsPeriodic { return }
>         spellEffect.Damage *= attackTable.ArmorDamageReduction
>     }
> 
> That is worth about 26% of every tick against this app's 7,700-armour target, and getting it wrong
> would have been silent. **Rake's opening hit is not periodic**, so it takes armour like any other
> special while its own ticks do not — a split inside one ability, and the reason this module returns
> the two halves separately rather than one number.
> 
> Every constant is read from wowsims/tbc `sim/druid/rake.go` and `sim/druid/rip.go` at the pinned
> commit 3301fca5.

## Exports

**function** — `estimateFeralBleeds`

**const** — `RAKE`, `RIP`

**type** — `FeralBleedEstimate`, `FeralBleedInput`

## Imports

_None._

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
