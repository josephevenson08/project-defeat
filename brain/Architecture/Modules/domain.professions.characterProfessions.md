---
type: module
layer: domain
source: src/domain/professions/characterProfessions.ts
lines: 42
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.professions.characterProfessions

`src/domain/professions/characterProfessions.ts` · **domain** layer · 42 lines

From the top of the file:

> How many primary professions a character may carry. Two, in every version of the game.
> 
> Named rather than written as a literal at the call sites, because the picker, the validator and
> the saved-build reader all have to agree about it and a saved build is a compatibility surface.

## Exports

**function** — `toggleProfession`

**const** — `PRIMARY_PROFESSION_LIMIT`, `primaryProfessions`

## Imports

- [[domain.professions.professionTypes]] — `src/domain/professions/professionTypes.ts`
- [[domain.professions.sampleProfessions]] — `src/domain/professions/sampleProfessions.ts`

## Imported by

- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[features.character.CharacterRail]] — `src/features/character/CharacterRail.tsx`

## Concepts & phases

- [[Phase 3 - Character Systems]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
