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

> The app models Feral as a single physical-DPS spec with no bear/cat split, so this is the cat (DPS) side: Shred is the combo-point builder the cat rotation is built around, behind the target, with Mangle (Cat) (rank 3, spell 33983, 45 energy, 160% weapon damage + 264) maintained for its +30% Shred/bleed debuff and Rip/Ferocious Bite as finishers. Bear (tank) Feral is instead built on Mangle (Bear) (rank 3, spell 33987, 20 rage, 6s cooldown, 115% weapon damage + 155) — that variant is not represented anywhere in this data set. Cat form does NOT use the equipped weapon's damage: TBC substitutes a fixed internal weapon (43.5-66.5 at 1.0s speed) and every cat ability reads that instead. The simulator models this via `CAT_FORM_WEAPON`, so Shred no longer scales off damage dice the real ability never touches. The equipped weapon still matters, but only as a stat stick — Agility, Strength, and above all **Feral Attack Power**, which TBC puts on druid weapons as an explicit item stat added 1:1 into attack power. This catalog does not record Feral Attack Power on any item yet, so Feral weapon comparisons currently under-differentiate; that is a gap in the item data rather than in the damage model. Mangle (Cat) (45 energy, 160% weapon damage + 264) and Rake (spell 27003, 40 energy, 78 + 0.01xAP plus a 9s bleed) are both sourced and both computable from their fixed energy costs, and are the obvious next additions now that the weapon model underneath them is right. Rip and Ferocious Bite stay excluded for a different reason — both are combo-point finishers, and Ferocious Bite additionally spends all remaining energy, so neither has a rate derivable from a fixed cost. Tiger's Fury is a pure self-buff with no damage component, and Savage Roar does not exist in TBC at all. The needsVerification flag covers the bear/cat ambiguity, which is a modeling choice this project has not made.

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
