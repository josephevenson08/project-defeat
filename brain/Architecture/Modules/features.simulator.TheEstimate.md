---
type: module
layer: features
source: src/features/simulator/TheEstimate.tsx
lines: 127
generated: true
tags: [brain/architecture, layer/features]
---

# features.simulator.TheEstimate

`src/features/simulator/TheEstimate.tsx` · **features** layer · 127 lines

From the top of the file:

> Renders the `**bold**` the researched notes are written with.
> 
> Deliberately **not** a markdown renderer. It handles exactly one construct, splits on a literal
> delimiter, and cannot emit HTML from the string; anything else in the prose stays literal, which is
> the right trade for text authored in this repo rather than supplied by anyone.

## Exports

**function** — `TheEstimate`

## Imports

- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.simulator.simFormat]] — `src/features/simulator/simFormat.ts`
- [[features.simulator.simulationTypes]] — `src/features/simulator/simulationTypes.ts`
- [[features.simulator.TrustPanel]] — `src/features/simulator/TrustPanel.tsx`

## Imported by

- [[features.simulator.SimulationPanel]] — `src/features/simulator/SimulationPanel.tsx`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
