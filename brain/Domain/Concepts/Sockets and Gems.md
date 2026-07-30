---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Sockets and Gems

_Socket colours, socket bonuses, and the meta-gem activation rule._

TBC introduced sockets. Each socket has a colour (Red/Yellow/Blue/Meta); matching every socket's colour grants the item's socket bonus, which is often worth more than upgrading one gem.

Meta gems are the interesting constraint: each carries an activation requirement expressed in coloured gems already socketed elsewhere ("at least 2 Red gems", "more Blue than Yellow"), so a meta gem can be equipped and still be inactive. That coupling between one slot's gem and the rest of the set is why gem choice cannot be optimised slot by slot.

## Where this lives in the code

- [[domain.gems.gemTypes]] — `src/domain/gems/gemTypes.ts`
- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`
- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`

## Related

- [[Best in Slot]]
- [[Enchants]]
- [[Jewelcrafting]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
