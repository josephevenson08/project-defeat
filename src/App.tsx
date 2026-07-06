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
import { SimulatorPanel } from './features/simulator/SimulatorPanel'
import type { SimulationResult } from './features/simulator/simulationTypes'
import { calculateStats } from './features/stats/calculateStats'
import { StatsPanel } from './features/stats/StatsPanel'

const initialCharacter: CharacterProfile = {
  faction: 'Alliance',
  race: 'Human',
  className: 'Warrior',
  spec: 'Fury',
}

function toggleId(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
}

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(() => normalizeGearForCharacter(defaultGear, initialCharacter.className, initialCharacter.spec))
  const [activeBuffIds, setActiveBuffIds] = useState<readonly string[]>([])
  const [activeConsumableIds, setActiveConsumableIds] = useState<readonly string[]>([])
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const role = getRoleForSpec(character.className, character.spec)
  const stats = useMemo(
    () => calculateStats(character, gear, activeBuffIds, activeConsumableIds),
    [character, gear, activeBuffIds, activeConsumableIds],
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

  function runSimulation() {
    setSimulationResult(calculateSimulation(stats, role))
  }

  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  if (!introComplete) return <LoadingIntro onComplete={completeIntro} />

  return (
    <AppShell>
      <CharacterPanel character={character} onChange={updateCharacter} />
      <GearPanel character={character} gear={gear} onChange={updateGear} />
      <BisPanel character={character} gear={gear} onEquip={updateGear} />
      <BuffsPanel
        character={character}
        activeBuffIds={activeBuffIds}
        activeConsumableIds={activeConsumableIds}
        onToggleBuff={toggleBuff}
        onToggleConsumable={toggleConsumable}
      />
      <StatsPanel stats={stats} role={role} />
      <SimulatorPanel result={simulationResult} role={role} onRun={runSimulation} />
    </AppShell>
  )
}

export default App
