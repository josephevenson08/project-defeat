import { useCallback, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoadingIntro } from './components/layout/LoadingIntro'
import { BisPanel } from './features/bis/BisPanel'
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

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  const [gear, setGear] = useState<EquippedGear>(() => normalizeGearForCharacter(defaultGear, initialCharacter.className, initialCharacter.spec))
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const role = getRoleForSpec(character.className, character.spec)
  const stats = useMemo(() => calculateStats(character, gear), [character, gear])

  function updateGear(slot: GearSlot, equippedSlot: EquippedSlot) {
    setGear((current) => ({ ...current, [slot]: equippedSlot }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    setCharacter(nextCharacter)
    setGear((current) => normalizeGearForCharacter(current, nextCharacter.className, nextCharacter.spec))
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
      <StatsPanel stats={stats} />
      <SimulatorPanel result={simulationResult} onRun={runSimulation} />
    </AppShell>
  )
}

export default App
