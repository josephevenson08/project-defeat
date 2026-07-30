---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Gear Slots

_The 18-slot TBC paperdoll, including the spec-dependent Ranged/Relic swap._

The slot model is the full TBC paperdoll, including paired slots (two rings, two trinkets) and the Ranged/Relic slot that swaps meaning by class: Shamans see Totem, Paladins Libram, Druids Idol, and everyone else a bow/gun/crossbow.

Slot *visibility* is therefore spec-aware rather than fixed, and slot *compatibility* has to understand that Finger 1 and Finger 2 accept the same items while respecting unique-equipped.

## Where this lives in the code

- [[domain.gear.gearSlots]] — `src/domain/gear/gearSlots.ts`
- [[domain.gear.slotVisibility]] — `src/domain/gear/slotVisibility.ts`
- [[domain.gear.slotCompatibility]] — `src/domain/gear/slotCompatibility.ts`
- [[domain.gear.characterItemRules]] — `src/domain/gear/characterItemRules.ts`

## Related

- [[Best in Slot]]
- [[Sockets and Gems]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
