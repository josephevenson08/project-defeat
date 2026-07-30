---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Stat Weights

_Marginal value of one point of a stat, measured by re-running the sim._

Stat weights here are computed rather than authored: the simulator runs once for the current build, then once more per stat with a small amount of that stat added, and the difference is the weight. That makes them automatically correct for whatever the sim actually models — and equally, silently blind to whatever it does not.

Weights are reported relative to the best stat, which is the form that is useful while gearing ("is this +hit piece better than that +crit piece?"). Absolute per-point values are also shown because relative weights hide how flat a build's curve is.

The honest caveat: a stat the simulator does not model gets a weight of zero, not a low weight. Anything in the unmodeled list on the panel should be read as "unknown", not "worthless".

## Where this lives in the code

- [[features.simulator.calculateStatWeights]] — `src/features/simulator/calculateStatWeights.ts`
- [[features.simulator.StatWeightsPanel]] — `src/features/simulator/StatWeightsPanel.tsx`

## Related

- [[Attack Table]]
- [[Spell Table]]
- [[Best in Slot]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
