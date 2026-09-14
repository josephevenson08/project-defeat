---
type: phase
number: 3
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 3 - Character Systems

**Status: partial**

Buffs, debuffs, and consumables are wired into the stat pipeline. Talents are not started.

## Done

- Buffs as flat stats and percentage multipliers
- Target debuffs: armor reduction, crit taken, spell damage taken
- Consumables with Alchemy/Cooking provenance
- All 13 professions: skill tiers, trainer requirements, material farm locations, leveling paths
- Wowhead Phase 2 spec tier lists (DPS, healer, tank) as their own section — 28 placements covering all 27 specs
- Talent trees for all nine classes: 579 talents across 27 trees, with icons, per-rank descriptions and prerequisite gating
- Professions on the character: a two-slot picker in the rail, gating TBC's one always-on profession stat bonus. Enchanting's ring enchants are Enchanter-only and now reach both fingers rather than neither being gated and only one being offered

## Remaining

- Race/class-specific assumptions beyond legality checks
- Feral bear/cat mode split

## Key modules

- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.consumables.sampleConsumables]] — `src/domain/consumables/sampleConsumables.ts`
- [[domain.professions.sampleProfessions]] — `src/domain/professions/sampleProfessions.ts`
- [[domain.professions.characterProfessions]] — `src/domain/professions/characterProfessions.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[domain.tierlists.tierLists]] — `src/domain/tierlists/tierLists.ts`
- [[features.tierlists.TierListsPanel]] — `src/features/tierlists/TierListsPanel.tsx`

## Neighbours

- [[Phase 2 - Gear Gems Enchants|Previous phase]]
- [[Phase 4 - Simulation|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
