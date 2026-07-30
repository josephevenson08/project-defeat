---
type: spec
class: Druid
spec: Restoration
role: Healer
generated: true
tags: [brain/domain, domain/spec, role/Healer]
---

# Restoration Druid

[[Druid]] · [[Healer]]

## Signature ability

**Lifebloom** — spell ID 33763, HoT

- Cast: instant · GCD 1.5s
- Base amount: 600–600
- Spell power coefficient: 0.5194 (basis: hardcoded exception)
- Cost: 220 Mana

> Restoration Druid healing is built on rolling Lifebloom stacks (up to 3 on a target, refreshed before the bloom fires) plus Rejuvenation (rank 13, spell 26982, 415 mana, 1060 over 12s, 0.8 total coefficient) and Regrowth (rank 10, spell 26980, 675 mana, 2.0s cast, 1253-1394 direct + 1274 over 21s). Lifebloom has only one rank in TBC. The `baseAmount` field holds the 600 bloom that fires when the stack expires or is dispelled; `periodic` holds the 273-over-7s HoT. The rolling-stack refresh mechanic means a single-cast model understates Lifebloom's real throughput considerably. Healing Touch (rank 13, spell 26979, 935 mana, 3.5s, 2715-3206, coefficient 1.0) is the better anchor if the simulator needs a plain cast-time heal instead.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Karazhan]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
