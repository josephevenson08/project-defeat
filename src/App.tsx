import { useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { BisPanel } from './features/bis/BisPanel'
import { CharacterPanel } from './features/character/CharacterPanel'
import { getRoleForSpec } from './features/character/characterData'
import type { CharacterProfile } from './features/character/characterTypes'
import { defaultGear } from './features/gear/gearData'
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

function App() {
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(defaultGear)
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const role = getRoleForSpec(character.className, character.spec)
  const stats = useMemo(() => calculateStats(character, gear), [character, gear])

  function updateGear(slot: GearSlot, equippedSlot: EquippedSlot) {
    setGear((current) => ({ ...current, [slot]: equippedSlot }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    setCharacter(nextCharacter)
    setSimulationResult(undefined)
  }

  function runSimulation() {
    setSimulationResult(calculateSimulation(stats, role))
  }

  return (
    <AppShell>
      <CharacterPanel character={character} onChange={updateCharacter} />
      <GearPanel gear={gear} onChange={updateGear} />
      <BisPanel character={character} gear={gear} onEquip={updateGear} />
      <StatsPanel stats={stats} />
      <SimulatorPanel result={simulationResult} onRun={runSimulation} />
    </AppShell>
  )
}

export default App
