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

> Crusader Strike has no intrinsic level requirement — it is gated purely by spending 41 points in Retribution, so `requiredLevel` is omitted. It is the spec's only real rotational button, but it is a 6s cooldown rather than a filler — Retribution's actual damage is dominated by auto attacks with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on cooldown, with Crusader Strike woven in and used to refresh Judgement debuffs. Because the simulator now layers computable specials on top of white damage, Crusader Strike's numbers are consumed — and note that Ret is the physical spec where the special-attack share of damage is smallest. A sourcing pass established what else Ret presses and why none of it is modelled: the Seals are NOT rotational buttons but 30s self-buff auras whose damage rides passively on auto-attacks (Seal of Blood procs on every white hit, Seal of Command at 7 PPM with a 1s internal cooldown), so they do not fit this schema at all. Exorcism is hard-gated to Undead and Demon targets, which most Tier 5 bosses are not. Consecration is the same ability and rank as the Protection entry, but Ret uses it sparingly for mana reasons rather than on cooldown. Judgement of Blood is the one genuinely computable addition — 10s cooldown, and it does not even trigger the GCD — but it is Holy-school damage scaling off spell power while rolling crit off the *melee* crit table, so it is neither a clean `Melee Special` nor a clean `Direct Damage`. The rotation resolver only handles `Melee Special`, so adding it today would be data nothing consumes.

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
