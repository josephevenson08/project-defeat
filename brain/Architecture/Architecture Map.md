---
type: moc
generated: true
tags: [brain/architecture, moc]
---

# Architecture Map

134 modules across 5 layers. Every module note lists its real imports and importers, so Obsidian's graph view of this folder *is* the dependency graph.

## Dependency rule

The one architectural invariant worth protecting: **`domain/` never imports from `features/` or `components/`.** Domain modules hold typed TBC knowledge that should stay usable outside this UI; features compose it. If that edge ever appears in a module note, it is a regression, not a shortcut.

## Hubs

The modules everything else leans on — change these carefully.

- [[domain.character.characterTypes]] — 30 importers
- [[domain.gear.itemTypes]] — 25 importers
- [[domain.gear.gearSlots]] — 17 importers
- [[features.character.characterTypes]] — 15 importers
- [[domain.stats.statTypes]] — 14 importers
- [[components.layout.Panel]] — 12 importers
- [[domain.abilities.abilityTypes]] — 11 importers
- [[domain.character.roleTheme]] — 10 importers
- [[features.gear.gearTypes]] — 10 importers
- [[domain.raids.raidTypes]] — 9 importers
- [[features.gear.gearData]] — 8 importers
- [[domain.simulation.combatConstants]] — 7 importers

## By layer

### app (4)

Entry points and the root composition. Owns which tab is showing and holds the planner state every panel reads.

- [[App]] · 1 importers
- [[featureFlags]] · 1 importers
- [[main]] · 0 importers
- [[styles.global]] · 1 importers

### components (8)

Presentational shell and primitives. No domain knowledge — these would work unchanged in a different app.

- [[components.layout.AppShell]] · 1 importers
- [[components.layout.ErrorBoundary]] · 1 importers
- [[components.layout.LoadingIntro]] · 1 importers
- [[components.layout.Panel]] · 12 importers
- [[components.layout.SectionPicker]] · 1 importers
- [[components.layout.TabNav]] · 2 importers
- [[components.ui.Button]] · 5 importers
- [[components.ui.SelectField]] · 1 importers

### features (35)

Per-feature panels plus the calculation functions that drive them. This is where domain data becomes a number on screen.

- [[features.bis.BisPanel]] · 1 importers
- [[features.buffs.BuffsPanel]] · 0 importers
- [[features.builds.BuildPanel]] · 1 importers
- [[features.builds.buildStorage]] · 2 importers
- [[features.character.CharacterCreator]] · 1 importers
- [[features.character.characterData]] · 6 importers
- [[features.character.CharacterRail]] · 1 importers
- [[features.character.characterTypes]] · 15 importers
- [[features.gear.gearData]] · 8 importers
- [[features.gear.GearPanel]] · 1 importers
- [[features.gear.gearTypes]] · 10 importers
- [[features.gear.ItemIcon]] · 3 importers
- [[features.gear.ItemPopup]] · 1 importers
- [[features.gear.SetBonuses]] · 1 importers
- [[features.gear.slotGlyphs]] · 3 importers
- [[features.professions.ProfessionsPanel]] · 1 importers
- [[features.raids.RaidAttunementChain]] · 1 importers
- [[features.raids.RaidLootList]] · 1 importers
- [[features.raids.RaidPicker]] · 1 importers
- [[features.raids.RaidRail]] · 1 importers
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
- [[features.stats.StatsPanel]] · 0 importers
- [[features.stats.StatsRail]] · 1 importers
- [[features.stats.statsTypes]] · 5 importers
- [[features.talents.TalentsPanel]] · 1 importers
- [[features.tierlists.TierListsPanel]] · 1 importers

