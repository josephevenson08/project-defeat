---
type: spec
class: Paladin
spec: Protection
role: Tank
generated: true
tags: [brain/domain, domain/spec, role/Tank]
---

# Protection Paladin

[[Paladin]] · [[Tank]]

## Signature ability

**Consecration** (rank 6) — spell ID 27173, DoT

- Cast: instant · GCD 1.5s · CD 8s
- Spell power coefficient: 0.952 (basis: hardcoded exception)
- Cost: 660 Mana

> Protection Paladin threat is a fixed-priority loop of three short cooldowns rather than a filler: Holy Shield (rank 4, spell 27179, 280 mana, 10s, 155 holy damage per block at a 0.05 coefficient, +35% threat) for mitigation and block damage, Judgement on its 10s cooldown for snap threat and seal debuffs, and Consecration on its 8s cooldown as the largest sustained threat and damage source. Consecration is picked as the signature because it is the biggest steady contributor, but note it is a ground effect on a cooldown, not something cast every GCD — a model that spams it every 1.5s will overstate Prot Paladin threat by roughly 5x.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

15 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Gruul's Lair]], [[Magtheridon's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
