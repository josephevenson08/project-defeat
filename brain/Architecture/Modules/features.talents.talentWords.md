---
type: module
layer: features
source: src/features/talents/talentWords.ts
lines: 294
generated: true
tags: [brain/architecture, layer/features]
---

# features.talents.talentWords

`src/features/talents/talentWords.ts` · **features** layer · 294 lines

From the top of the file:

> What the simulator reads from a talent, in plain words, for the talent window's tooltip: "In the
> simulation: +20% attack speed for 3 swings after a crit", or why it is not simulated. The numbers
> are the ingested wowsims effects (`talentEffects.json`), the same ones `deriveTalentModifiers` sums.

## Exports

**function** — `talentEffectLines`, `talentSimStatus`

**const** — `talentsSources`

**type** — `TalentSimStatus`

## Imports

- [[components.ui.Provenance]] — `src/components/ui/Provenance.tsx`
- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.buffs.sampleTargetDebuffs]] — `src/domain/buffs/sampleTargetDebuffs.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.stats.statTypes]] — `src/domain/stats/statTypes.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[domain.talents.talentWindow]] — `src/domain/talents/talentWindow.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
