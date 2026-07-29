import { useCallback, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoadingIntro } from './components/layout/LoadingIntro'
import { BisPanel } from './features/bis/BisPanel'
import { BuffsPanel } from './features/buffs/BuffsPanel'
import { CharacterPanel } from './features/character/CharacterPanel'
import { getRoleForSpec } from './features/character/characterData'
import type { CharacterProfile } from './features/character/characterTypes'
import { defaultGear, normalizeGearForCharacter } from './features/gear/gearData'
import { GearPanel } from './features/gear/GearPanel'
import type { EquippedGear, EquippedSlot, GearSlot } from './features/gear/gearTypes'
import { calculateSimulation } from './features/simulator/calculateSimulation'
import { calculateStatWeights } from './features/simulator/calculateStatWeights'
import { SimulatorPanel } from './features/simulator/SimulatorPanel'
import { StatWeightsPanel } from './features/simulator/StatWeightsPanel'
import type { SimulationResult } from './features/simulator/simulationTypes'
import { calculateStats } from './features/stats/calculateStats'
import { StatsPanel } from './features/stats/StatsPanel'
import { ProfessionsPanel } from './features/professions/ProfessionsPanel'
import type { TabDefinition } from './components/layout/TabNav'

const initialCharacter: CharacterProfile = {
  faction: 'Alliance',
  race: 'Human',
  className: 'Warrior',
  spec: 'Fury',
}

type AppTab = 'planner' | 'professions'

const APP_TABS: readonly TabDefinition<AppTab>[] = [
  { id: 'planner', label: 'Character Planner' },
  { id: 'professions', label: 'Professions' },
]

function toggleId(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
}

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('planner')
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(() => normalizeGearForCharacter(defaultGear, initialCharacter.className, initialCharacter.spec))
  const [activeBuffIds, setActiveBuffIds] = useState<readonly string[]>([])
  const [activeConsumableIds, setActiveConsumableIds] = useState<readonly string[]>([])
  const [activeTargetDebuffIds, setActiveTargetDebuffIds] = useState<readonly string[]>([])
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const role = getRoleForSpec(character.className, character.spec)
  const stats = useMemo(
    () => calculateStats(character, gear, activeBuffIds, activeConsumableIds),
    [character, gear, activeBuffIds, activeConsumableIds],
  )
  // Cheap enough to keep live (a handful of pure re-runs of the sim), and stat priority is reference
  // information you want visible while gearing rather than something to press a button for.
  const statWeights = useMemo(
    () => calculateStatWeights(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds],
  )

  function updateGear(slot: GearSlot, equippedSlot: EquippedSlot) {
    setGear((current) => ({ ...current, [slot]: equippedSlot }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    setCharacter(nextCharacter)
    setGear((current) => normalizeGearForCharacter(current, nextCharacter.className, nextCharacter.spec))
    setSimulationResult(undefined)
  }

  function toggleBuff(id: string) {
    setActiveBuffIds((current) => toggleId(current, id))
    setSimulationResult(undefined)
  }

  function toggleConsumable(id: string) {
    setActiveConsumableIds((current) => toggleId(current, id))
    setSimulationResult(undefined)
  }

  function toggleTargetDebuff(id: string) {
    setActiveTargetDebuffIds((current) => toggleId(current, id))
    setSimulationResult(undefined)
  }

  function runSimulation() {
    setSimulationResult(calculateSimulation(character, gear, stats, role, activeTargetDebuffIds))
  }

  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  if (!introComplete) return <LoadingIntro onComplete={completeIntro} />

  return (
    <AppShell tabs={APP_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'planner' ? (
        <>
          <CharacterPanel character={character} onChange={updateCharacter} />
          <GearPanel character={character} gear={gear} onChange={updateGear} />
          <BisPanel character={character} gear={gear} onEquip={updateGear} />
          <BuffsPanel
            character={character}
            activeBuffIds={activeBuffIds}
            activeConsumableIds={activeConsumableIds}
            activeTargetDebuffIds={activeTargetDebuffIds}
            onToggleBuff={toggleBuff}
            onToggleConsumable={toggleConsumable}
            onToggleTargetDebuff={toggleTargetDebuff}
          />
          <StatsPanel stats={stats} role={role} />
          <SimulatorPanel result={simulationResult} role={role} onRun={runSimulation} />
          <StatWeightsPanel weights={statWeights} role={role} />
        </>
      ) : (
        <ProfessionsPanel />
      )}
    </AppShell>
  )
}

export default App
