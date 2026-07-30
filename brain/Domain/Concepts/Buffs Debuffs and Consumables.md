---
type: concept
generated: true
tags: [brain/domain, domain/concept]
---

# Buffs Debuffs and Consumables

_Raid buffs, target debuffs, and flask/elixir/food, all fed into the stat pipeline._

Three separate mechanics share one panel because they all resolve into the same stat pipeline:

- **Buffs** apply to the player, as flat stats or percentage multipliers.
- **Target debuffs** modify the *target*, not the player — armor reduction, physical and spell crit taken, spell damage taken. These are why raid DPS is superadditive: Winter's Chill and Improved Scorch make everyone else's damage go up.
- **Consumables** are flasks, elixirs, and food, each carrying its Alchemy or Cooking provenance so the planner can answer "who makes this?".

The distinction that trips people up: buffs multiply your own numbers, debuffs multiply everyone's.

## Where this lives in the code

- [[domain.buffs.buffTypes]] — `src/domain/buffs/buffTypes.ts`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.consumables.consumableTypes]] — `src/domain/consumables/consumableTypes.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`

## Related

- [[Stat Weights]]
- [[Alchemy]]
- [[Cooking]]

Up: [[TBC Knowledge Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
