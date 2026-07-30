---
type: spec
class: Shaman
spec: Enhancement
role: Physical DPS
generated: true
tags: [brain/domain, domain/spec, role/Physical-DPS]
---

# Enhancement Shaman

[[Shaman]] · [[Physical DPS]]

## Signature ability

**Stormstrike** — spell ID 17364, Melee Special

- Cast: instant · GCD 1.5s · CD 10s
- Scaling basis: weapon damage
- Cost: 237 Mana (8% of base mana)

> Stormstrike has no intrinsic level requirement — it is gated purely by talent points spent in Enhancement, so `requiredLevel` is omitted. It is the Enhancement signature button, but on a 10s cooldown it is a small share of the spec's output — Enhancement damage is dominated by Windfury Weapon procs on white swings, with Flametongue on the off-hand and Shamanistic Rage for sustain. It also applies a debuff increasing the target's Nature damage taken by 20% for the next 2 Nature hits, which is worth real DPS to Elemental shamans in the group. Because the simulator currently models white damage only for physical specs, these numbers are staged for later use; note that Enhancement is the spec where white damage alone comes closest to being the right answer, provided Windfury is modeled.

## Best in slot

- **Phase 2** — 19 ranked entries across 18 slots · source: Starter guide-structured sample inspired by Wowhead/WoWSims workflows

9 of 19 entries are flagged [[Needs Verification]].

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
