---
type: module
layer: domain
source: src/domain/simulation/warlockPet.ts
lines: 154
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.warlockPet

`src/domain/simulation/warlockPet.ts` · **domain** layer · 154 lines

From the top of the file:

> The Felguard, and why it is the only demon this model has.
> 
> **A warlock's demon is either a pet or a damage multiplier, never both.** `sim/warlock/warlock.go`
> makes the choice explicit:
> 
>     if warlock.Talents.DemonicSacrifice && warlock.Options.SacrificeSummon {
>         Succubus -> ShadowDamageDealtMultiplier *= 1.15
>         Imp      -> FireDamageDealtMultiplier   *= 1.15
>         Felguard -> ShadowDamageDealtMultiplier *= 1.10
>     } else {
>         warlock.Pet = warlock.NewWarlockPet()
>     }
> 
> Affliction and Destruction sacrifice — upstream's only preset is a Destruction warlock sacrificing
> a Succubus — so what they are missing is a **school-scoped damage multiplier**, and this simulator
> records no spell school at all. That half is genuinely blocked, and it is one more thing on the
> list of four that spell school already holds up.
> 
> **Demonology is the exception, and it is the spec that needs this.** Summon Felguard is the 41-point
> Demonology talent — the demon *is* the spec — so a Demonology warlock keeps it, and Demonology is
> the worst spec in the calibration table at 2.2x. That is the whole scope of this module: one demon,
> for one spec, chosen because upstream's own branch says the other two do not have one.
> 
> Every constant is read from wowsims/tbc `sim/warlock/pet.go` at the pinned commit 3301fca5.

## Exports

**function** — `estimateWarlockPet`, `felguardAttackPower`, `felguardCritChance`

**const** — `FELGUARD_AGILITY_TO_CRIT_PERCENT`, `FELGUARD_ATTACK_POWER_MULTIPLIER`, `FELGUARD_BASE`, `FELGUARD_HAS_FAMILY_MULTIPLIER`, `FELGUARD_SPELL_POWER_TO_ATTACK_POWER`, `FELGUARD_STRENGTH_OFFSET`, `FELGUARD_STRENGTH_TO_ATTACK_POWER`, `FELGUARD_SWING_SECONDS`, `FELGUARD_WEAPON`, `noWarlockPetTalents`, `WARLOCK_PET_UNMODELLED`

**type** — `WarlockPetEstimate`, `WarlockPetInput`, `WarlockPetTalents`

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
