---
type: module
layer: domain
source: src/domain/talents/calibrationBuilds.ts
lines: 77
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.talents.calibrationBuilds

`src/domain/talents/calibrationBuilds.ts` · **domain** layer · 77 lines

From the top of the file:

> Builds the best case measures a spec at instead of wowsims' preset, where that preset is not what
> the players behind the spec's reference run.
> 
> **Why this exists.** `dpsReference.ts` is archon.gg's average for each spec, and a log's spec is the
> talent tree holding the most points. wowsims' `HemoTalents`, stored as Subtlety in
> `talentBuilds.json`, is a 0/40/21 build with its filler left out: 34 of its 38 listed points are in
> Combat (Precision, Dual Wield Specialization, Sword Specialization, Combat Potency and the rest), so
> a log files it as Combat. Measuring it against the Subtlety average compared a Combat build with
> Subtlety players, and once Dual Wield Specialization was modelled (2026-10-31) it read 1,295 against
> their 1,292, which the calibration test reads as something counted twice. Nothing was: the talent
> adds exactly half the off hand and moves nothing else. The build was the mismatch.
> 
> Only the best case reads this. The Talents tab's "Load the preset" keeps wowsims' build as stored,
> which is the owner's call (2026-10-31).

## Exports

**function** — `calibrationBuildFor`

**const** — `calibrationBuilds`

**type** — `CalibrationBuild`

## Imports

_None._

## Imported by

- [[features.simulator.bestCase]] — `src/features/simulator/bestCase.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
