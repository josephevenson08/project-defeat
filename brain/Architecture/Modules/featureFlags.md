---
type: module
layer: app
source: src/featureFlags.ts
lines: 168
generated: true
tags: [brain/architecture, layer/app]
---

# featureFlags

`src/featureFlags.ts` · **app** layer · 168 lines

From the top of the file:

> Surfaces that are built but deliberately not shown yet.
> 
> A flag here is a statement that the feature works well enough to keep compiling and testing, but
> not well enough to put in front of someone as if its output were trustworthy. Deleting the code
> would lose the work; leaving it visible would present numbers the project knows to be wrong. This
> is the third option.

## Exports

**function** — `isSimulationEnabled`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
