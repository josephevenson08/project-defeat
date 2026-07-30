---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Spell Table

_The spell-side equivalent: hit capped by level difference, then crit._

Spells use a much simpler table than physical attacks: they either miss or land, and a landed spell can crit. There is no dodge, parry, glance, or block on the spell side.

Base spell miss against a target three levels above the caster is 17% in TBC, which is where the famous 202 spell-hit-rating cap comes from — 16% of it is removable by gear and the last 1% is not. Talents that grant spell hit (Elemental Precision, Suppression) reduce the amount of rating needed, so the practical cap is spec-dependent.

## Where this lives in the code

- [[domain.simulation.spellTable]] — `src/domain/simulation/spellTable.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Related

- [[Attack Table]]
- [[Spell Coefficients]]
- [[Stat Weights]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
