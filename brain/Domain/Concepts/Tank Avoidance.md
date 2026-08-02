---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Tank Avoidance

_The defender side of the attack table — and the one place this project is knowingly wrong._

Avoidance is not symmetric, and TBC uses two genuinely different tables rather than one formula run in both directions. A level-70 player fighting a level-73 boss is the under-skilled party either way: the boss avoids more of the player's attacks, and the player avoids less of the boss's. The level gap therefore enters the two tables with **opposite sign**.

Attacker side (the player swinging at the boss) scales *up* with the gap — the boss reaches 6.5% dodge and 14% parry at three levels above. Defender side (the boss swinging at the player) scales *down*: miss, parry and block each start at a flat 5% and lose 0.2% per attacker level, reaching 4.4% at level 73, while dodge has no flat base at all and takes a straight -0.6% penalty on top of whatever Agility and dodge rating provide.

This project reused the attacker-side helpers for both directions until an audit caught it, which handed the player the boss's own 14% parry and made a *wider* level gap look like better tanking. Both tables are now modelled separately.

Defense Skill is the other half. One point moves five things at once by 0.04%: it adds to dodge, parry and block, adds to the attacker's miss chance, and subtracts from the attacker's crit chance. That last term is where 490 Defense Skill for uncrittable comes from — a level-73 boss crits for 5.6% raw, and 0.056 / 0.0004 is 140 points above the 350 a level 70 already has.

All of it resolves as **one ordered roll**, not a sum: miss, dodge, parry, block, crit, crushing blow, hit. That ordering is the whole mechanic behind uncrushable. A crushing blow is a flat 15% for 150% damage from a three-level-higher attacker, and Defense Rating does nothing to it — the only defence is stacking enough miss/dodge/parry/block that the roll is exhausted before it reaches the crush row. That is why TBC Warriors could become uncrushable through Shield Block and Paladins and Druids could not.

Summing the outcomes instead, which this project did at first, quietly overstates survivability: the parts add up to more than one swing can produce, and the reason avoidance is valuable stops being visible.

What the score still does not do is price *severity*. It weights avoidance, armor and stamina, so it treats a crit and a plain hit as equally bad once they land. The damage-per-swing figure in the breakdown is the number that accounts for crit and crush multipliers, and it counts a blocked swing as a full hit because block subtracts a flat block value rather than a fraction — a slight overestimate for a shield tank.

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
