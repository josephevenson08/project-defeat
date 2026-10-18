---
type: module
layer: app
source: src/App.tsx
lines: 641
generated: true
tags: [brain/architecture, layer/app]
---

# App

`src/App.tsx` · **app** layer · 641 lines

From the top of the file:

> The screen's colour is stamped on `<html>` as `data-tab`, not on a wrapper inside the app.
> 
> **It has to be the root element or the page's own ground is the wrong colour.** `:root` paints the
> page and the still backdrop behind it, so stamping the document element means the ground, the
> backdrop, the scrollbar and every panel change together.
> 
> **The tab is the theme, not the faction** (the owner's call, 2026-10-12, with the Step 2 look):
> each section has its colour, and the front door and the loading screen take Home's teal. Until
> then the whole app was themed by the character's faction, which made a Horde player's tier list
> look different from an Alliance player's for no reason that had to do with tier lists.

## Exports

_Nothing exported (side-effect or style module)._

## Imports

- [[components.layout.AppShell]] — `src/components/layout/AppShell.tsx`
- [[components.layout.LoadingIntro]] — `src/components/layout/LoadingIntro.tsx`
- [[components.layout.SectionPicker]] — `src/components/layout/SectionPicker.tsx`
- [[components.layout.TabNav]] — `src/components/layout/TabNav.tsx`
- [[components.ui.Provenance]] — `src/components/ui/Provenance.tsx`
- [[domain.bis.index]] — `src/domain/bis/index.ts`
- [[domain.builds.addonImport]] — `src/domain/builds/addonImport.ts`
- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`
- [[domain.builds.shareLink]] — `src/domain/builds/shareLink.ts`
- [[domain.enchants.sampleEnchants]] — `src/domain/enchants/sampleEnchants.ts`
- [[domain.raids.index]] — `src/domain/raids/index.ts`
- [[domain.simulation.sampleEncounters]] — `src/domain/simulation/sampleEncounters.ts`
- [[domain.talents.talentModifiers]] — `src/domain/talents/talentModifiers.ts`
- [[domain.talents.talentTypes]] — `src/domain/talents/talentTypes.ts`
- [[domain.tierlists.specStanding]] — `src/domain/tierlists/specStanding.ts`
- [[featureFlags]] — `src/featureFlags.ts`
- [[features.bis.RankedGearPanel]] — `src/features/bis/RankedGearPanel.tsx`
- [[features.bis.rankedSession]] — `src/features/bis/rankedSession.ts`
- [[features.buffs.BuffsPanel]] — `src/features/buffs/BuffsPanel.tsx`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`
- [[features.builds.ShareNotice]] — `src/features/builds/ShareNotice.tsx`
- [[features.character.CharacterCreator]] — `src/features/character/CharacterCreator.tsx`
- [[features.character.characterData]] — `src/features/character/characterData.ts`
- [[features.character.CharacterStrip]] — `src/features/character/CharacterStrip.tsx`
- [[features.character.characterTypes]] — `src/features/character/characterTypes.ts`
- [[features.gear.ComparePanel]] — `src/features/gear/ComparePanel.tsx`
- [[features.gear.equipRecommendedSet]] — `src/features/gear/equipRecommendedSet.ts`
- [[features.gear.gearData]] — `src/features/gear/gearData.ts`
- [[features.gear.GearPanel]] — `src/features/gear/GearPanel.tsx`
- [[features.gear.gearTypes]] — `src/features/gear/gearTypes.ts`
- [[features.professions.professionSources]] — `src/features/professions/professionSources.ts`
- [[features.professions.ProfessionsPanel]] — `src/features/professions/ProfessionsPanel.tsx`
- [[features.professions.professionsSession]] — `src/features/professions/professionsSession.ts`
- [[features.raidcomp.RaidCompositionPanel]] — `src/features/raidcomp/RaidCompositionPanel.tsx`
- [[features.raidcomp.raidcompSources]] — `src/features/raidcomp/raidcompSources.ts`
- [[features.raids.raidSources]] — `src/features/raids/raidSources.ts`
- [[features.raids.RaidsPanel]] — `src/features/raids/RaidsPanel.tsx`
- [[features.raids.raidsSession]] — `src/features/raids/raidsSession.ts`
- [[features.simulator.calculateSimulation]] — `src/features/simulator/calculateSimulation.ts`
- [[features.simulator.calculateStatWeights]] — `src/features/simulator/calculateStatWeights.ts`
- [[features.simulator.findUpgrades]] — `src/features/simulator/findUpgrades.ts`
- [[features.simulator.simFormat]] — `src/features/simulator/simFormat.ts`
- [[features.simulator.SimulationPanel]] — `src/features/simulator/SimulationPanel.tsx`
- [[features.stats.calculateStats]] — `src/features/stats/calculateStats.ts`
- [[features.stats.StatBar]] — `src/features/stats/StatBar.tsx`
- [[features.talents.TalentsPanel]] — `src/features/talents/TalentsPanel.tsx`
- [[features.tierlists.tierFormat]] — `src/features/tierlists/tierFormat.ts`
- [[features.tierlists.TierListsPanel]] — `src/features/tierlists/TierListsPanel.tsx`

## Imported by

- [[main]] — `src/main.tsx`

## Concepts & phases

- [[Port to the Live App]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
