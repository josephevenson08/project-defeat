---
type: module
layer: domain
source: src/domain/abilities/abilityTypes.ts
lines: 160
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.abilities.abilityTypes

`src/domain/abilities/abilityTypes.ts` · **domain** layer · 160 lines

From the top of the file:

> What the ability actually does, from the simulator's point of view.
> 
> `Direct Damage` / `Direct Heal` land in one lump when the cast finishes; `DoT` / `HoT` deliver
> their amount over a duration in discrete ticks. `Melee Special` / `Ranged Special` are "yellow"
> physical attacks — they scale off weapon damage and attack power rather than spell power, and
> they cost rage/energy/mana rather than having a meaningful cast time.
> 
> A few abilities are hybrids (Fireball is Direct Damage plus a small DoT; Regrowth is a Direct
> Heal plus a HoT). Those record their dominant component here and describe the secondary one via
> `periodic` and `notes`.

## Exports

**type** — `AbilityEffectType`, `AbilityResourceCost`, `AbilityResourceType`, `AbilityScaling`, `AmountRange`, `CoefficientBasis`, `PeriodicEffect`, `SignatureAbility`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[domain.abilities.index]] — `src/domain/abilities/index.ts`
- [[domain.abilities.sampleSignatureAbilities]] — `src/domain/abilities/sampleSignatureAbilities.ts`
- [[domain.abilities.signatureAbilitiesDruid]] — `src/domain/abilities/signatureAbilitiesDruid.ts`
- [[domain.abilities.signatureAbilitiesHunter]] — `src/domain/abilities/signatureAbilitiesHunter.ts`
- [[domain.abilities.signatureAbilitiesMage]] — `src/domain/abilities/signatureAbilitiesMage.ts`
- [[domain.abilities.signatureAbilitiesPaladin]] — `src/domain/abilities/signatureAbilitiesPaladin.ts`
- [[domain.abilities.signatureAbilitiesPriest]] — `src/domain/abilities/signatureAbilitiesPriest.ts`
- [[domain.abilities.signatureAbilitiesRogue]] — `src/domain/abilities/signatureAbilitiesRogue.ts`
- [[domain.abilities.signatureAbilitiesShaman]] — `src/domain/abilities/signatureAbilitiesShaman.ts`
- [[domain.abilities.signatureAbilitiesWarlock]] — `src/domain/abilities/signatureAbilitiesWarlock.ts`
- [[domain.abilities.signatureAbilitiesWarrior]] — `src/domain/abilities/signatureAbilitiesWarrior.ts`

## Concepts & phases

- [[Spell Coefficients]]
- [[Needs Verification]]
- [[Signature Abilities]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
