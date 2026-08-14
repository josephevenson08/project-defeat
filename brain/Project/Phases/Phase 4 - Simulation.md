---
type: phase
number: 4
status: partial
generated: true
tags: [brain/project, project/phase, status/partial]
---

# Phase 4 - Simulation

**Status: partial**

Real TBC attack-table and spell-table mechanics, plus per-spec signature abilities. No rotation model yet.

## Done

- Real attack table: miss/dodge/parry/glance/block/crit with skill differentials
- Real spell table: level-based miss, rating conversions, spell crit
- Armor mitigation and per-weapon damage dice
- Target model that active debuffs actually modify
- Per-spec signature abilities feeding the caster and healer estimates
- Configurable encounter settings and computed stat weights
- Rage income from auto attacks, implementing the wowsims formula, with swing-replacing abilities netting off both the damage and the rage of the swing they displace
- Melee and ranged haste: white damage and rage income both scale with attack speed (no Phase 2 item carries any, so it changes nothing today)
- Trinket and weapon effects: 49 procs and on-use buttons ingested from wowsims, folded into the stat totals at their uptime

## Remaining

- Talent scaling — the real blocker on rage income, since Flurry's 30% attack speed after a crit is where a Fury warrior's swing rate actually comes from
- Rage income beyond auto attacks: Bloodrage, Unbridled Wrath and damage taken are all unmodelled, so no rage dump can be afforded
- Multi-ability rotation priority and cooldown usage
- Effects StatBlock cannot express: damage procs, mana returns and health-only buffs are skipped rather than approximated (48 of them)
- Multi-iteration variance
- Result charts

## Key modules

- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.spellTable]] — `src/domain/simulation/spellTable.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.simulator.calculateStatWeights]] — `src/features/simulator/calculateStatWeights.ts`

## Neighbours

- [[Phase 3 - Character Systems|Previous phase]]
- [[Phase 5 - Planner Workflows|Next phase]]

Up: [[Roadmap Board]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
