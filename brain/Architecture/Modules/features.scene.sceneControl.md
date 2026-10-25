---
type: module
layer: features
source: src/features/scene/sceneControl.ts
lines: 157
generated: true
tags: [brain/architecture, layer/features]
---

# features.scene.sceneControl

`src/features/scene/sceneControl.ts` · **features** layer · 157 lines

From the top of the file:

> Whether the optional 3D scene and the motion layer run, and loading them (port step 7).
> 
> **This is the only part of the layer in the main bundle.** `three` and the scene live in
> `waterScene.ts`, the DOM effects in `motionLayer.ts`, and both are imported on demand, after the
> first screen is up, so a visitor who never sees the scene never downloads it.
> 
> **Who gets the still backdrop instead** (the `body::before` that step 0 paints for every tab):
> - **Reduced motion**: nothing loads at all, the scene or the motion, and the switch says why.
> - **WebGL 2 off, or only in software** (`failIfMajorPerformanceCaveat`: a blocklisted graphics card
>   falls back to a software renderer that cannot keep up).
> - **Weak hardware**: under 4 GB of memory, two processor cores or fewer, or Data Saver on. The scene
>   also gives up by itself if even its lowest quality runs under about 25 frames a second.
> The motion layer still runs on those devices; it is a few CSS animations.
> 
> **On by default** (the owner's call, 2026-10-23), with a switch at the end of the top bar that is
> remembered. `'force'` skips the hardware check, for the tests, whose browser renders in software.

## Exports

**function** — `bootScene`, `setScenePreference`, `useSceneState`

**type** — `SceneHandle`, `SceneState`

## Imports

_None._

## Imported by

- [[features.scene.motionLayer]] — `src/features/scene/motionLayer.ts`
- [[features.scene.SceneSwitch]] — `src/features/scene/SceneSwitch.tsx`
- [[features.scene.waterScene]] — `src/features/scene/waterScene.ts`
- [[main]] — `src/main.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
