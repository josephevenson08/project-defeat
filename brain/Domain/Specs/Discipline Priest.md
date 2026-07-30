---
type: spec
class: Priest
spec: Discipline
role: Healer
generated: true
tags: [brain/domain, domain/spec, role/Healer]
---

# Discipline Priest

[[Priest]] · [[Healer]]

## Signature ability

**Flash Heal** (rank 9) — spell ID 25235, Direct Heal

- Cast: 1.5s · GCD 1.5s
- Base amount: 1116–1295
- Spell power coefficient: 0.4286 (basis: instant 1.5/3.5)
- Cost: 470 Mana

> Discipline in TBC is a tank-healing spec, not a damage spec, and its throughput comes from fast reactive heals rather than a fixed rotation: Flash Heal for speed, Greater Heal (rank 7, spell 25213, 825 mana, 3.0s cast, 2414-2803, coefficient 0.8571) when a big heal is needed, Power Word: Shield pre-applied, and Power Infusion / Pain Suppression as cooldowns. Flash Heal is chosen as the signature because it is the spec's highest-frequency cast, but Discipline's real value is partly in buffs it gives other players, which this model does not represent at all.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
