---
type: reference
generated: true
tags: [brain/project]
---

# Known Limitations

Kept deliberately blunt. A planner that overstates its accuracy is worse than one that admits where it guesses.

## Simulation

- The physical path models white damage plus one signature melee special, and only where its rate is defensible (a cooldown, or an energy cost against energy's fixed 10/sec regen). Rage-costed abilities with no cooldown and Hunter's Steady Shot are excluded and named in the result summary. No multi-ability priority, so melee specs remain understated.
- The caster and healer paths model one real ability per spec ([[Signature Abilities]]) — no cooldowns, procs, downranking, or multi-spell priority.
- No multi-iteration variance and no result charts, so every number is a point estimate with no error bar.
- Tank avoidance reuses the player-attacks-target skill formulas symmetrically, which is an approximation flagged in the code.

## Data

- The item catalog is largely representative sample gear, not an audited TBC database. See [[Data Provenance]].
- [[Needs Verification]] is set on a large fraction of item stats and BiS placements.
- Guide data under [[data.phase2Enhancements]] and [[data.phase2SpecGuides]] predates the domain model and is still disconnected from it.

## Scope

- No talent trees, so no talent scaling anywhere in the sim.
- Feral Druid is treated as physical DPS; bear/cat mode is not split.
- No backend by design. The app stays local-first; shareable links or account sync would be the only reasons to add one.

## Related

- [[Data Provenance]]
- [[Roadmap Board]]
- [[Stat Weights]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
