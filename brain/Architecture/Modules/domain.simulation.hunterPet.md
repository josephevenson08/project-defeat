---
type: module
layer: domain
source: src/domain/simulation/hunterPet.ts
lines: 597
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.hunterPet

`src/domain/simulation/hunterPet.ts` · **domain** layer · 597 lines

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
> **It swings and it presses three buttons.** The auto attack is here, sped by Frenzy; so are Bite
> and Claw, paid for out of a focus bar at 5 focus a second; and so is Kill Command, which the owner
> casts and the pet lands. What is not here is stated rather than discovered: Bestial Wrath and the
> per-spell half of Focused Fire, both named in `HUNTER_PET_UNMODELLED` with the reason.
> 
> **Three gates, and they point at different actors** — which is the thing to hold on to when
> reading this file. Bite and Claw are gated on the pet's **focus**; Kill Command on the **owner's**
> crits; Frenzy on the **pet's** crits. Kill Command is therefore priced before the pet's auto
> attack, because Frenzy counts its crits, and it in turn is priced after the rotation, because a
> hunter's crits come from Steady Shot as well as the auto shot. One order, no cycle.

## Exports

**function** — `estimateHunterPet`, `estimateHunterPetKillCommand`, `frenzySpeedMultiplier`, `hunterPetAbilityRates`, `hunterPetAttackPower`, `hunterPetCritChance`, `killCommandUsesPerSecond`

**const** — `HUNTER_PET_ABILITIES`, `HUNTER_PET_AGILITY_PER_CRIT_PERCENT`, `HUNTER_PET_ATTACK_POWER_INHERITANCE`, `HUNTER_PET_AUTO_ATTACK_MULTIPLIER`, `HUNTER_PET_BASE_AGILITY`, `HUNTER_PET_BASE_STRENGTH`, `HUNTER_PET_BITE`, `HUNTER_PET_CLAW`, `HUNTER_PET_DEFAULT_FAMILY`, `HUNTER_PET_FAMILY_DAMAGE_MULTIPLIER`, `HUNTER_PET_FLAT_ATTACK_POWER`, `HUNTER_PET_FLAT_CRIT_PERCENT`, `HUNTER_PET_FOCUS_PER_SECOND`, `HUNTER_PET_FOCUS_PER_TICK`, `HUNTER_PET_FOCUS_TICK_SECONDS`, `HUNTER_PET_FRENZY_DURATION_SECONDS`, `HUNTER_PET_FRENZY_HASTE`, `HUNTER_PET_FRENZY_PROC_CHANCE_PER_RANK`, `HUNTER_PET_GCD_SECONDS`, `HUNTER_PET_HAPPINESS_MULTIPLIER`, `HUNTER_PET_KILL_COMMAND`, `HUNTER_PET_MAX_FOCUS`, `HUNTER_PET_MELEE_SPEED_MULTIPLIER`, `HUNTER_PET_STRENGTH_TO_ATTACK_POWER`, `HUNTER_PET_SWING_SECONDS`, `HUNTER_PET_UNMODELLED`, `HUNTER_PET_WEAPON_DAMAGE`, `noHunterPetTalents`

**type** — `FrenzyInput`, `HunterPetAbility`, `HunterPetAbilityEstimate`, `HunterPetEstimate`, `HunterPetInput`, `HunterPetKillCommandEstimate`, `HunterPetKillCommandInput`, `HunterPetTalents`

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
