---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Signature Abilities

_One real ability per spec, standing in for a full rotation._

Each of the 27 specs has one researched signature ability — a filler nuke, a maintained DoT, a spam heal, or a tank's primary threat button — recorded with its real cast time, base amount, coefficient, resource cost, and rank at level 70.

This is deliberately *not* a rotation model. It exists to replace the generic 3s-nuke and 2.5s-heal placeholders in the simulator with something spec-specific, and every entry's notes say how far that approximation sits from the spec's real rotation. Multi-ability priority, cooldown usage, proc modelling, and talent scaling are all still ahead.

Specs whose signature ability is a physical special (Bloodthirst, Mutilate, Steady Shot) keep the generic cast on the spell side, because those scale off attack power and weapon damage and belong to the physical path instead — where the melee ones are now layered on through a separate yellow attack table.

## Where this lives in the code

- [[domain.abilities.abilityTypes]] — `src/domain/abilities/abilityTypes.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Related

- [[Spell Coefficients]]
- [[Stat Weights]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
