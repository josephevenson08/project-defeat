---
type: module
layer: lib
source: src/lib/motion.ts
lines: 47
generated: true
tags: [brain/architecture, layer/lib]
---

# lib.motion

`src/lib/motion.ts` · **lib** layer · 47 lines

From the top of the file:

> The way a tab asks the optional motion layer for a moment of motion (port step 7).
> 
> **Every call is a no-op until the layer has loaded**, and the layer never loads with reduced motion,
> so a tab calls this unconditionally and never has to ask whether motion is on. The layer itself (the
> DOM effects in `features/scene/motionLayer.ts`, the 3D scene in `features/scene/waterScene.ts`) is
> split out of the main bundle; this file is the only part of it every visitor downloads, which is why
> it is a few lines and nothing else.
> 
> A cue names its element directly (a ref the tab holds) or by selector, read a frame later so React
> has drawn what the cue is about.

## Exports

**function** — `attachMotion`, `cue`

**type** — `MotionCue`

## Imports

_None._

## Imported by

- [[App]] — `src/App.tsx`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.GearSheet]] — `src/features/gear/GearSheet.tsx`
- [[features.professions.FarmingRouteMap]] — `src/features/professions/FarmingRouteMap.tsx`
- [[features.professions.ProfessionWindow]] — `src/features/professions/ProfessionWindow.tsx`
- [[features.raidcomp.RaidAdvice]] — `src/features/raidcomp/RaidAdvice.tsx`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`
- [[features.raids.BossJournal]] — `src/features/raids/BossJournal.tsx`
- [[features.scene.motionLayer]] — `src/features/scene/motionLayer.ts`
- [[features.simulator.BestUpgrades]] — `src/features/simulator/BestUpgrades.tsx`
- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`
- [[features.tierlists.TierBoard]] — `src/features/tierlists/TierBoard.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
