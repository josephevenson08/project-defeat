---
type: module
layer: domain
source: src/domain/abilities/sampleSignatureAbilities.ts
lines: 54
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.abilities.sampleSignatureAbilities

`src/domain/abilities/sampleSignatureAbilities.ts` · **domain** layer · 54 lines

From the top of the file:

> One signature ability for every one of the 27 class/spec combinations in TBC.
> 
> Note that `TbcSpec` names are not unique across classes — 'Holy', 'Protection' and 'Restoration'
> are each shared by two classes — so every lookup here is keyed by class AND spec.

## Exports

**function** — `getSignatureAbilitiesForClass`, `getSignatureAbility`, `getSignatureAbilityBySpellId`

**const** — `sampleSignatureAbilities`

## Imports

- [[domain.abilities.abilityTypes]] — `src/domain/abilities/abilityTypes.ts`
- [[domain.abilities.signatureAbilitiesDruid]] — `src/domain/abilities/signatureAbilitiesDruid.ts`
- [[domain.abilities.signatureAbilitiesHunter]] — `src/domain/abilities/signatureAbilitiesHunter.ts`
- [[domain.abilities.signatureAbilitiesMage]] — `src/domain/abilities/signatureAbilitiesMage.ts`
- [[domain.abilities.signatureAbilitiesPaladin]] — `src/domain/abilities/signatureAbilitiesPaladin.ts`
- [[domain.abilities.signatureAbilitiesPriest]] — `src/domain/abilities/signatureAbilitiesPriest.ts`
- [[domain.abilities.signatureAbilitiesRogue]] — `src/domain/abilities/signatureAbilitiesRogue.ts`
- [[domain.abilities.signatureAbilitiesShaman]] — `src/domain/abilities/signatureAbilitiesShaman.ts`
- [[domain.abilities.signatureAbilitiesWarlock]] — `src/domain/abilities/signatureAbilitiesWarlock.ts`
- [[domain.abilities.signatureAbilitiesWarrior]] — `src/domain/abilities/signatureAbilitiesWarrior.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[domain.abilities.index]] — `src/domain/abilities/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
