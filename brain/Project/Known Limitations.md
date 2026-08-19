---
type: reference
generated: true
tags: [brain/project]
---

# Known Limitations

Kept deliberately blunt. A planner that overstates its accuracy is worse than one that admits where it guesses.

## Simulation

- **Rotations cover 2 specs of 27** — Warrior Arms and Fury. Every other spec is modelled from a single signature ability, which understates any spec whose damage is spread across several buttons. This is the largest remaining gap and the main reason the Simulation tab stays hidden.
- The caster and healer paths model one real ability per spec ([[Signature Abilities]]) — no cooldowns, procs, downranking, or multi-spell priority.
- No multi-iteration variance and no result charts, so every number is a point estimate with no error bar.
- Spell school is not recorded anywhere, which is why school-scoped debuffs and per-spell caster talents cannot be applied.

## Talents

- Talents reach all 27 specs, but **coverage is not completeness**: 49 talent groups are refused by name, each with a reason. A talented estimate reads low, especially for casters.
- The two kinds refused are per-spell effects (needing a spell school) and stat-pipeline effects like Toughness and Vitality (needing `calculateStats`).
- **Talents do not reach the always-visible stat rail** — only the simulation. Spending points moves the estimate but not the paperdoll totals, gear rankings or upgrade finder. Widening that is an open product decision.

## Data

- The catalogue is ingested from a pinned upstream commit rather than authored, and 99.5% of entries carry a real item ID. The curated layer contributes provenance only. See [[Data Provenance]].
- [[Needs Verification]] remains on part of the curated layer, but most of those flags govern stat blocks the ingest overrides and so cannot affect the app. The figure to watch is the unmatched curated count.

## Scope

- **Phase 2 and only Phase 2.** 1,196 later-phase items are present but gated out of every reachable path.
- Feral Druid is treated as physical DPS; bear/cat mode is not split.
- **The app has a fixed minimum width of roughly 806px and is not mobile-responsive.** This is the shell rather than any one panel.
- No backend by design. The app stays local-first; shareable links or account sync would be the only reasons to add one.

## Related

- [[Data Provenance]]
- [[Roadmap Board]]
- [[Stat Weights]]

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
