---
type: module
layer: domain
source: src/domain/tierlists/specStanding.ts
lines: 191
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.tierlists.specStanding

`src/domain/tierlists/specStanding.ts` · **domain** layer · 191 lines

From the top of the file:

> Where a spec stands, gathered from every source the app has: its place on each of Wowhead's lists,
> what players actually parse (archon.gg), what it brings to a raid, and the ability it is built
> around. This is the Spec Tier Lists tab's spec card (design A, decided 2026-10-12), and the rows of
> its "Against the logs" view (design B).
> 
> **Two opinions, kept apart.** Wowhead's tiers are their guide writers' judgement; archon.gg's DPS
> is an average of uploaded logs, with tier letters of its own. Neither is folded into the other, so
> the page can show where they disagree rather than averaging the disagreement away.

## Exports

**function** — `byWowheadTier`, `compareWithLogs`, `describeGap`, `getSpecStanding`, `tierGap`, `wowheadDpsTier`

**const** — `allSpecs`, `logsOrder`, `sameSpec`, `specKey`, `TIER_ORDER`

**type** — `ListPlace`, `LogsComparison`, `LogsStanding`, `SpecContribution`, `SpecRef`, `SpecStanding`

## Imports

- [[domain.abilities.sampleSignatureAbilities]] — `src/domain/abilities/sampleSignatureAbilities.ts`
- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`
- [[domain.simulation.dpsReference]] — `src/domain/simulation/dpsReference.ts`
- [[domain.tierlists.tierLists]] — `src/domain/tierlists/tierLists.ts`
- [[domain.tierlists.tierListTypes]] — `src/domain/tierlists/tierListTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.tierlists.AgainstTheLogs]] — `src/features/tierlists/AgainstTheLogs.tsx`
- [[features.tierlists.SpecCard]] — `src/features/tierlists/SpecCard.tsx`
- [[features.tierlists.SpecTip]] — `src/features/tierlists/SpecTip.tsx`
- [[features.tierlists.TierBoard]] — `src/features/tierlists/TierBoard.tsx`
- [[features.tierlists.tierFormat]] — `src/features/tierlists/tierFormat.ts`
- [[features.tierlists.TierListsPanel]] — `src/features/tierlists/TierListsPanel.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
