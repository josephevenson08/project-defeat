---
type: phase
number: 2
status: mostly complete
generated: true
tags: [brain/project, project/phase, status/mostly-complete]
---

# Phase 2 - Gear Gems Enchants

**Status: mostly complete**

Structured item data with sources, sockets, legality rules, and per-spec rankings for every spec.

## Done

- Structured item data with quality, source, phase, sockets, and socket bonuses
- Source/farming metadata: instance, boss, vendor, reputation, crafting profession
- Full crafting detail on crafted items: skill, specialization, recipe source, per-material farm spots
- Class/weapon/relic legality checks
- Phase 2 starter BiS for all 27 specs, including role meta gems and role-appropriate enchants
- Spec-aware slot labels and hidden-slot rules for every class
- Real item and gem icons: 4,741 entries mapped to 1,238 vendored files, offline and with no runtime network calls

## Remaining

- Reconcile every `needsVerification` item against a real Wowhead tooltip

## Key modules

- [[domain.gear.itemTypes]] — `src/domain/gear/itemTypes.ts`
- [[domain.gear.sampleItems]] — `src/domain/gear/sampleItems.ts`
- [[domain.bis.bisLists]] — `src/domain/bis/bisLists.ts`
- [[domain.gems.sampleGems]] — `src/domain/gems/sampleGems.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.icons.icons]] — `src/domain/icons/icons.ts`
- [[features.gear.ItemIcon]] — `src/features/gear/ItemIcon.tsx`

## Neighbours

- [[Phase 1 - Local Foundation|Previous phase]]
- [[Phase 3 - Character Systems|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
