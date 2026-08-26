---
type: module
layer: domain
source: src/domain/simulation/hunterPet.ts
lines: 110
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.hunterPet

`src/domain/simulation/hunterPet.ts` · **domain** layer · 110 lines

From the top of the file:

> The hunter's pet, as a second attacker.
> 
> **A pet is not an ability, and that is why it had no home before this.** It is a separate actor
> with its own attack power, its own crit chance and its own weapon, none of which appear anywhere in
> `SignatureAbility` — so a spec whose damage is meaningfully a pet's had no way to say so, and every
> hunter estimate silently described a hunter standing alone.
> 
> Every constant is read from wowsims/tbc `sim/hunter/pet.go` and `sim/hunter/talents.go` at the
> pinned commit 3301fca5.
> 
> **What this models is the pet's white damage only, and the shortfall is stated rather than
> discovered.** Its focus-costed abilities — Bite, Claw, Gore, Screech — are real damage and are not
> here: they are limited by a focus economy whose base regeneration rate is passed to
> `EnableFocusBar` as a *multiplier* rather than a rate, and a number that cannot be read off the
> source is not one this repo invents. Kill Command is not implemented upstream either. The
> Beast Mastery talents that scale a pet are likewise absent — see `HUNTER_PET_UNMODELLED`.

## Exports

**function** — `estimateHunterPet`, `hunterPetCritChance`

**const** — `HUNTER_PET_AGILITY_PER_CRIT_PERCENT`, `HUNTER_PET_ATTACK_POWER_INHERITANCE`, `HUNTER_PET_BASE_AGILITY`, `HUNTER_PET_BASE_STRENGTH`, `HUNTER_PET_FLAT_ATTACK_POWER`, `HUNTER_PET_FLAT_CRIT_PERCENT`, `HUNTER_PET_HAPPINESS_MULTIPLIER`, `HUNTER_PET_STRENGTH_TO_ATTACK_POWER`, `HUNTER_PET_SWING_SECONDS`, `HUNTER_PET_UNMODELLED`, `HUNTER_PET_WEAPON_DAMAGE`

**type** — `HunterPetEstimate`, `HunterPetInput`

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
