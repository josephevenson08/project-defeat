---
type: spec
class: Priest
spec: Shadow
role: Caster DPS
generated: true
tags: [brain/domain, domain/spec, role/Caster-DPS]
---

# Shadow Priest

[[Priest]] · [[Caster DPS]]

## Signature ability

**Mind Flay** (rank 7) — spell ID 25387, DoT

- Cast: 3s (channeled) · GCD 1.5s
- Spell power coefficient: 0.57 (basis: hardcoded exception)
- Cost: 230 Mana

> Shadow Priest DPS is Mind Blast / Shadow Word: Death weaving around Mind Flay, not a pure Mind Flay channel: the real rotation keeps Shadow Word: Pain and Vampiric Touch up, fires Mind Blast (rank 11, spell 25375, 450 mana, 1.5s cast, 8s cooldown, 711-752, coefficient 0.4286) on every cooldown, and channels Mind Flay only in the gaps — often clipping the channel early to catch Mind Blast coming off cooldown. Mind Flay is the honest "filler" answer but it is the lowest-value cast in the rotation, so a Mind-Flay-only model understates Shadow. Note also that Shadow Priests are brought for Vampiric Touch mana return to the caster group, which no single-ability model captures.

## Best in slot

- **Phase 2** — 17 ranked entries across 17 slots · source: Starter guide-structured sample inspired by Wowhead/wowtbc.gg workflows

16 of 17 entries are flagged [[Needs Verification]].

Sends you to: [[Karazhan]], [[Magtheridon's Lair]], [[Serpentshrine Cavern]], [[Tempest Keep - The Eye]]

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
