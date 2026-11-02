---
type: module
layer: domain
source: src/domain/simulation/dpsReference.ts
lines: 87
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.dpsReference

`src/domain/simulation/dpsReference.ts` · **domain** layer · 87 lines

From the top of the file:

> What each DPS spec's best players parse in Phase 2, from logs rather than from theory.
> 
> **This exists because the simulator had no way to be wrong.** Every number it produced was
> internally consistent and nothing compared it to reality, so a spec reading 522 where players do
> 1,693 looked exactly like a spec reading correctly. `featureFlags.ts` said "roughly 4x low" on the
> strength of one person's judgement; this table is what turns that into a measurement.
> 
> **Source:** Warcraft Logs Fresh, SSC / TK, Statistics: Damage, All Bosses, DPS, **95th
> percentile**, over a range of 2 weeks, current standings, aggregated per second, Phase 2. Read on
> 2026-11-02, after Phase 3 opened, so the figure covers the whole of Phase 2; the parse count beside
> each is what that percentile is taken from.
> 
> **A 95th percentile, and it always was.** Until 2026-11-02 this table held archon.gg's tier-list
> figures for the same raids, read on 2026-08-23 and called "observed averages" here. archon's page
> says its figures are each spec's 95th percentile, and Warcraft Logs' Phase 2 95th percentile matches
> those August figures within about 1% for every widely played spec, in the same order. So the
> calibration test was already comparing a best case (rank-1 BiS, every buff) with a near-ceiling,
> not with an average, and every sentence that said "average" was wrong. The thinly played specs
> moved most with the fuller phase: Subtlety 1,292 to 1,391, Assassination 1,362 to 1,434,
> Demonology 1,619 to 1,687, Marksmanship 1,341 to 1,386.
> 
> **Why Warcraft Logs and not archon now:** archon builds its list from the last 14 days, and with
> Phase 3 live it shows only Black Temple and Hyjal. Warcraft Logs keeps Phase 2 as a partition.
> 
> Cross-checked where it could be: the repo owner's own Hydross parse came in at **1,709.3**, against
> Enhancement's 95th percentile here of **1,702**.
> 
> **Two limits worth stating.** A spec with few parses (Subtlety's 1,276, Assassination's 2,013) has a
> percentile that moves more than one with 400,000. And an aggregate over every boss flattens fights
> with heavy movement or add phases, so the app should land *near* these rather than on them.

## Exports

**function** — `getDpsReference`

**const** — `DPS_REFERENCE_READ_ON`, `DPS_REFERENCE_SOURCE`, `DPS_REFERENCE_URL`, `DPS_TIER_READ_ON`, `DPS_TIER_URL`, `dpsReference`

**type** — `DpsReference`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

- [[components.layout.SectionPicker]] — `src/components/layout/SectionPicker.tsx`
- [[domain.tierlists.specStanding]] — `src/domain/tierlists/specStanding.ts`
- [[features.simulator.bestCase]] — `src/features/simulator/bestCase.ts`
- [[features.simulator.simFormat]] — `src/features/simulator/simFormat.ts`
- [[features.simulator.TrustPanel]] — `src/features/simulator/TrustPanel.tsx`
- [[features.tierlists.AgainstTheLogs]] — `src/features/tierlists/AgainstTheLogs.tsx`
- [[features.tierlists.tierFormat]] — `src/features/tierlists/tierFormat.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
