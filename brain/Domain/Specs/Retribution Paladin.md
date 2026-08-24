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

> Crusader Strike has no intrinsic level requirement — it is gated purely by spending 41 points in Retribution, so `requiredLevel` is omitted. It is the spec's only real rotational button, but it is a 6s cooldown rather than a filler — Retribution's actual damage is dominated by auto attacks with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on cooldown, with Crusader Strike woven in and used to refresh Judgement debuffs. Because the simulator now layers computable specials on top of white damage, Crusader Strike's numbers are consumed — and note that Ret is the physical spec where the special-attack share of damage is smallest — which was true and misleading, because the share that was missing is not special-attack damage at all, it is Holy. A sourcing pass established what else Ret presses and why none of it is modelled: the Seals are NOT rotational buttons but 30s self-buff auras whose damage rides passively on auto-attacks (Seal of Blood procs on every white hit, Seal of Command at 7 PPM with a 1s internal cooldown), so they do not fit this schema at all. **They are modelled anyway, since 2026-08-23** — in `domain/simulation/paladinSeals.ts` rather than here, because the simulator is not this schema. Together with the judgement they are worth 112.5 DPS to a Horde Ret and 70.6 to an Alliance one, which is more than half of what the spec does. Exorcism is hard-gated to Undead and Demon targets, which most Tier 5 bosses are not. Consecration is the same ability and rank as the Protection entry, but Ret uses it sparingly for mana reasons rather than on cooldown. Judgement is the other half, and it is faction-split in a way this note used to gloss: Judgement of Blood (spell 31898) deals **295-325** Holy, while Alliance runs Seal of Command whose judgement deals **68-73** (spell 20375). That gap is why Horde Retribution led early TBC, and modelling one for both would have been wrong by roughly a factor of four. Both are on the 10s cooldown of the Judgement button (spell 20271). **Two claims here were wrong and are corrected:** the judgement does trigger the GCD — upstream gives it `GCDDefault` — and "adding it today would be data nothing consumes" stopped being true when the seals got a home. It is Holy damage rolling crit off the melee table, and Holy means **armor does not reduce it**, which is the first unmitigated damage on the physical path.

## Best in slot

- **Phase 2** — 39 ranked entries across 14 slots · source: Retribution Paladin DPS Best in Slot (BiS) Phase 2 Gear Guide



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
