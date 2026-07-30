---
type: log
generated: true
tags: [brain/project]
---

# Decision Log

Architectural decisions worth not re-litigating. Add new entries below the manual marker; the generated section above only carries the ones baked into the code today.

## Local-first, no backend

Everything runs in the browser against typed data in the repo. This is what makes the project cheap to iterate on and what shapes Phase 6: the addon import parses a pasted blob client-side rather than uploading it anywhere.

## `domain/` never imports `features/`

Typed TBC knowledge lives in `domain/` and stays free of UI concerns; `features/` composes it into panels. See [[Architecture Map]] for the full layer breakdown.

## Approximated data is flagged, not hidden

[[Needs Verification]] is a first-class field on items, raid loot, abilities, and profession tiers, and the UI surfaces it. The alternative — quietly shipping guesses — makes the whole planner untrustworthy.

## Per-class BiS files rather than one big table

BiS data is split one file per class/spec/phase. It keeps diffs reviewable while 27 specs get filled in independently, at the cost of a barrel file that has to stay in sync.

## Signature ability, not a rotation engine

One researched ability per spec replaces the generic filler-cast placeholder. This is explicitly an intermediate step: it buys real per-spec cast times and coefficients now, without pretending to be a rotation model.

## Related

- [[Architecture Map]]
- [[Roadmap Board]]
- [[Data Provenance]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
