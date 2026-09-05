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

Build save/load is now wired, so the largest remaining gap is an accuracy one rather than a reachability one. Ranked by size of gap, not by build order — the repo owner set the priority on 2026-09-01 and the simulation model is explicitly not it, so these are the honest *gaps*, not the honest *next commit*:

1. **Multi-ability rotations** — started, and **only Fury and Arms Warrior have more than one ability**. Both now press Whirlwind on its 10s cooldown alongside their signature button, resolved against a shared global-cooldown budget. Every other spec still models exactly one ability, and all specs still lose any special whose sustained rate is not computable (rage-costed abilities with no cooldown, and Steady Shot), so they remain understated by differing amounts. The engine handles arbitrary ability lists; what gates the rest is sourced ability data. Still the biggest accuracy gap in [[Phase 4 - Simulation]].
2. **Tank score severity weighting** — the tank path now resolves one ordered incoming table including crushing blows (see [[Tank Avoidance]]), but the headline Survivability Score still weights avoidance, armor and stamina without pricing how much worse a crit or a crush is than a plain hit. The breakdown carries a damage-per-swing figure that does account for it; folding that into the score is a metric redesign and deliberately hasn't been done unilaterally.
3. **Item catalog stat provenance — closed 2026-09-05** — 2 of 4531 catalogue items have stats nothing has checked, and neither is gear: they are the "None" options for slots a class cannot fill, which carry no stats because they represent an empty slot. The 23 that were real entries with invented stats — the Phase 1 prototype set, one placeholder per slot — were deleted once it was established that no BiS entry, raid-loot row or default loadout touched them and no visible slot emptied. This item previously read "120 of 226 items still carry needsVerification", which counted an item's *drop source* rather than its stats and so measured a gap four times the real one.
4. **BiS depth — closed 2026-09-05** — 1427 ranked entries cover 402 slots across all 27 specs, and the 37 that offer a single option are the guide being definitive rather than the ingest losing rows. Every one carries a settled qualifier — "BiS", "Best", "Best OH" — and none is a stopgap left without the item it is a stopgap for, which is the difference between a complete slot and a truncated one and is asserted rather than assumed. This item used to read "BiS lists are one item deep", true of the 27 hand-written lists and false since the Wowhead ingest replaced them; the thin tail that remained after that was never a gap either.

## Related

- [[Decision Log]]
- [[Data Provenance]]
- [[Known Limitations]]
- [[Architecture Map]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
