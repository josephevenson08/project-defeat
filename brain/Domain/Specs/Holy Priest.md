---
type: spec
class: Priest
spec: Holy
role: Healer
generated: true
tags: [brain/domain, domain/spec, role/Healer]
---

# Holy Priest

[[Priest]] · [[Healer]]

## Signature ability

**Circle of Healing** (rank 5) — spell ID 34866, Direct Heal

- Cast: instant · GCD 1.5s
- Base amount: 409–451
- Spell power coefficient: 0.2143 (basis: instant 1.5/3.5)
- Cost: 450 Mana

> Circle of Healing is the 31-point Holy talent and the defining Phase 1/2 Holy Priest button. Critically, it has NO cooldown in TBC (the 6s cooldown is a later Wrath-era change), which is exactly why "CoH spam" was the raid-healing meta — so unlike most instants in this data set it genuinely is cast every GCD. Greater Heal and Flash Heal fill the single-target role, and Prayer of Mending (spell 33076, 390 mana, instant, 10s cooldown, 800 per bounce, 5 bounces) is kept rolling. Flagged because the 0.2143 is derived from the TBC area-effect halving rule rather than read off a source that states Circle of Healing's coefficient directly; the underlying rule is well established but the specific number was not independently confirmed.

## Best in slot

- **Phase 2** — 53 ranked entries across 15 slots · source: Priest Healing Best in Slot (BiS) Phase 2 Gear Guide



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