### domain (86)

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
- [[domain.bis.bisLists]] · 1 importers
- [[domain.bis.bisRankingsJson.d]] · 0 importers
- [[domain.bis.bisRecommendationsJson.d]] · 0 importers
- [[domain.bis.bisTypes]] · 2 importers
- [[domain.bis.index]] · 2 importers
- [[domain.buffs.buffTypes]] · 3 importers
- [[domain.buffs.sampleBuffs]] · 2 importers
- [[domain.buffs.sampleTargetDebuffs]] · 2 importers
- [[domain.builds.buildSerialization]] · 3 importers
- [[domain.builds.buildTypes]] · 4 importers
- [[domain.character.applyRacialTraits]] · 1 importers
- [[domain.character.characterTypes]] · 30 importers
- [[domain.character.races]] · 2 importers
- [[domain.character.racialTypes]] · 2 importers
- [[domain.character.roleTheme]] · 10 importers
- [[domain.character.sampleRacialTraits]] · 1 importers
- [[domain.character.tbcClasses]] · 4 importers
- [[domain.consumables.consumableCatalogueJson.d]] · 0 importers
- [[domain.consumables.consumableTypes]] · 2 importers
- [[domain.consumables.sampleConsumables]] · 2 importers
- [[domain.enchants.enchantCatalogueJson.d]] · 0 importers
- [[domain.enchants.enchantSupplementJson.d]] · 0 importers
- [[domain.enchants.enchantTypes]] · 1 importers
- [[domain.enchants.sampleEnchants]] · 5 importers
- [[domain.gear.armorValues]] · 1 importers
- [[domain.gear.catalogueJson.d]] · 0 importers
- [[domain.gear.catalogueTypes]] · 1 importers
- [[domain.gear.characterItemRules]] · 2 importers
- [[domain.gear.defaultGear]] · 1 importers
- [[domain.gear.gearSlots]] · 17 importers
- [[domain.gear.itemCatalogue]] · 5 importers
- [[domain.gear.itemSets]] · 2 importers
- [[domain.gear.itemTypes]] · 25 importers
- [[domain.gear.qualityColors]] · 5 importers
- [[domain.gear.sampleItems]] · 1 importers
- [[domain.gear.slotCompatibility]] · 6 importers
- [[domain.gear.slotVisibility]] · 2 importers
- [[domain.gems.gemCatalogueJson.d]] · 0 importers
- [[domain.gems.gemTypes]] · 1 importers
- [[domain.gems.sampleGems]] · 5 importers
- [[domain.icons.icons]] · 1 importers
- [[domain.icons.iconsJson.d]] · 0 importers
- [[domain.professions.index]] · 1 importers
- [[domain.professions.professionTypes]] · 5 importers
- [[domain.professions.sampleCraftingGuides]] · 2 importers
- [[domain.professions.sampleGatheringMaterials]] · 2 importers
- [[domain.professions.sampleProfessions]] · 1 importers
- [[domain.professions.sampleProfessionTiers]] · 2 importers
- [[domain.raids.gruulsLairBosses]] · 1 importers
- [[domain.raids.index]] · 5 importers
- [[domain.raids.karazhanBosses]] · 1 importers
- [[domain.raids.magtheridonsLairBosses]] · 1 importers
- [[domain.raids.raidTypes]] · 9 importers
- [[domain.raids.sampleAttunements]] · 1 importers
- [[domain.raids.sampleRaidBosses]] · 1 importers
- [[domain.raids.sampleRaids]] · 1 importers
- [[domain.raids.serpentshrineCavernBosses]] · 1 importers
- [[domain.raids.tempestKeepBosses]] · 1 importers
- [[domain.simulation.attackTable]] · 1 importers
- [[domain.simulation.combatConstants]] · 7 importers
- [[domain.simulation.damageFormulas]] · 2 importers
- [[domain.simulation.encounterTypes]] · 7 importers
- [[domain.simulation.sampleEncounters]] · 3 importers
- [[domain.simulation.specialAttacks]] · 1 importers
- [[domain.simulation.spellTable]] · 1 importers
- [[domain.stats.describeStats]] · 3 importers
- [[domain.stats.statTypes]] · 14 importers
- [[domain.stats.statUtils]] · 2 importers
- [[domain.talents.sampleTalents]] · 1 importers
- [[domain.talents.talentTypes]] · 3 importers
- [[domain.tierlists.index]] · 1 importers
- [[domain.tierlists.tierLists]] · 1 importers
- [[domain.tierlists.tierListsJson.d]] · 0 importers
- [[domain.tierlists.tierListTypes]] · 2 importers

### lib (1)

Cross-cutting helpers with no domain meaning.

- [[lib.animations]] · 7 importers

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
