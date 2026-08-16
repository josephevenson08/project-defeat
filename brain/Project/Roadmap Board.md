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
| [[Phase 3 - Character Systems]] | 🟡 partial | 3 |
| [[Phase 4 - Simulation]] | 🟡 partial | 7 |
| [[Phase 5 - Planner Workflows]] | 🟡 partial | 5 |
| [[Phase 6 - In-Game Import]] | ⬜ not started | 4 |

## Next honest step

Build save/load is now wired, so the largest remaining gap is an accuracy one rather than a reachability one:

1. **Multi-ability rotations** — started, and **only Fury and Arms Warrior have more than one ability**. Both now press Whirlwind on its 10s cooldown alongside their signature button, resolved against a shared global-cooldown budget. Every other spec still models exactly one ability, and all specs still lose any special whose sustained rate is not computable (rage-costed abilities with no cooldown, and Steady Shot), so they remain understated by differing amounts. The engine handles arbitrary ability lists; what gates the rest is sourced ability data. Still the biggest accuracy gap in [[Phase 4 - Simulation]].
2. **Tank score severity weighting** — the tank path now resolves one ordered incoming table including crushing blows (see [[Tank Avoidance]]), but the headline Survivability Score still weights avoidance, armor and stamina without pricing how much worse a crit or a crush is than a plain hit. The breakdown carries a damage-per-swing figure that does account for it; folding that into the score is a metric redesign and deliberately hasn't been done unilaterally.
3. **Item catalog verification** — 120 of 226 items in [[domain.gear.sampleItems]] still carry `needsVerification`, so 106 are now sourced against real tooltips. Every audited batch so far has found real errors — invented stats, fabricated sockets, placeholder item levels — so an unflagged item is meaningfully different from a flagged one, and a sourced-versus-estimated comparison is skewed in the sourced item's favour until the rest catch up.
4. **BiS depth is no longer the gap it was recorded as** — 1440 ranked entries cover 402 slots across all 27 specs, and only **37** of those slots still offer a single option. This item used to read "BiS lists are one item deep", which was true of the 27 hand-written lists but stopped being true when the Wowhead ingest replaced them, and nothing updated the prose. Measured per slot rather than per entry, because a list can be thousands of entries deep while individual slots still show one option. What is left here is a thin tail, not the core promise of the planner.

## Related

- [[Decision Log]]
- [[Data Provenance]]
- [[Known Limitations]]
- [[Architecture Map]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
