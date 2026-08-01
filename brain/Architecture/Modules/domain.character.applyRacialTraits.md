---
type: module
layer: domain
source: src/domain/character/applyRacialTraits.ts
lines: 57
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.applyRacialTraits

`src/domain/character/applyRacialTraits.ts` · **domain** layer · 57 lines

From the top of the file:

> Weapon-conditional racials key off what's actually equipped. Sword/Mace/Axe specialization read
> the melee hands; Gun/Bow specialization read the Ranged slot. Checking every weapon slot rather
> than guessing per trait keeps this correct if a future trait covers a different slot.

## Exports

**function** — `applyRacialTraits`, `getActiveRacialTraits`, `isRacialTraitActive`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.racialTypes]] — `src/domain/character/racialTypes.ts`
- [[domain.character.sampleRacialTraits]] — `src/domain/character/sampleRacialTraits.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`
- [[domain.stats.statUtils]] — `src/domain/stats/statUtils.ts`

## Imported by

- [[features.character.CharacterPanel]] — `src/features/character/CharacterPanel.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
