---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Attack Table

_The ordered roll that decides what a physical swing does._

TBC resolves every physical attack against a single ordered table — miss, dodge, parry, glance, block, crit, hit — rather than rolling each outcome independently. Because the table is ordered and sums to 100%, adding avoidance to the target *pushes crit off the bottom*, which is why hit and expertise are worth so much more than their raw percentages suggest.

Glancing blows only apply to white swings against a higher-level target and cannot be avoided by any amount of gear, which is the single biggest reason a level-70 melee's white DPS against a level-73 boss is lower than the same character's damage in a level-70 duel.

## Where this lives in the code

- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Related

- [[Spell Table]]
- [[Stat Weights]]
- [[Armor Mitigation]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
