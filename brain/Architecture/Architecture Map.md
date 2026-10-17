---
type: moc
generated: true
tags: [brain/architecture, moc]
---

# Architecture Map

215 modules across 5 layers. Every module note lists its real imports and importers, so Obsidian's graph view of this folder *is* the dependency graph.

## Dependency rule

The one architectural invariant worth protecting: **`domain/` never imports from `features/` or `components/`.** Domain modules hold typed TBC knowledge that should stay usable outside this UI; features compose it. If that edge ever appears in a module note, it is a regression, not a shortcut.

## Hubs

The modules everything else leans on — change these carefully.

- [[domain.character.characterTypes]] — 51 importers
- [[domain.gear.itemTypes]] — 30 importers
- [[features.character.characterTypes]] — 19 importers
- [[domain.gear.gearSlots]] — 18 importers
- [[domain.stats.statTypes]] — 17 importers
- [[domain.professions.professionTypes]] — 16 importers
- [[domain.abilities.abilityTypes]] — 13 importers
- [[domain.raids.raidTypes]] — 13 importers
- [[features.gear.gearTypes]] — 13 importers
- [[components.layout.Panel]] — 12 importers
- [[domain.gear.slotCompatibility]] — 12 importers
- [[domain.raids.index]] — 11 importers

## By layer

### app (5)

Entry points and the root composition. Owns which tab is showing and holds the planner state every panel reads.

- [[App]] · 1 importers
- [[featureFlags]] · 2 importers
- [[main]] · 0 importers
- [[styles.fonts]] · 1 importers
- [[styles.global]] · 1 importers

### components (16)

Presentational shell and primitives. No domain knowledge — these would work unchanged in a different app.

- [[components.layout.AppShell]] · 1 importers
- [[components.layout.ErrorBoundary]] · 1 importers
- [[components.layout.LoadingIntro]] · 1 importers
- [[components.layout.Panel]] · 12 importers
- [[components.layout.SectionPicker]] · 1 importers
- [[components.layout.TabNav]] · 2 importers
- [[components.ui.Button]] · 5 importers
- [[components.ui.FloatingTip]] · 2 importers
- [[components.ui.itemTipModel]] · 2 importers
- [[components.ui.ItemTooltip]] · 1 importers
- [[components.ui.PhaseChip]] · 1 importers
- [[components.ui.Provenance]] · 4 importers
- [[components.ui.SelectField]] · 1 importers
- [[components.ui.SpecIcon]] · 5 importers
- [[components.ui.useHoverTip]] · 5 importers
- [[components.ui.ViewSwitch]] · 4 importers

### features (57)

Per-feature panels plus the calculation functions that drive them. This is where domain data becomes a number on screen.

- [[features.bis.BisPanel]] · 1 importers
- [[features.buffs.BuffsPanel]] · 1 importers
- [[features.builds.BuildPanel]] · 1 importers
- [[features.builds.buildStorage]] · 1 importers
- [[features.builds.ShareNotice]] · 1 importers
- [[features.character.CharacterCreator]] · 1 importers
- [[features.character.characterData]] · 5 importers
- [[features.character.CharacterStrip]] · 1 importers
- [[features.character.characterTypes]] · 19 importers
- [[features.gear.compareItems]] · 1 importers
- [[features.gear.ComparePanel]] · 1 importers
- [[features.gear.equipRecommendedSet]] · 2 importers
- [[features.gear.gearData]] · 9 importers
- [[features.gear.GearPanel]] · 1 importers
- [[features.gear.gearTypes]] · 13 importers
- [[features.gear.ItemIcon]] · 3 importers
- [[features.gear.SetBonuses]] · 1 importers
- [[features.gear.slotGlyphs]] · 3 importers
- [[features.gear.SlotPane]] · 1 importers
- [[features.professions.FarmingRouteMap]] · 1 importers
- [[features.professions.MaterialChip]] · 0 importers
- [[features.professions.professionSources]] · 1 importers
- [[features.professions.ProfessionsPanel]] · 1 importers
- [[features.professions.professionsSession]] · 4 importers
- [[features.professions.ProfessionWindow]] · 2 importers
- [[features.professions.WhichTwo]] · 1 importers
- [[features.professions.ZoneRoutes]] · 1 importers
- [[features.raidcomp.exportRosterImage]] · 1 importers
- [[features.raidcomp.RaidCompositionPanel]] · 1 importers
- [[features.raidcomp.rosterStorage]] · 3 importers
- [[features.raids.BossJournal]] · 1 importers
- [[features.raids.ForMyRaid]] · 1 importers
- [[features.raids.LootIcon]] · 3 importers
- [[features.raids.LootSearchResults]] · 1 importers
- [[features.raids.RaidAbout]] · 1 importers
- [[features.raids.raidLootTip]] · 4 importers
- [[features.raids.raidSources]] · 1 importers
- [[features.raids.RaidsPanel]] · 1 importers
- [[features.raids.raidsSession]] · 3 importers
- [[features.simulator.calculateSimulation]] · 4 importers
- [[features.simulator.calculateStatWeights]] · 2 importers
- [[features.simulator.findUpgrades]] · 3 importers
- [[features.simulator.simulationTypes]] · 3 importers
- [[features.simulator.SimulatorPanel]] · 1 importers
- [[features.simulator.StatWeightsPanel]] · 1 importers
- [[features.simulator.UpgradesPanel]] · 1 importers
- [[features.stats.calculateStats]] · 4 importers
- [[features.stats.StatBar]] · 1 importers
- [[features.stats.StatsPanel]] · 0 importers
- [[features.stats.statsTypes]] · 5 importers
- [[features.talents.TalentsPanel]] · 1 importers
- [[features.tierlists.AgainstTheLogs]] · 1 importers
- [[features.tierlists.SpecCard]] · 3 importers
- [[features.tierlists.SpecTip]] · 2 importers
- [[features.tierlists.TierBoard]] · 1 importers
- [[features.tierlists.tierFormat]] · 6 importers
- [[features.tierlists.TierListsPanel]] · 1 importers

