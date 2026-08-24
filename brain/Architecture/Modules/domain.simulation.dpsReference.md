---
type: module
layer: domain
source: src/domain/simulation/dpsReference.ts
lines: 67
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.dpsReference

`src/domain/simulation/dpsReference.ts` · **domain** layer · 67 lines

From the top of the file:

> What each DPS spec actually parses at in Phase 2, from logs rather than from theory.
> 
> **This exists because the simulator had no way to be wrong.** Every number it produced was
> internally consistent and nothing compared it to reality, so a spec reading 522 where players do
> 1,693 looked exactly like a spec reading correctly. `featureFlags.ts` said "roughly 4x low" on the
> strength of one person's judgement; this table is what turns that into a measurement.
> 
> **Source:** archon.gg's Classic Fresh DPS tier list for raid content, SSC/Tempest Keep — the same
> phase this app is scoped to — read on 2026-08-23 from
> `/classic-fresh/tier-list/dps-rankings/raid/normal/all-bosses`. Archon aggregates uploaded Warcraft
> Logs parses; the build pages behind the same figures quote 133,329 parses across the top 50% of the
> last 14 days.
> 
> **These are observed averages, not theoretical ceilings, and that is the right target for this
> app.** A planner should predict what a competent raider does, not what a flawless one could do.
> 
> Cross-checked where it could be: the repo owner's own Hydross parse came in at **1,709.3** against
> this table's **1,693** for Enhancement, a 1% difference, which is the only independent confirmation
> available and is a reassuring one.
> 
> **Two limits worth stating.** These are a single point in time on a moving meta, so they will drift
> as gear does — the date above is part of the datum. And an average across all bosses flattens
> fights with heavy movement or add phases, which is why the app should aim to land *near* these
> rather than on them.

## Exports

**function** — `getDpsReference`

**const** — `DPS_REFERENCE_SOURCE`, `dpsReference`

**type** — `DpsReference`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`

## Imported by

_None._

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
