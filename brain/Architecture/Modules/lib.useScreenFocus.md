---
type: module
layer: lib
source: src/lib/useScreenFocus.ts
lines: 44
generated: true
tags: [brain/architecture, layer/lib]
---

# lib.useScreenFocus

`src/lib/useScreenFocus.ts` · **lib** layer · 44 lines

From the top of the file:

> Whether the app has already shown a screen in this page load.
> 
> Module scope rather than state: the point is to tell the *first* screen a visitor sees from every
> screen after it, and those are different components mounting one after another, so no component can
> hold the answer. A fresh page load starts a fresh module.

## Exports

**function** — `useScreenFocus`

## Imports

_None._

## Imported by

- [[components.layout.AppShell]] — `src/components/layout/AppShell.tsx`
- [[features.character.CharacterCreator]] — `src/features/character/CharacterCreator.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
