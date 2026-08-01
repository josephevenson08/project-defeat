---
type: module
layer: domain
source: src/domain/character/sampleRacialTraits.ts
lines: 251
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.sampleRacialTraits

`src/domain/character/sampleRacialTraits.ts` · **domain** layer · 251 lines

From the top of the file:

> Racials are written in the units the game states them in (percent hit, expertise *skill*) and
> converted here into the rating units the stat model uses, via the same constants the simulator
> uses. Writing "+15.8 hit rating" directly would hide what the racial actually says.

## Exports

**function** — `getRacialTraitById`, `getRacialTraitsForRace`

**const** — `sampleRacialTraits`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.racialTypes]] — `src/domain/character/racialTypes.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[domain.character.applyRacialTraits]] — `src/domain/character/applyRacialTraits.ts`
- [[features.character.CharacterPanel]] — `src/features/character/CharacterPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
