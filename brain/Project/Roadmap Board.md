---
type: moc
generated: true
tags: [brain/project, moc]
---

# Roadmap Board

The long-term goal: a local-first TBC Classic Anniversary simulator/planner covering every class and spec, gear, enchants, gems, talents, buffs, debuffs, consumables, rotations, encounter settings, saved builds, import/export, and gear comparison.

| Phase | Status | Remaining items |
| --- | --- | --- |
| [[Phase 1 - Local Foundation]] | ✅ complete | 0 |
| [[Phase 2 - Gear Gems Enchants]] | 🟢 mostly complete | 1 |
| [[Phase 3 - Character Systems]] | 🟡 partial | 4 |
| [[Phase 4 - Simulation]] | 🟡 partial | 4 |
| [[Phase 5 - Planner Workflows]] | 🟡 partial | 5 |
| [[Phase 6 - In-Game Import]] | ⬜ not started | 4 |

## Next honest step

Two things are written but not reachable from the UI, which makes them the cheapest real progress available:

1. **Build save/load** — [[domain.builds.buildSerialization]] encodes and decodes a full build, and nothing calls it. Wiring it up closes the first [[Phase 5 - Planner Workflows]] item.
2. **Rotation modelling** — [[Signature Abilities]] now feed the caster and healer estimates, but the physical path still ignores them, so melee specs are white-damage-only. That is the biggest remaining accuracy gap in [[Phase 4 - Simulation]].

## Related

- [[Decision Log]]
- [[Data Provenance]]
- [[Known Limitations]]
- [[Architecture Map]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
