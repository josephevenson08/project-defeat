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

> The app models Feral as a single physical-DPS spec with no bear/cat split, so this is the cat (DPS) side: Shred is the combo-point builder the cat rotation is built around, behind the target, with Mangle (Cat) (rank 3, spell 33983, 45 energy, 160% weapon damage + 264) maintained for its +30% Shred/bleed debuff and Rip/Ferocious Bite as finishers. Bear (tank) Feral is instead built on Mangle (Bear) (rank 3, spell 33987, 20 rage, 6s cooldown, 115% weapon damage + 155) — that variant is not represented anywhere in this data set. Also note the simulator now layers computable specials on top of white damage, so Shred's numbers are consumed — and that is currently a problem. CAT FORM DOES NOT USE THE EQUIPPED WEAPON'S DAMAGE AT ALL: TBC gives cat form a fixed synthetic "paw" weapon (43.5-66.5 damage at 1.0s speed) and every cat ability reads that, never the equipped item. The equipped weapon contributes only indirectly, as a flat Feral Attack Power conversion from its DPS. This project's `averageSwingDamage` reads the equipped weapon's damage dice directly, so Shred is currently scaling off dice the real ability never touches. Mangle (Cat) (45 energy, 160% weapon damage + 264) and Rake (spell 27003, 40 energy, 78 + 0.01xAP plus a 9s bleed) are both sourced and both computable from their fixed energy costs, but are deliberately NOT added yet: layering more abilities onto a weapon model that is wrong for this form multiplies the error instead of reducing it. Rip and Ferocious Bite are excluded for a different reason — both are combo-point finishers, and Ferocious Bite additionally spends all remaining energy, so neither has a rate derivable from a fixed cost. Tiger's Fury is a pure self-buff with no damage component, and Savage Roar does not exist in TBC at all. The needsVerification flag also covers the bear/cat ambiguity, which is a modeling choice this project has not made.

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
