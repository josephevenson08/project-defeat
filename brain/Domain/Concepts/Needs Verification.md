---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Needs Verification

_The project-wide honesty flag on approximated data._

Any value that was not read off a real source is flagged `needsVerification: true` and surfaced in the UI rather than silently presented as fact. This applies to item stats, weapon damage dice, BiS placements, raid drops not yet in the catalog, and the tank avoidance baseline.

The reason it exists: Wowhead's guide pages are JavaScript-rendered, so stat blocks were cross-checked against static summaries and prior knowledge rather than scraped. The flag is what keeps "approximated" from quietly becoming "sourced". Clearing flags is real, ongoing work — see the roadmap phases.

## Where this lives in the code

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`
- [[domain.abilities.abilityTypes]] — `src/domain/abilities/abilityTypes.ts`

## Related

- [[Data Provenance]]
- [[Best in Slot]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
