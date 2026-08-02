---
type: spec
class: Rogue
spec: Assassination
role: Physical DPS
generated: true
tags: [brain/domain, domain/spec, role/Physical-DPS]
---

# Assassination Rogue

[[Rogue]] · [[Physical DPS]]

## Signature ability

**Mutilate** — spell ID 34413, Melee Special

- Cast: instant · GCD 1s
- Scaling basis: weapon damage
- Cost: 60 Energy

> Mutilate is the 41-point Assassination talent and the spec's combo-point builder, awarding 2 points per cast and requiring the rogue to be behind the target. Assassination was not the Phase 1/2 raiding meta — Combat with swords was — so this spec matters more for completeness than for representative raid DPS. The two-weapon structure is the main modeling trap: naively applying `weaponDamageMultiplier` once will halve Mutilate's damage. Because the simulator now layers computable specials on top of white damage, this is consumed.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

12 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Gruul's Lair]], [[Karazhan]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

## Where this lives in the code

- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.abilities.sampleSignatureAbilities]] — `src/domain/abilities/sampleSignatureAbilities.ts`

## Related

- [[Best in Slot]]
- [[Signature Abilities]]
- [[Stat Weights]]
- [[Needs Verification]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
