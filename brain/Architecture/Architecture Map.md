---
type: moc
generated: true
tags: [brain/architecture, moc]
---

# Architecture Map

131 modules across 6 layers. Every module note lists its real imports and importers, so Obsidian's graph view of this folder *is* the dependency graph.

## Dependency rule

The one architectural invariant worth protecting: **`domain/` never imports from `features/` or `components/`.** Domain modules hold typed TBC knowledge that should stay usable outside this UI; features compose it. If that edge ever appears in a module note, it is a regression, not a shortcut.

## Hubs

The modules everything else leans on — change these carefully.

- [[domain.bis.bisTypes]] — 28 importers
- [[domain.character.characterTypes]] — 27 importers
- [[domain.gear.itemTypes]] — 20 importers
- [[domain.gear.gearSlots]] — 14 importers
- [[components.layout.Panel]] — 12 importers
- [[domain.abilities.abilityTypes]] — 11 importers
- [[domain.stats.statTypes]] — 11 importers
- [[features.character.characterTypes]] — 11 importers
- [[domain.raids.raidTypes]] — 9 importers
- [[features.gear.gearTypes]] — 9 importers
- [[domain.character.roleTheme]] — 7 importers
- [[domain.simulation.encounterTypes]] — 7 importers

## By layer

### app (3)

Entry points and the root composition. Owns which tab is showing and holds the planner state every panel reads.

- [[App]] · 1 importers
- [[main]] · 0 importers
- [[styles.global]] · 1 importers

### components (7)

Presentational shell and primitives. No domain knowledge — these would work unchanged in a different app.

- [[components.layout.AppShell]] · 1 importers
- [[components.layout.ErrorBoundary]] · 1 importers
- [[components.layout.LoadingIntro]] · 1 importers
- [[components.layout.Panel]] · 12 importers
- [[components.layout.TabNav]] · 2 importers
- [[components.ui.Button]] · 5 importers
- [[components.ui.SelectField]] · 1 importers

### features (25)

Per-feature panels plus the calculation functions that drive them. This is where domain data becomes a number on screen.

- [[features.bis.BisPanel]] · 1 importers
- [[features.buffs.BuffsPanel]] · 1 importers
- [[features.builds.BuildPanel]] · 1 importers
- [[features.builds.buildStorage]] · 2 importers
- [[features.character.characterData]] · 4 importers
- [[features.character.CharacterPanel]] · 1 importers
- [[features.character.characterTypes]] · 11 importers
- [[features.gear.gearData]] · 7 importers
- [[features.gear.GearPanel]] · 1 importers
- [[features.gear.gearTypes]] · 9 importers
- [[features.professions.ProfessionsPanel]] · 1 importers
- [[features.raids.RaidAttunementChain]] · 1 importers
- [[features.raids.RaidLootList]] · 1 importers
- [[features.raids.RaidsPanel]] · 1 importers
- [[features.simulator.calculateSimulation]] · 3 importers
- [[features.simulator.calculateStatWeights]] · 2 importers
- [[features.simulator.EncounterPanel]] · 1 importers
- [[features.simulator.findUpgrades]] · 2 importers
- [[features.simulator.simulationTypes]] · 3 importers
- [[features.simulator.SimulatorPanel]] · 1 importers
- [[features.simulator.StatWeightsPanel]] · 1 importers
- [[features.simulator.UpgradesPanel]] · 1 importers
- [[features.stats.calculateStats]] · 3 importers
- [[features.stats.StatsPanel]] · 1 importers
- [[features.stats.statsTypes]] · 4 importers

### domain (93)

Typed TBC knowledge: rules, formulas, and data. Nothing here imports from `features` or `components`, which is what keeps the domain reusable.

