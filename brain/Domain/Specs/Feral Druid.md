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

> The app models Feral as a single physical-DPS spec with no bear/cat split, so this is the cat (DPS) side: Shred is the combo-point builder the cat rotation is built around, behind the target, with Mangle (Cat) (rank 3, spell 33983, 45 energy, 160% weapon damage + 264) maintained for its bleed debuff and Rip/Ferocious Bite as finishers. **That debuff is bleeds only in TBC, not Shred** — upstream implements it as `PeriodicPhysicalDamageTakenMultiplier *= 1.3` for 12s, and the "Shred and Ravage" wording people remember belongs to a later expansion. This entry said "+30% Shred/bleed" until 2026-08-23 and was wrong in the direction that would have justified adding Mangle. Bear (tank) Feral is instead built on Mangle (Bear) (rank 3, spell 33987, 20 rage, 6s cooldown, 115% weapon damage + 155) — that variant is not represented anywhere in this data set. Cat form does NOT use the equipped weapon's damage: TBC substitutes a fixed internal weapon (43.5-66.5 at 1.0s speed) and every cat ability reads that instead. The simulator models this via `CAT_FORM_WEAPON`, so Shred no longer scales off damage dice the real ability never touches. The equipped weapon still matters, but only as a stat stick — Agility, Strength, and above all **Feral Attack Power**, which TBC puts on druid weapons as an explicit item stat added 1:1 into attack power. This catalog does not record Feral Attack Power on any item yet, so Feral weapon comparisons currently under-differentiate; that is a gap in the item data rather than in the damage model. Mangle (Cat) (45 energy, 160% weapon damage + 264) and Rake (spell 27003, 40 energy, 78 + 0.01xAP plus a 9s bleed) are both sourced and both computable from their fixed energy costs, and both looked like the obvious next additions. **Adding Mangle on its own would make this estimate worse, not better**, and that was measured rather than argued: Shred returns 11.8 damage per energy against 10.6 for Mangle, energy is the binding budget, and the Mangle debuff multiplies periodic physical damage — of which this spec currently models none. Maintaining it on a 12s refresh costs 3.75 of the 10 energy/sec and loses about 4% of the total. **Rake is therefore the prerequisite, not the sibling**: once a bleed exists for the debuff to multiply, both become worth adding together. A test pins the per-energy comparison so this is not rediscovered. Rip and Ferocious Bite stay excluded for a different reason — both are combo-point finishers, and Ferocious Bite additionally spends all remaining energy, so neither has a rate derivable from a fixed cost. Tiger's Fury is a pure self-buff with no damage component, and Savage Roar does not exist in TBC at all. The needsVerification flag covers the bear/cat ambiguity, which is a modeling choice this project has not made.

## Best in slot

- **Phase 2** — 53 ranked entries across 14 slots · source: Feral Druid DPS Best in Slot (BiS) Phase 2 Gear Guide



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
