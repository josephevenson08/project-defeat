---
type: module
layer: domain
source: src/domain/simulation/classCooldowns.ts
lines: 222
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.simulation.classCooldowns

`src/domain/simulation/classCooldowns.ts` · **domain** layer · 222 lines

From the top of the file:

> The timed damage cooldowns the DPS specs press, priced the way on-use trinkets already are: pressed
> on cooldown, worth `duration ÷ cooldown` of their effect (`effectUptime`). The owner's call, 2026-11-02.
> 
> **Why this rule and not a timeline.** The model has no fight clock, so a cooldown is either averaged
> or left out, and leaving it out understates by the whole of it. Averaging is the same trade Bloodlust
> and every on-use trinket already make. It is a **steady state**: a real fight of three to five minutes
> presses each cooldown at the pull (wowsims does, `tryActivateHelper`), so a long cooldown is worth a
> little more in a short fight than this gives it. Recklessness's 30 minutes is the extreme: once a
> fight in practice, 0.8% here.
> 
> Each figure is the tooltip's (nether.wowhead.com, the host the talent ingest reads), cross-checked
> against wowsims/tbc @3301fca, sourced by the tbc-researcher on 2026-11-02. They agree on every value.
> 
> **Timed buffs only.** The one-charge cooldowns (Combustion, Cold Blood, Elemental Mastery, Presence of
> Mind, Inner Focus, Amplify Curse, Shadowstep) are worth one better cast per use, not an uptime, and
> stay refused until they are priced that way. Pets whose damage is unread (Water Elemental, Fire
> Elemental Totem, Force of Nature, Shadowfiend), Tiger's Fury (bound by energy, not its 1-second
> cooldown) and Shamanistic Rage (no damage) are out.

## Exports

**function** — `averagedCooldownEffect`, `cooldownsFor`, `cooldownUptime`

**const** — `classCooldowns`

**type** — `ClassCooldown`, `CooldownEffect`

## Imports

- [[domain.character.characterTypes]] — `src/domain/character/characterTypes.ts`
- [[domain.simulation.combatConstants]] — `src/domain/simulation/combatConstants.ts`

## Imported by

- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`

## Concepts & phases

_None._

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
