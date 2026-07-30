---
type: spec
class: Mage
spec: Fire
role: Caster DPS
generated: true
tags: [brain/domain, domain/spec, role/Caster-DPS]
---

# Fire Mage

[[Mage]] · [[Caster DPS]]

## Signature ability

**Fireball** (rank 13) — spell ID 27070, Direct Damage

- Cast: 3.5s · GCD 1.5s
- Base amount: 649–821
- Spell power coefficient: 1 (basis: hardcoded exception)
- Cost: 425 Mana

> Fireball is the Fire mage filler. The real rotation also keeps a Scorch stack up for Improved Scorch and weaves Fire Blast, and Fire's damage profile leans heavily on Ignite rolling off crits — none of which a single-ability model captures, so Fire will be understated relative to Frost/Arcane in a crit-heavy setup. Improved Fireball shortens the cast by up to 0.5s; as of patch 2.3 this does not reduce the coefficient, which is why the 3.5s value is safe to keep at 1.0.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 17 entries are flagged [[Needs Verification]].

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
