---
type: module
layer: domain
source: src/domain/character/factionColors.ts
lines: 25
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.character.factionColors

`src/domain/character/factionColors.ts` · **domain** layer · 25 lines

From the top of the file:

> The two faction colours, as the game and its whole community use them.
> 
> **Alliance blue is the logo blue rather than a generic blue**, because that is the one people
> recognise — it is the colour of the Alliance crest and of the Warcraft wordmark itself. Horde red
> is the banner crimson, lightened from the deep `#8c1c13` of the tabard to clear WCAG AA on this
> app's raised surfaces: the deeper red measured 4.28:1 on `--surface-2`, which is exactly where a
> selected option's border sits.
> 
> These are the only two colours in the app that mean "which side", so they are kept apart from the
> theme tokens. `--accent` happens to equal one of them per faction, but that is the theme following
> the faction, not these two values being theme colours — a Horde player still sees Alliance blue on
> the Alliance button in the creator, and should.

## Exports

**function** — `getFactionColor`

**const** — `factionColors`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[features.character.CharacterCreator]] — `src/features/character/CharacterCreator.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
