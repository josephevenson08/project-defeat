---
type: module
layer: domain
source: src/domain/raidcomp/raidBuilds.ts
lines: 128
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.raidcomp.raidBuilds

`src/domain/raidcomp/raidBuilds.ts` · **domain** layer · 128 lines

From the top of the file:

> What a player actually signs up as, which is not the same list as `TbcSpec`.
> 
> **Why this exists instead of widening `TbcSpec`.** That union is keyed on by BiS rankings, talent
> trees, tier lists and the simulator; adding "Feral Tank" there would mean inventing a BiS list and
> a talent tree for something Blizzard never defined as a separate spec. A raid roster asks a
> different question — *what are you bringing tonight* — and the answer distinguishes a bear from a
> cat where a gear planner does not.
> 
> Every build therefore maps back to a real `(className, spec)` pair, and **buff coverage matches on
> that pair**, never on the build. A Feral tank and a Feral cat both bring Leader of the Pack,
> because in the game they are the same talent tree wearing different forms.

## Exports

**function** — `getRaidBuild`

**const** — `raidBuilds`, `raidBuildsByClass`

**type** — `RaidBuild`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.character.tbcClasses]] — `src/domain/character/tbcClasses.ts`
- [[domain.raidcomp.raidcompIcons]] — `src/domain/raidcomp/raidcompIcons.ts`

## Imported by

- [[domain.raidcomp.buffCoverage]] — `src/domain/raidcomp/buffCoverage.ts`
- [[domain.raidcomp.index]] — `src/domain/raidcomp/index.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
