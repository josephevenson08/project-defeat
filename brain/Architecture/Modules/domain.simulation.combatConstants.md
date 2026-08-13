---
type: module
layer: domain
source: src/domain/simulation/combatConstants.ts
lines: 128
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.combatConstants

`src/domain/simulation/combatConstants.ts` · **domain** layer · 128 lines

From the top of the file:

> TBC Classic (Burning Crusade, level cap 70) combat-rating and attack-table constants.
> Sourced from the official Blizzard "Combat Ratings: Level 70 Conversions" blue post plus
> cross-referenced community math (see notes on individual exports for anything less certain).
> Do NOT reuse Wrath/Cata-era numbers here — several of these constants changed across expansions
> (e.g. avoidance diminishing returns did not exist until patch 3.0.2, well after TBC).

## Exports

**function** — `armorMitigationConstant`, `effectUptime`, `ratingToFraction`

**const** — `AP_PER_DPS`, `ARMOR_MITIGATION_CAP`, `AVOIDANCE_PER_DEFENSE_SKILL_POINT`, `CRUSHING_BLOW_CHANCE`, `CRUSHING_BLOW_DAMAGE_MULTIPLIER`, `CRUSHING_BLOW_LEVEL_GAP`, `DEFENSE_RATING_PER_SKILL_POINT`, `DOT_COEFFICIENT_BASE_DURATION`, `EXPERTISE_PERCENT_PER_SKILL_POINT`, `EXPERTISE_RATING_PER_SKILL_POINT`, `HEALTH_PER_STAMINA`, `MELEE_CRIT_DAMAGE_MULTIPLIER`, `PLAYER_LEVEL_70_SKILL`, `RATING_PER_PERCENT`, `SPELL_COEFFICIENT_BASE_CAST_TIME`, `SPELL_COEFFICIENT_INSTANT_BASELINE`, `SPELL_CRIT_DAMAGE_MULTIPLIER`

## Imports

_None._

## Imported by

- [[domain.buffs.sampleBuffs]] — `src/domain/buffs/sampleBuffs.ts`
- [[domain.character.sampleRacialTraits]] — `src/domain/character/sampleRacialTraits.ts`
- [[domain.simulation.attackTable]] — `src/domain/simulation/attackTable.ts`
- [[domain.simulation.damageFormulas]] — `src/domain/simulation/damageFormulas.ts`
- [[domain.simulation.rageModel]] — `src/domain/simulation/rageModel.ts`
- [[domain.simulation.specialAttacks]] — `src/domain/simulation/specialAttacks.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`

## Concepts & phases

- [[Attack Table]]
- [[Spell Table]]
- [[Armor Mitigation]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
