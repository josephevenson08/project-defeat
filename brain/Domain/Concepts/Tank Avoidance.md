---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Tank Avoidance

_The defender side of the attack table — and the one place this project is knowingly wrong._

Avoidance is not symmetric. The chance a *boss* dodges or parries the player and the chance the *player* dodges or parries the boss come from the same family of formulas, but the skill differential enters them with opposite sign. A level-70 player fighting a level-73 boss is the under-skilled party in both directions: the boss avoids more of the player's attacks, and the player avoids less of the boss's.

**This project currently gets that backwards.** `calculateTankSurvivability` reuses the attacker-side helpers for the player's own baseline, so the same 15-point skill gap that correctly raises the boss's parry against the player also raises the player's parry against the boss — to roughly 14% before any gear, where the real figure moves the other way off a ~5% base. A code comment described this as a symmetric approximation pending research, which understated it: symmetry is exactly the thing that does not hold. An audit confirmed it numerically.

The consequence is that every tank Survivability Score is inflated at the avoidance term, and because stat weights are computed by differencing that score, tank stat weights inherit the error. Nothing on the DPS or healing paths is affected — those use the attacker-side helpers for their actual purpose.

Two further mechanics the tank path does not model at all, and should not be assumed to: crushing blows from a higher-level attacker, and the fact that avoidance types compete for the same ordered table rather than summing freely.

## Where this lives in the code

- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Related

- [[Attack Table]]
- [[Armor Mitigation]]
- [[Stat Weights]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