### domain (135)

Typed TBC knowledge: rules, formulas, and data. Nothing here imports from `features` or `components`, which is what keeps the domain reusable.

- [[domain.abilities.abilityTypes]] · 13 importers
- [[domain.abilities.index]] · 4 importers
- [[domain.abilities.sampleSignatureAbilities]] · 2 importers
- [[domain.abilities.signatureAbilitiesDruid]] · 1 importers
- [[domain.abilities.signatureAbilitiesHunter]] · 1 importers
- [[domain.abilities.signatureAbilitiesMage]] · 1 importers
- [[domain.abilities.signatureAbilitiesPaladin]] · 1 importers
- [[domain.abilities.signatureAbilitiesPriest]] · 1 importers
- [[domain.abilities.signatureAbilitiesRogue]] · 1 importers
- [[domain.abilities.signatureAbilitiesShaman]] · 1 importers
- [[domain.abilities.signatureAbilitiesWarlock]] · 1 importers
- [[domain.abilities.signatureAbilitiesWarrior]] · 1 importers
- [[domain.bis.acquisition]] · 1 importers
- [[domain.bis.bisLists]] · 2 importers
- [[domain.bis.bisRankingsJson.d]] · 0 importers
- [[domain.bis.bisRecommendationsJson.d]] · 0 importers
- [[domain.bis.bisTypes]] · 5 importers
- [[domain.bis.index]] · 5 importers
- [[domain.bis.rankedSource]] · 2 importers
- [[domain.buffs.buffExclusivity]] · 1 importers
- [[domain.buffs.buffScope]] · 2 importers
- [[domain.buffs.buffScopeJson.d]] · 0 importers
- [[domain.buffs.buffTypes]] · 5 importers
- [[domain.buffs.sampleBuffs]] · 6 importers
- [[domain.buffs.sampleTargetDebuffs]] · 3 importers
- [[domain.builds.addonImport]] · 2 importers
- [[domain.builds.buildSerialization]] · 4 importers
- [[domain.builds.buildTypes]] · 7 importers
- [[domain.builds.shareLink]] · 2 importers
- [[domain.character.applyRacialTraits]] · 1 importers
- [[domain.character.attributeConversions]] · 1 importers
- [[domain.character.baseStats]] · 1 importers
- [[domain.character.characterTypes]] · 51 importers
- [[domain.character.classColors]] · 8 importers
- [[domain.character.factionColors]] · 1 importers
- [[domain.character.races]] · 4 importers
- [[domain.character.racialTypes]] · 2 importers
- [[domain.character.roleTheme]] · 9 importers
- [[domain.character.sampleRacialTraits]] · 1 importers
- [[domain.character.tbcClasses]] · 10 importers
- [[domain.consumables.consumableCatalogueJson.d]] · 0 importers
- [[domain.consumables.consumableTypes]] · 2 importers
- [[domain.consumables.sampleConsumables]] · 2 importers
- [[domain.enchants.enchantCatalogueJson.d]] · 0 importers
- [[domain.enchants.enchantSupplementJson.d]] · 0 importers
- [[domain.enchants.enchantTypes]] · 1 importers
- [[domain.enchants.sampleEnchants]] · 8 importers
- [[domain.gear.acquisitionCost]] · 1 importers
- [[domain.gear.acquisitionCostsJson.d]] · 0 importers
- [[domain.gear.armorValues]] · 1 importers
- [[domain.gear.catalogueJson.d]] · 0 importers
- [[domain.gear.catalogueTypes]] · 1 importers
- [[domain.gear.characterItemRules]] · 2 importers
- [[domain.gear.defaultGear]] · 1 importers
- [[domain.gear.gearSlots]] · 18 importers
- [[domain.gear.itemCatalogue]] · 9 importers
- [[domain.gear.itemEffectsJson.d]] · 0 importers
- [[domain.gear.itemSets]] · 2 importers
- [[domain.gear.itemTypes]] · 30 importers
- [[domain.gear.obtainability]] · 2 importers
- [[domain.gear.qualityColors]] · 9 importers
- [[domain.gear.sampleItems]] · 1 importers
- [[domain.gear.slotCompatibility]] · 12 importers
- [[domain.gear.slotVisibility]] · 2 importers
- [[domain.gems.gemCatalogueJson.d]] · 0 importers
- [[domain.gems.gemTypes]] · 3 importers
- [[domain.gems.sampleGems]] · 7 importers
- [[domain.icons.icons]] · 4 importers
- [[domain.icons.iconsJson.d]] · 0 importers
- [[domain.phase]] · 2 importers
- [[domain.professions.characterProfessions]] · 2 importers
- [[domain.professions.craftingPaths]] · 2 importers
- [[domain.professions.farmingRoutes]] · 3 importers
- [[domain.professions.gatheringGuides]] · 2 importers
- [[domain.professions.gatheringPlan]] · 2 importers
- [[domain.professions.gatheringRangeTypes]] · 3 importers
- [[domain.professions.index]] · 6 importers
- [[domain.professions.professionPayoffs]] · 1 importers
- [[domain.professions.professionTypes]] · 16 importers
- [[domain.professions.professionWindow]] · 1 importers
- [[domain.professions.routeLoop]] · 2 importers
- [[domain.professions.sampleCraftingGuides]] · 2 importers
- [[domain.professions.sampleProfessions]] · 4 importers
- [[domain.professions.sampleProfessionTiers]] · 5 importers
- [[domain.raidcomp.buffCoverage]] · 1 importers
- [[domain.raidcomp.index]] · 10 importers
- [[domain.raidcomp.raidBuilds]] · 2 importers
- [[domain.raidcomp.raidcompIcons]] · 2 importers
- [[domain.raidcomp.raidcompIconsJson.d]] · 0 importers
- [[domain.raidcomp.rosterTypes]] · 2 importers
- [[domain.raids.bossArt]] · 2 importers
- [[domain.raids.bossArtJson.d]] · 0 importers
- [[domain.raids.exampleRaids]] · 1 importers
- [[domain.raids.gruulsLairBosses]] · 1 importers
- [[domain.raids.index]] · 11 importers
- [[domain.raids.karazhanBosses]] · 1 importers
- [[domain.raids.magtheridonsLairBosses]] · 1 importers
- [[domain.raids.raidLoot]] · 1 importers
- [[domain.raids.raidSources]] · 1 importers
- [[domain.raids.raidTypes]] · 13 importers
- [[domain.raids.sampleAttunements]] · 1 importers
- [[domain.raids.sampleRaidBosses]] · 3 importers
- [[domain.raids.sampleRaids]] · 3 importers
- [[domain.raids.serpentshrineCavernBosses]] · 1 importers
- [[domain.raids.tempestKeepBosses]] · 1 importers
- [[domain.simulation.attackTable]] · 1 importers
- [[domain.simulation.combatConstants]] · 9 importers
- [[domain.simulation.damageFormulas]] · 1 importers
- [[domain.simulation.dpsReference]] · 4 importers
- [[domain.simulation.encounterTypes]] · 7 importers
- [[domain.simulation.feralBleeds]] · 1 importers
- [[domain.simulation.hunterPet]] · 1 importers
- [[domain.simulation.manaModel]] · 1 importers
- [[domain.simulation.paladinSeals]] · 1 importers
- [[domain.simulation.rageModel]] · 1 importers
- [[domain.simulation.roguePoisons]] · 1 importers
- [[domain.simulation.sampleEncounters]] · 4 importers
- [[domain.simulation.sliceAndDice]] · 1 importers
- [[domain.simulation.specialAttacks]] · 1 importers
- [[domain.simulation.spellTable]] · 1 importers
- [[domain.simulation.warlockPet]] · 1 importers
- [[domain.simulation.weaponImbues]] · 1 importers
- [[domain.stats.describeStats]] · 5 importers
- [[domain.stats.statRelevance]] · 1 importers
- [[domain.stats.statTypes]] · 17 importers
- [[domain.stats.statUtils]] · 3 importers
- [[domain.talents.sampleTalents]] · 3 importers
- [[domain.talents.talentEffectsJson.d]] · 0 importers
- [[domain.talents.talentModifiers]] · 7 importers
- [[domain.talents.talentTypes]] · 9 importers
- [[domain.tierlists.index]] · 6 importers
- [[domain.tierlists.specStanding]] · 7 importers
- [[domain.tierlists.tierLists]] · 2 importers
- [[domain.tierlists.tierListsJson.d]] · 0 importers
- [[domain.tierlists.tierListTypes]] · 3 importers

### lib (2)

Cross-cutting helpers with no domain meaning.

- [[lib.animations]] · 7 importers
- [[lib.useScreenFocus]] · 2 importers

Up: [[Project Defeat Brain]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
