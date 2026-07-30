---
type: spec
class: Mage
spec: Arcane
role: Caster DPS
generated: true
tags: [brain/domain, domain/spec, role/Caster-DPS]
---

# Arcane Mage

[[Mage]] · [[Caster DPS]]

## Signature ability

**Arcane Blast** (rank 3) — spell ID 30451, Direct Damage

- Cast: 2.5s · GCD 1.5s
- Base amount: 668–772
- Spell power coefficient: 0.7143 (basis: castTime/3.5)
- Cost: 195 Mana (base cost; each Arcane Blast stack adds 75% of the base cost)

> Arcane Blast is new in TBC and defines the spec. Each cast applies a stacking buff (max 3, 8s duration) that cuts 0.33s off the cast time and adds 75% of the base mana cost per stack, so a 3-stack Arcane Blast costs 4x base mana and casts in 1.5s. The real Phase 1/2 rotation is therefore a mana-limited ramp — stack to 3, then either keep blasting or dump into Arcane Missiles / Frostbolt while the stacks decay — which a single-ability model cannot express. The mana cost recorded here is the unstacked base; a sustained rotation pays substantially more per cast.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Magtheridon's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
