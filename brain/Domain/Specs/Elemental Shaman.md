---
type: spec
class: Shaman
spec: Elemental
role: Caster DPS
generated: true
tags: [brain/domain, domain/spec, role/Caster-DPS]
---

# Elemental Shaman

[[Shaman]] · [[Caster DPS]]

## Signature ability

**Lightning Bolt** (rank 12) — spell ID 25449, Direct Damage

- Cast: 2.5s · GCD 1.5s
- Base amount: 571–652
- Spell power coefficient: 0.794 (basis: hardcoded exception)
- Cost: 300 Mana

> Elemental is a Lightning Bolt filler spec, with Chain Lightning (rank 6, spell 25442, 2.0s cast, 6s cooldown, 734-838, coefficient ~0.641-0.651) fired on cooldown and Earth Shock/Flame Shock woven in, plus a totem set to maintain. Lightning Overload procs free half-damage copies of Lightning Bolt, which meaningfully raises effective throughput above what a single-cast model predicts. Minor source conflict on Chain Lightning: wowsims uses 0.651, TBC server data uses 0.641 — this does not affect the Lightning Bolt value used here, where both sources agree on 0.794.

## Best in slot

- **Phase 2** — 58 ranked entries across 15 slots · source: Elemental Shaman DPS Best in Slot (BiS) Phase 2 Gear Guide



Sends you to: [[Gruul's Lair]], [[Karazhan]], [[Magtheridon's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