- [[domain.abilities.abilityTypes]] · 11 importers
- [[domain.abilities.index]] · 2 importers
- [[domain.abilities.sampleSignatureAbilities]] · 1 importers
- [[domain.abilities.signatureAbilitiesDruid]] · 1 importers
- [[domain.abilities.signatureAbilitiesHunter]] · 1 importers
- [[domain.abilities.signatureAbilitiesMage]] · 1 importers
- [[domain.abilities.signatureAbilitiesPaladin]] · 1 importers
- [[domain.abilities.signatureAbilitiesPriest]] · 1 importers
- [[domain.abilities.signatureAbilitiesRogue]] · 1 importers
- [[domain.abilities.signatureAbilitiesShaman]] · 1 importers
- [[domain.abilities.signatureAbilitiesWarlock]] · 1 importers
- [[domain.abilities.signatureAbilitiesWarrior]] · 1 importers
- [[domain.bis.afflictionWarlockPhase2]] · 2 importers
- [[domain.bis.arcaneMagePhase2]] · 2 importers
- [[domain.bis.armsWarriorPhase2]] · 2 importers
- [[domain.bis.assassinationRoguePhase2]] · 2 importers
- [[domain.bis.balanceDruidPhase2]] · 2 importers
- [[domain.bis.beastMasteryHunterPhase2]] · 2 importers
- [[domain.bis.bisLists]] · 1 importers
- [[domain.bis.bisTypes]] · 28 importers
- [[domain.bis.combatRoguePhase2]] · 2 importers
- [[domain.bis.demonologyWarlockPhase2]] · 2 importers
- [[domain.bis.destructionWarlockPhase2]] · 2 importers
- [[domain.bis.disciplinePriestPhase2]] · 2 importers
- [[domain.bis.elementalShamanPhase2]] · 2 importers
- [[domain.bis.enhancementShamanPhase2]] · 2 importers
- [[domain.bis.feralDruidPhase2]] · 2 importers
- [[domain.bis.fireMagePhase2]] · 2 importers
- [[domain.bis.frostMagePhase2]] · 2 importers
- [[domain.bis.furyWarriorPhase2]] · 2 importers
- [[domain.bis.holyPaladinPhase2]] · 2 importers
- [[domain.bis.holyPriestPhase2]] · 2 importers
- [[domain.bis.index]] · 1 importers
- [[domain.bis.marksmanshipHunterPhase2]] · 2 importers
- [[domain.bis.protectionPaladinPhase2]] · 2 importers
- [[domain.bis.protectionWarriorPhase2]] · 2 importers
- [[domain.bis.restorationDruidPhase2]] · 2 importers
- [[domain.bis.restorationShamanPhase2]] · 2 importers
- [[domain.bis.retributionPaladinPhase2]] · 2 importers
- [[domain.bis.shadowPriestPhase2]] · 2 importers
- [[domain.bis.subtletyRoguePhase2]] · 2 importers
- [[domain.bis.survivalHunterPhase2]] · 2 importers
- [[domain.buffs.buffTypes]] · 3 importers
- [[domain.buffs.sampleBuffs]] · 2 importers
- [[domain.buffs.sampleTargetDebuffs]] · 2 importers
- [[domain.builds.buildSerialization]] · 3 importers
- [[domain.builds.buildTypes]] · 4 importers
- [[domain.character.applyRacialTraits]] · 2 importers
- [[domain.character.characterTypes]] · 27 importers
- [[domain.character.races]] · 2 importers
- [[domain.character.racialTypes]] · 2 importers
- [[domain.character.roleTheme]] · 7 importers
- [[domain.character.sampleRacialTraits]] · 2 importers
- [[domain.character.tbcClasses]] · 4 importers
- [[domain.consumables.consumableTypes]] · 2 importers
- [[domain.consumables.sampleConsumables]] · 2 importers
- [[domain.enchants.enchantTypes]] · 1 importers
- [[domain.enchants.sampleEnchants]] · 4 importers
- [[domain.gear.characterItemRules]] · 2 importers
- [[domain.gear.defaultGear]] · 1 importers
- [[domain.gear.gearSlots]] · 14 importers
- [[domain.gear.itemTypes]] · 20 importers
- [[domain.gear.qualityColors]] · 4 importers
- [[domain.gear.sampleItems]] · 4 importers
- [[domain.gear.slotCompatibility]] · 4 importers
- [[domain.gear.slotVisibility]] · 1 importers
- [[domain.gems.gemTypes]] · 1 importers
- [[domain.gems.sampleGems]] · 5 importers
- [[domain.professions.index]] · 1 importers
- [[domain.professions.professionTypes]] · 5 importers
- [[domain.professions.sampleCraftingGuides]] · 2 importers
- [[domain.professions.sampleGatheringMaterials]] · 2 importers
- [[domain.professions.sampleProfessions]] · 1 importers
- [[domain.professions.sampleProfessionTiers]] · 2 importers
- [[domain.raids.gruulsLairBosses]] · 1 importers
- [[domain.raids.index]] · 3 importers
- [[domain.raids.karazhanBosses]] · 1 importers
- [[domain.raids.magtheridonsLairBosses]] · 1 importers
- [[domain.raids.raidTypes]] · 9 importers
- [[domain.raids.sampleAttunements]] · 1 importers
- [[domain.raids.sampleRaidBosses]] · 1 importers
- [[domain.raids.sampleRaids]] · 1 importers
- [[domain.raids.serpentshrineCavernBosses]] · 1 importers
- [[domain.raids.tempestKeepBosses]] · 1 importers
- [[domain.simulation.attackTable]] · 1 importers
- [[domain.simulation.combatConstants]] · 5 importers
- [[domain.simulation.damageFormulas]] · 2 importers
- [[domain.simulation.encounterTypes]] · 7 importers
- [[domain.simulation.sampleEncounters]] · 3 importers
- [[domain.simulation.specialAttacks]] · 1 importers
- [[domain.simulation.spellTable]] · 1 importers
- [[domain.stats.statTypes]] · 11 importers
- [[domain.stats.statUtils]] · 2 importers

### data (2)

Older guide-oriented data that predates the domain model and is not yet migrated into it.

- [[data.phase2Enhancements]] · 0 importers
- [[data.phase2SpecGuides]] · 0 importers

### lib (1)

Cross-cutting helpers with no domain meaning.

- [[lib.animations]] · 6 importers

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
