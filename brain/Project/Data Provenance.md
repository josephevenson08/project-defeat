---
type: reference
generated: true
tags: [brain/project]
---

# Data Provenance

Wowhead and WoWSims are the primary research sources for item data, BiS rankings, and simulation formulas.

The practical problem: Wowhead's guide pages are JavaScript-rendered, so item stat blocks could not simply be read off the page. They were cross-checked against static summaries and prior knowledge instead, which is good enough to build against and not good enough to present as fact.

That gap is what [[Needs Verification]] exists for. Every approximated value carries the flag until someone checks it against a real item tooltip, and the UI shows the flag rather than hiding it.

## What is sourced vs. approximated

- **Sourced:** TBC combat mechanics — attack table, spell table, rating conversions, coefficient formulas, armor mitigation. These come from well-documented, stable formulas.
- **Sourced:** signature ability cast times, ranks, base amounts, and coefficients, including the hardcoded exceptions.
- **Approximated:** most item stat blocks, weapon damage dice on non-canonical items, BiS placements, the tank avoidance baseline.
- **Known wrong:** `training-sword`'s `wowItemId` (28034) resolves to an unrelated real item.

## Related

- [[Needs Verification]]
- [[Known Limitations]]
- [[Best in Slot]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
