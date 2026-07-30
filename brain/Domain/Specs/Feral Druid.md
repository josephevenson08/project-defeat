---
type: spec
class: Druid
spec: Feral
role: Physical DPS
generated: true
tags: [brain/domain, domain/spec, role/Physical-DPS]
---

# Feral Druid

[[Druid]] · [[Physical DPS]]

## Signature ability

**Shred** (rank 7) — spell ID 27002, Melee Special

- Cast: instant · GCD 1s
- Scaling basis: weapon damage
- Cost: 60 Energy

> The app models Feral as a single physical-DPS spec with no bear/cat split, so this is the cat (DPS) side: Shred is the combo-point builder the cat rotation is built around, behind the target, with Mangle (Cat) (rank 3, spell 33983, 45 energy, 160% weapon damage + 264) maintained for its +30% Shred/bleed debuff and Rip/Ferocious Bite as finishers. Bear (tank) Feral is instead built on Mangle (Bear) (rank 3, spell 33987, 20 rage, 6s cooldown, 115% weapon damage + 155) — that variant is not represented anywhere in this data set. Also note the simulator currently models white damage only for physical specs, so Shred's numbers are not yet consumed; flagged because the bear/cat ambiguity is a modeling choice this project has not made yet, not because the numbers are uncertain.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

12 of 17 entries are flagged [[Needs Verification]].

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
