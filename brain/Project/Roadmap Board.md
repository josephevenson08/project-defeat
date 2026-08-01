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
| [[Phase 5 - Planner Workflows]] | 🟡 partial | 4 |
| [[Phase 6 - In-Game Import]] | ⬜ not started | 4 |

## Next honest step

Build save/load is now wired, so the largest remaining gap is an accuracy one rather than a reachability one:

1. **Multi-ability rotations** — every path now models exactly one ability per spec. Melee specs additionally lose any special whose sustained rate is not computable (rage-costed abilities with no cooldown, and Steady Shot), so they remain understated. Real rotation priority is the biggest remaining accuracy gap in [[Phase 4 - Simulation]].
2. **Tank avoidance baseline** — an independent audit confirmed [[domain.simulation.attackTable]]'s skill-differential formulas are reused for the player's own dodge and parry in `calculateTankSurvivability`, where they belong to the *boss*. The level gap raises the player's avoidance when it should lower it, so every tank number is inflated before gear. See [[Tank Avoidance]].
3. **Item catalog verification** — the wrong-boss conflicts and the invented `justicars-warblade` are corrected, but 214 `needsVerification` flags remain in [[domain.gear.sampleItems]]. Three items now carry real sourced values and are markedly stronger than the estimates around them, so any sourced-vs-estimated comparison — which is exactly what the upgrade finder ranks — is skewed.

## Related

- [[Decision Log]]
- [[Data Provenance]]
- [[Known Limitations]]
- [[Architecture Map]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
