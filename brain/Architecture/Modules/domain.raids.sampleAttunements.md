---
type: module
layer: domain
source: src/domain/raids/sampleAttunements.ts
lines: 251
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raids.sampleAttunements

`src/domain/raids/sampleAttunements.ts` · **domain** layer · 251 lines

From the top of the file:

> The attunement chains a Phase 2 player actually has to grind. Each is gated behind other
> attunements — Karazhan for SSC, the Arcatraz key for TK, and Karazhan's own chain behind three
> dungeon keys — which is why the prerequisites are listed separately from the steps. The steps
> alone badly understate how long any of this takes.
> 
> **Karazhan's chain was missing until 2026-08-23**, which was the conspicuous gap: it is the first
> attunement every TBC character grinds, and Serpentshrine's own prerequisites already referred to
> having done it. Its eight steps are each cited to the Wowhead quest id the wording was read from,
> so a reader can check any line without trusting this file.
> 
> Gruul's Lair and Magtheridon's Lair have no chains here because they have none in the game — both
> open to any level 70 raid, which is why they are where a fresh 25-player group starts.
> 
> All three are required during Phase 2, the phase this app targets (2026-05-14 on Anniversary realms).
> Blizzard staff confirmed that the SSC and TK attunements stopped being required when Phase 3 opened on
> 2026-08-27; secondary sources say Karazhan's went at the same time, but no Blizzard text names it. On
> Anniversary realms an attunement counts for every character on the Battle.net account.

## Exports

**function** — `getAttunementChainById`, `getAttunementChainForRaid`

**const** — `sampleAttunements`

## Imports

- [[domain.raids.raidTypes]] — `src/domain/raids/raidTypes.ts`

## Imported by

- [[domain.raids.index]] — `src/domain/raids/index.ts`

## Concepts & phases

- [[Attunement]]
- [[Step 2 Walkthrough]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
