---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Spell Coefficients

_How much of your spell power a given ability actually receives._

TBC derives almost every spell coefficient from one formula rather than storing it per spell:

- Direct damage and healing: `castTime / 3.5`, with the cast time first clamped to [1.5s, 7s]. Every instant cast therefore shares the 1.5/3.5 = 0.4286 floor, and a 3.5s cast reaches 1.0.
- Periodic effects: `duration / 15`, split evenly across ticks. An 18s DoT carries 1.2 total.
- Channels use the channel duration in place of a cast time.

Two modifiers explain most values that look wrong at first glance: area-effect abilities receive only **half** the computed coefficient, and each additional non-damage effect (a slow, a stun) costs a further **5%** multiplicatively. Frostbolt's 0.8143 is exactly `(3.0 / 3.5) * 0.95` because of its slow.

A handful of abilities are hardcoded exceptions the formula gets wrong — Fireball keeps a full 1.0 on its direct component while its DoT tail scales with nothing. That is why the simulator reads each ability's researched coefficient where one exists instead of recomputing it.

## Where this lives in the code

- [[domain.simulation.damageFormulas]] — `src/domain/simulation/damageFormulas.ts`
- [[domain.abilities.abilityTypes]] — `src/domain/abilities/abilityTypes.ts`

## Related

- [[Spell Table]]
- [[Signature Abilities]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
