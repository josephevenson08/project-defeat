import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoadingIntro } from './components/layout/LoadingIntro'
import { SectionPicker } from './components/layout/SectionPicker'
import { BisPanel } from './features/bis/BisPanel'
import { BuildPanel } from './features/builds/BuildPanel'
import { loadBuildFromStorage, saveBuildToStorage } from './features/builds/buildStorage'
import { applySavedGear, type BuildState } from './domain/builds/buildSerialization'
import type { SavedBuild } from './domain/builds/buildTypes'
import { CharacterCreator } from './features/character/CharacterCreator'
import { CharacterRail } from './features/character/CharacterRail'
import { TalentsPanel } from './features/talents/TalentsPanel'
import type { TalentPoints } from './domain/talents/talentTypes'
import { getRoleForSpec } from './features/character/characterData'
import type { CharacterProfile } from './features/character/characterTypes'
import { defaultGear, normalizeGearForCharacter } from './features/gear/gearData'
import { GearPanel } from './features/gear/GearPanel'
import type { EquippedGear, EquippedSlot, GearSlot } from './features/gear/gearTypes'
import { calculateSimulation } from './features/simulator/calculateSimulation'
import { isSimulationEnabled } from './featureFlags'
import { calculateStatWeights } from './features/simulator/calculateStatWeights'
import { EncounterPanel } from './features/simulator/EncounterPanel'
import { findUpgrades } from './features/simulator/findUpgrades'
import { SimulatorPanel } from './features/simulator/SimulatorPanel'
import { StatWeightsPanel } from './features/simulator/StatWeightsPanel'
import { UpgradesPanel } from './features/simulator/UpgradesPanel'
import type { SimulationResult } from './features/simulator/simulationTypes'
import { defaultSimulationTarget } from './domain/simulation/sampleEncounters'
import type { SimulationTarget } from './domain/simulation/encounterTypes'
import { calculateStats } from './features/stats/calculateStats'
import { StatsRail } from './features/stats/StatsRail'
import { ProfessionsPanel } from './features/professions/ProfessionsPanel'
import { TierListsPanel } from './features/tierlists/TierListsPanel'
import { RaidsPanel } from './features/raids/RaidsPanel'
import { RaidPicker } from './features/raids/RaidPicker'
import { RaidRail } from './features/raids/RaidRail'
import type { TabDefinition } from './components/layout/TabNav'

const initialCharacter: CharacterProfile = {
  faction: 'Alliance',
  race: 'Human',
  className: 'Warrior',
  spec: 'Fury',
}

type AppTab = 'planner' | 'simulation' | 'tierlists' | 'raids' | 'professions'

/**
 * Simulation is its own tab rather than more panels under the planner.
 *
 * It is a different activity from gearing — you gear for a while, then ask what the gear is worth —
 * and the planner tab already carries five panels. Splitting them is what the persistent rail makes
 * affordable: the stat totals stay on screen while you simulate, so moving between the two does not
 * cost you the numbers you were reading.
 *
 * Everything the simulator computes lives here together: the encounter it runs against, the result,
 * the stat weights derived from re-running it, and the upgrade finder built on those.
 */
const APP_TABS: readonly TabDefinition<AppTab>[] = [
  { id: 'planner', label: 'Character Planner' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'tierlists', label: 'Spec Tier Lists' },
  { id: 'raids', label: 'Raids' },
  { id: 'professions', label: 'Professions' },
]

/**
 * Simulation is currently hidden — see `isSimulationEnabled` for why. Filtered here rather than
 * removed from `APP_TABS` so the tab's definition, and this comment, stay next to the others.
 */
function visibleTabs(simulationEnabled: boolean) {
  return APP_TABS.filter((tab) => tab.id !== 'simulation' || simulationEnabled)
}

/** Rebuilds a full gear set from a saved build, normalized against the character it was saved for. */
function gearFromBuild(build: SavedBuild): EquippedGear {
  const baseline = normalizeGearForCharacter(defaultGear, build.character.className, build.character.spec)
  return normalizeGearForCharacter(applySavedGear(baseline, build.gear), build.character.className, build.character.spec)
}

