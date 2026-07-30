---
type: spec
class: Paladin
spec: Retribution
role: Physical DPS
generated: true
tags: [brain/domain, domain/spec, role/Physical-DPS]
---

# Retribution Paladin

[[Paladin]] · [[Physical DPS]]

## Signature ability

**Crusader Strike** — spell ID 35395, Melee Special

- Cast: instant · GCD 1.5s · CD 6s
- Scaling basis: weapon damage
- Cost: 236 Mana (8% of base mana)

> Crusader Strike has no intrinsic level requirement — it is gated purely by spending 41 points in Retribution, so `requiredLevel` is omitted. It is the spec's only real rotational button, but it is a 6s cooldown rather than a filler — Retribution's actual damage is dominated by auto attacks with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on cooldown, with Crusader Strike woven in and used to refresh Judgement debuffs. Because the simulator currently models white damage only for physical specs, Crusader Strike's numbers are not yet consumed; when they are, note that Ret is the physical spec where the special-attack share of damage is smallest.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

14 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Gruul's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
