---
type: module
layer: domain
source: src/domain/simulation/hunterPet.ts
lines: 358
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.hunterPet

`src/domain/simulation/hunterPet.ts` · **domain** layer · 358 lines

From the top of the file:

> The hunter's pet, as a second attacker.
> 
> **A pet is not an ability, and that is why it had no home before this.** It is a separate actor
> with its own attack power, its own crit chance and its own weapon, none of which appear anywhere in
> `SignatureAbility` — so a spec whose damage is meaningfully a pet's had no way to say so, and every
> hunter estimate silently described a hunter standing alone.
> 
> Every constant is read from wowsims/tbc `sim/hunter/pet.go`, `sim/hunter/focus.go` and
> `sim/hunter/talents.go` at the pinned commit 3301fca5.
> 
> **It swings and it presses two buttons.** The auto attack is here, and so are Bite and Claw, paid
> for out of a focus bar at 5 focus a second. What is not here is stated rather than discovered:
> Frenzy, Kill Command and Bestial Wrath, each named in `HUNTER_PET_UNMODELLED` with the reason.

## Exports

**function** — `estimateHunterPet`, `hunterPetAbilityRates`, `hunterPetCritChance`

**const** — `HUNTER_PET_ABILITIES`, `HUNTER_PET_AGILITY_PER_CRIT_PERCENT`, `HUNTER_PET_ATTACK_POWER_INHERITANCE`, `HUNTER_PET_AUTO_ATTACK_MULTIPLIER`, `HUNTER_PET_BASE_AGILITY`, `HUNTER_PET_BASE_STRENGTH`, `HUNTER_PET_BITE`, `HUNTER_PET_CLAW`, `HUNTER_PET_DEFAULT_FAMILY`, `HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER`, `HUNTER_PET_FLAT_ATTACK_POWER`, `HUNTER_PET_FLAT_CRIT_PERCENT`, `HUNTER_PET_FOCUS_PER_SECOND`, `HUNTER_PET_FOCUS_PER_TICK`, `HUNTER_PET_FOCUS_TICK_SECONDS`, `HUNTER_PET_GCD_SECONDS`, `HUNTER_PET_HAPPINESS_MULTIPLIER`, `HUNTER_PET_MAX_FOCUS`, `HUNTER_PET_MELEE_SPEED_MULTIPLIER`, `HUNTER_PET_STRENGTH_TO_ATTACK_POWER`, `HUNTER_PET_SWING_SECONDS`, `HUNTER_PET_UNMODELLED`, `HUNTER_PET_WEAPON_DAMAGE`, `noHunterPetTalents`

**type** — `HunterPetAbility`, `HunterPetAbilityEstimate`, `HunterPetEstimate`, `HunterPetInput`, `HunterPetTalents`

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
