---
type: spec
class: Shaman
spec: Restoration
role: Healer
generated: true
tags: [brain/domain, domain/spec, role/Healer]
---

# Restoration Shaman

[[Shaman]] · [[Healer]]

## Signature ability

**Chain Heal** (rank 5) — spell ID 25423, Direct Heal

- Cast: 2.5s · GCD 1.5s
- Base amount: 833–950
- Spell power coefficient: 0.7143 (basis: castTime/3.5)
- Cost: 540 Mana

> Restoration Shaman is the archetypal Chain Heal spec in TBC — raid-wide smart healing plus totems is the entire reason the spec is brought, and Chain Heal is cast almost to the exclusion of everything else. Lesser Healing Wave and Healing Wave (coefficient 0.8571, which is stored as an explicit override but happens to equal the 3.0s / 3.5 formula value anyway) cover single-target emergencies. A single-target model of Chain Heal will understate Restoration Shaman throughput by roughly 75%, since the jumps are the whole point.

## Best in slot

- **Phase 2** — 18 ranked entries across 18 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 18 entries are flagged [[Needs Verification]].

Sends you to: [[Karazhan]], [[Magtheridon's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
