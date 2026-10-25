---
type: module
layer: features
source: src/features/scene/waterScene.ts
lines: 1175
generated: true
tags: [brain/architecture, layer/features]
---

# features.scene.waterScene

`src/features/scene/waterScene.ts` · **features** layer · 1175 lines

From the top of the file:

> The crystal-and-water scene behind every screen (port step 7), loaded on demand by `sceneControl.ts`.
> 
> **Ported from the prototypes**: the scene each tab page drew (`docs/design/prototypes/tabs/*.html`,
> one host that differs only in a handful of numbers per tab) and the kit that dressed it
> (`tbc-kit.js`): the shattered sky with its aurora, a colour per tab crossfading over 1.2 seconds, and
> each tab's own detail — shafts of light and a water pulse for Home, bubbles for the planner, crystal
> pillars for Simulation, one light per raid group for Raid Composition, rank rings for the tier lists
> and ore glints for Professions. Raids lights each raid its own way. Everything is our own geometry
> and shaders: no game art.
> 
> **Made to look as it did on three r128.** The prototypes ran r128, which knew nothing of colour
> management and scaled lights by π; three 0.186 does both differently. So colour management is off,
> the output stays linear, every light is π times the prototype's number, and the falloff of the two
> point lights is r128's straight line, put back into the shader.
> 
> The page tells the scene which screen it is on through `<html>`'s `data-tab`, `data-raid` and
> `data-raid-id` (the same attributes the still backdrop reads), so no component knows the scene exists.

## Exports

**function** — `startScene`

## Imports

- [[features.scene.sceneControl]] — `src/features/scene/sceneControl.ts`

## Imported by

_None._

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
