---
type: reference
generated: true
tags: [brain/project]
---

# Known Limitations

Kept deliberately blunt. A planner that overstates its accuracy is worse than one that admits where it guesses.

## Simulation

- **Rotations cover 2 specs of 27** — Warrior Arms and Fury. Every other spec is modelled from a single signature ability, which understates any spec whose damage is spread across several buttons. This is the largest remaining gap. It is **not** why the Simulation tab is hidden for some roles: that tab is shown for the 20 DPS specs and hidden for the 5 Healer and 2 Tank ones because this project is for DPS.
- **"Single-ability approximation" overstated hunter coverage until 2026-08-23**, when the real count was zero — the rotation resolver filtered on `'Melee Special'` and never looked at Steady Shot. It is modelled now, bounded by the 1.5s hunter global cooldown and by one shot per auto-shot cycle.
- **Retribution's seals and judgement are modelled, and are faction-split** — Seal of Blood is Horde-only in Phase 2, and its judgement deals 295-325 against Judgement of Command's 68-73. Their Holy damage is **not** reduced by armor, which makes it the only unmitigated damage on the physical path. Seal of the Martyr, the Alliance equivalent added in 2.4, is out of scope with the rest of that patch.
- **Windfury Weapon is modelled for Enhancement as a proc, not an ability** — 20% per landed main-hand swing, capped by a 3s internal cooldown. The main hand is *assumed* to carry the imbue, because there is no weapon-imbue slot to read, and Elemental Weapons is not applied since it has no ingested talent effect. Flametongue on the off-hand is not modelled either.
- **No mana-costed ability is capped by mana.** `StatBlock` has no mana field, so the estimate reports the mana per second the modelled rate spends rather than enforcing a pool it would have to invent. It reaches every mana-costed physical ability — the hunter shot that prompted it, and an Enhancement shaman's Stormstrike.
- The caster and healer paths model one real ability per spec ([[Signature Abilities]]) — no cooldowns, procs, downranking, or multi-spell priority.
- No multi-iteration variance and no result charts, so every number is a point estimate with no error bar.
- Spell school is not recorded anywhere, which is why school-scoped debuffs and per-spell caster talents cannot be applied.

## Talents

- Talents reach all 27 specs, but **coverage is not completeness**: 44 talent groups are refused by name, each with a reason. A talented estimate reads low, especially for casters.
- The two kinds refused are per-spell effects (needing a spell school) and stat-pipeline effects like Toughness and Vitality (needing `calculateStats`).
- **Two talents that raise healing are modelled for their damage half only.** Spiritual Guidance and Lunar Guidance raise spell damage *and* healing in game, but wowsims implements no healer for either class at the pinned commit, so only the sourced half is ingested. A healer estimate reads low by it.

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
