---
type: module
layer: features
source: src/features/builds/buildStorage.ts
lines: 99
generated: true
tags: [brain/architecture, layer/features]
---

# features.builds.buildStorage

`src/features/builds/buildStorage.ts` · **features** layer · 99 lines

From the top of the file:

> Named slots. **The only persistence there is**, since 2026-08-21.
> 
> There used to be an autosave alongside these: the working build was written on every change and
> restored at mount, so a reload reopened as whoever you were last time. That was removed with the
> decision that a load starts clean — see `App`. Keeping the write without the restore would have
> left this module storing something nothing reads.
> 
> The consequence is worth stating plainly: **an accidental refresh now loses an unsaved build.**
> Saving a named slot, or exporting the text, is what keeps one.

## Exports

**function** — `deleteNamedBuild`, `exportBuildText`, `listNamedBuilds`, `saveNamedBuild`

**const** — `MAX_BUILD_NAME_LENGTH`

**type** — `NamedBuild`

## Imports

- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`

## Imported by

- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Concepts & phases

- [[Phase 5 - Planner Workflows]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
