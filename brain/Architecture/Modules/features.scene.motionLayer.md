---
type: module
layer: features
source: src/features/scene/motionLayer.ts
lines: 217
generated: true
tags: [brain/architecture, layer/features]
---

# features.scene.motionLayer

`src/features/scene/motionLayer.ts` · **features** layer · 217 lines

From the top of the file:

> The motion each ported tab left for the last step (port step 7), loaded on demand by `sceneControl.ts`.
> 
> Tabs ask for it with `cue()` (`lib/motion.ts`); this answers. The moments are the prototypes':
> tiles landing row by row, panels rising into place, a route drawing itself, a ring of light opening a
> pane, a learned talent's pulse, a slow tint on a row short of the hit cap, and the scene's swell and
> embers, which brighten the still backdrop instead when there is no scene.
> 
> **The browser's own animations, not a library's.** Each moment is a Web Animation from a start
> state to the element's own style, so it cleans up after itself, a cancelled one leaves nothing
> behind, and the compositor runs it. anime.js (already in the app) tweens the scene's numbers.
> 
> Never loaded with reduced motion, and detached the moment reduced motion is switched on.

## Exports

**function** — `setScene`, `startMotion`

## Imports

- [[features.scene.sceneControl]] — `src/features/scene/sceneControl.ts`
- [[lib.motion]] — `src/lib/motion.ts`

## Imported by

_None._

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
