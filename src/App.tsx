import { useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { CharacterPanel } from './features/character/CharacterPanel'
import type { CharacterProfile } from './features/character/characterTypes'
import { defaultGear } from './features/gear/gearData'
import { GearPanel } from './features/gear/GearPanel'
import type { EquippedGear, GearItem, GearSlot } from './features/gear/gearTypes'
import { calculateSimulation } from './features/simulator/calculateSimulation'
import { SimulatorPanel } from './features/simulator/SimulatorPanel'
import type { SimulationResult } from './features/simulator/simulationTypes'
import { calculateStats } from './features/stats/calculateStats'
import { StatsPanel } from './features/stats/StatsPanel'

const initialCharacter: CharacterProfile = {
  className: 'Warrior',
  spec: 'Fury',
  race: 'Human',
}

function App() {
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(defaultGear)
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const stats = useMemo(() => calculateStats(character, gear), [character, gear])

  function updateGear(slot: GearSlot, item: GearItem) {
    setGear((current) => ({ ...current, [slot]: item }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    setCharacter(nextCharacter)
    setSimulationResult(undefined)
  }

  function runSimulation() {
    setSimulationResult(calculateSimulation(stats))
  }

  return (
    <AppShell>
      <CharacterPanel character={character} onChange={updateCharacter} />
      <GearPanel gear={gear} onChange={updateGear} />
      <StatsPanel stats={stats} />
      <SimulatorPanel result={simulationResult} onRun={runSimulation} />
    </AppShell>
  )
}

export default App
