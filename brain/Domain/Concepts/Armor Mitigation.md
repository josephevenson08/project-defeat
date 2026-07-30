---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Armor Mitigation

_Diminishing physical damage reduction, capped at 75%._

Physical damage reduction from armor follows `armor / (armor + K)` where K depends on the attacker's level, and is hard-capped at 75%. The curve means each point of armor is worth less than the last, so stacking armor past raid-boss levels returns very little — which is why TBC tank gearing pushes stamina and avoidance rather than raw armor once uncrittable is met.

The same formula runs in both directions in this project: the player's mitigation against a boss, and the boss's mitigation against the player's white damage.

## Where this lives in the code

- [[domain.simulation.damageFormulas]] — `src/domain/simulation/damageFormulas.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Related

- [[Attack Table]]
- [[Tank]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