function App() {
  // Read storage exactly once, and seed every piece of state from it via lazy initializers. Restoring
  // in an effect instead would let the first autosave fire against the default state and overwrite
  // the very build being restored.
  const [restoredBuild] = useState(loadBuildFromStorage)

  const [introComplete, setIntroComplete] = useState(false)
  const [sectionChosen, setSectionChosen] = useState(false)
  /*
   * Whether the character has been chosen deliberately this session. A restored build counts — being
   * walked through creation again every time you reload, having already made the choices, would be a
   * ceremony rather than a journey.
   */
  const [characterChosen, setCharacterChosen] = useState(() => Boolean(loadBuildFromStorage()))
  // Read once at mount: the flag comes from the URL and nothing in-session changes it.
  const [simulationEnabled] = useState(isSimulationEnabled)
  const [activeTab, setActiveTab] = useState<AppTab>('planner')
  const [character, setCharacter] = useState<CharacterProfile>(() => restoredBuild?.character ?? initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(() =>
    restoredBuild ? gearFromBuild(restoredBuild) : normalizeGearForCharacter(defaultGear, initialCharacter.className, initialCharacter.spec),
  )
  const [activeBuffIds, setActiveBuffIds] = useState<readonly string[]>(() => restoredBuild?.activeBuffIds ?? [])
  const [activeConsumableIds, setActiveConsumableIds] = useState<readonly string[]>(() => restoredBuild?.activeConsumableIds ?? [])
  const [activeTargetDebuffIds, setActiveTargetDebuffIds] = useState<readonly string[]>(() => restoredBuild?.activeTargetDebuffIds ?? [])
  const [talentPoints, setTalentPoints] = useState<TalentPoints>(() => restoredBuild?.talentPoints ?? {})
  /*
   * Which raid's loot is being read. Undefined means the picker: five loot tables stacked on one page
   * is several hundred rows, and nobody arrives wanting all five — they arrive wanting one.
   */
  const [selectedRaidId, setSelectedRaidId] = useState<string>()
  const [target, setTarget] = useState<SimulationTarget>(() => restoredBuild?.target ?? defaultSimulationTarget)
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const buildState: BuildState = { character, gear, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, talentPoints, target }

  useEffect(() => {
    saveBuildToStorage({ character, gear, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, talentPoints, target })
  }, [character, gear, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, talentPoints, target])

  function importBuild(build: SavedBuild) {
    setCharacter(build.character)
    setGear(gearFromBuild(build))
    setActiveBuffIds(build.activeBuffIds)
    setActiveConsumableIds(build.activeConsumableIds)
    setActiveTargetDebuffIds(build.activeTargetDebuffIds)
    setTalentPoints(build.talentPoints ?? {})
    setTarget(build.target)
    setSimulationResult(undefined)
  }

  const role = getRoleForSpec(character.className, character.spec)

  const stats = useMemo(
    () => calculateStats(character, gear, activeBuffIds, activeConsumableIds),
    [character, gear, activeBuffIds, activeConsumableIds],
  )
  // Cheap enough to keep live (a handful of pure re-runs of the sim), and stat priority is reference
  // information you want visible while gearing rather than something to press a button for.
  const statWeights = useMemo(
    () => calculateStatWeights(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target],
  )

  function updateGear(slot: GearSlot, equippedSlot: EquippedSlot) {
    setGear((current) => ({ ...current, [slot]: equippedSlot }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    // Talents belong to a class. Keeping them across a class change would leave points sitting on
    // talent ids that the new class's trees do not contain.
    if (nextCharacter.className !== character.className) setTalentPoints({})
    setCharacter(nextCharacter)
    setGear((current) => normalizeGearForCharacter(current, nextCharacter.className, nextCharacter.spec))
    setSimulationResult(undefined)
  }

  /*
   * The buff, consumable and target-debuff *toggles* are gone with the Buffs & Consumables panel,
   * but the three id lists deliberately are not: `calculateStats`, `findUpgrades` and the saved-build
   * format all still read them, and a build saved while the panel existed must keep resolving.
   *
   * `BuffsPanel.tsx` and its data are untouched on disk. Restoring the panel means rendering it
   * again and giving it back three callbacks that flip an id in and out of these lists.
   */

  const upgradeReport = useMemo(
    () => findUpgrades(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target],
  )

  function updateTarget(nextTarget: SimulationTarget) {
    setTarget(nextTarget)
    setSimulationResult(undefined)
  }

  function runSimulation() {
    setSimulationResult(calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, target))
  }

  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  if (!introComplete) return <LoadingIntro onComplete={completeIntro} />

  // The way in. Choosing a section is a real decision — gearing a character, reading a loot table and
  // levelling a profession have nothing to do with each other — so it is made once, deliberately,
  // rather than by landing in whichever tab happened to be first. The tab bar still moves you
  // between them afterwards.
  if (!sectionChosen) {
    return (
      <SectionPicker
        onSelect={(section) => {
          setActiveTab(section)
          setSectionChosen(true)
        }}
      />
    )
  }

  // Creation runs before the planner rather than inside it: the whole tab is about a character, so
  // there is nothing worth showing until there is one. Reachable again from the rail's "Start over".
  if (activeTab === 'planner' && !characterChosen) {
    return (
      <CharacterCreator
        initial={character}
        onComplete={(chosen) => {
          updateCharacter(chosen)
          setCharacterChosen(true)
        }}
        onCancel={() => setSectionChosen(false)}
      />
    )
  }

  return (
    <AppShell
      // Stats belong to a character, and only the planner has one in play. A rail of numbers next to
      // a raid's loot table would be describing something that is not on screen.
      rail={
        activeTab === 'planner' ? (
          <>
            <CharacterRail character={character} onChange={updateCharacter} onRestart={() => setCharacterChosen(false)} />
            <StatsRail stats={stats} />
          </>
        ) : activeTab === 'raids' && selectedRaidId ? (
          // Same argument as the planner's stat rail: the rail holds the thing you keep returning to
          // while reading the main pane. Here that is the list of other raids.
          <RaidRail selectedRaidId={selectedRaidId} onSelect={setSelectedRaidId} onBackToPicker={() => setSelectedRaidId(undefined)} />
        ) : undefined
      }
      tabs={visibleTabs(simulationEnabled)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'planner' && (
        <>
          {/* The character selects live in the rail now — see CharacterRail. This tab is what you
              are doing, not who you are. */}
          <GearPanel character={character} gear={gear} onChange={updateGear} />
          <TalentsPanel character={character} points={talentPoints} onChange={setTalentPoints} />
          <BisPanel character={character} gear={gear} onEquip={updateGear} />
          <BuildPanel state={buildState} role={role} onImport={importBuild} />
        </>
      )}
      {activeTab === 'simulation' && simulationEnabled && (
        <>
          <EncounterPanel target={target} role={role} onChange={updateTarget} />
          <SimulatorPanel result={simulationResult} role={role} onRun={runSimulation} />
          <StatWeightsPanel weights={statWeights} role={role} />
          <UpgradesPanel character={character} report={upgradeReport} role={role} onEquip={updateGear} />
        </>
      )}
      {/* The character is passed only once it has been chosen deliberately. Marking the default Fury
          Warrior on the lists for someone who never picked it would answer "where do I stand" with a
          spec they never named. */}
      {activeTab === 'tierlists' && <TierListsPanel highlight={characterChosen ? character : undefined} />}
      {activeTab === 'raids' &&
        (selectedRaidId ? <RaidsPanel raidId={selectedRaidId} /> : <RaidPicker onSelect={setSelectedRaidId} />)}
      {activeTab === 'professions' && <ProfessionsPanel />}
    </AppShell>
  )
}

export default App
