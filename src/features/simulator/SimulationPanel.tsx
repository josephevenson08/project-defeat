import { Panel } from '../../components/layout/Panel'
import { getVisibleGearSlotsForSpec, isEmptySlotItem } from '../gear/gearData'
import type { EquippedGear, EquippedSlot, GearSlot } from '../gear/gearTypes'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getRoleForSpec } from '../../domain/character/tbcClasses'
import type { SimulationTarget } from '../../domain/simulation/encounterTypes'
import { getTalentData } from '../../domain/talents/sampleTalents'
import { pointsInTree, type TalentPoints } from '../../domain/talents/talentTypes'
import { BestUpgrades } from './BestUpgrades'
import type { StatWeightsResult } from './calculateStatWeights'
import type { UpgradeReport } from './findUpgrades'
import { formatNumber } from './simFormat'
import type { SimulationResult } from './simulationTypes'
import { StatPriority } from './StatPriority'
import { TheEstimate } from './TheEstimate'
import { WhatIsModelled } from './WhatIsModelled'

type SimulationPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  talentPoints: TalentPoints
  buffCount: number
  consumableCount: number
  debuffCount: number
  target: SimulationTarget
  result: SimulationResult
  weights: StatWeightsResult
  upgrades: UpgradeReport
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
  onOpenPlanner: () => void
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/**
 * The Simulation tab (port step 4, 2026-10-17): design C, "What to do next", with design A's damage
 * sources and breakdown under the estimate — the owner's pick (`docs/design/prototypes/tabs/simulation.html`).
 *
 * **No Run button.** The design leads with what to act on, which needs the stat weights and the
 * upgrade finder, and both already re-ran the model on every change; the estimate is one run of the
 * same model, so it is always current too. A number that waits for a press can describe gear you
 * have since taken off.
 */
export function SimulationPanel({
  character,
  gear,
  talentPoints,
  buffCount,
  consumableCount,
  debuffCount,
  target,
  result,
  weights,
  upgrades,
  onEquip,
  onOpenPlanner,
}: SimulationPanelProps) {
  const slots = getVisibleGearSlotsForSpec(character.className, character.spec)
  const filled = slots.filter((slot) => gear[slot] && !isEmptySlotItem(gear[slot].item)).length
  const trees = getTalentData(character.className)?.trees
  const split = trees?.map((tree) => pointsInTree(tree, talentPoints)).join(' / ')

  return (
    <>
      <section className="sim-hero" aria-labelledby="sim-hero-title">
        <p className="eyebrow">Simulation · Phase 2 · DPS specs</p>
        <h1 id="sim-hero-title">
          Estimate your DPS against <em>one fixed raid boss</em>.
        </h1>
        <p>
          One attack-table and spell-table pass over your planner set: stat totals, talents, buffs, consumables and target debuffs. Then
          stat weights from re-running it with each stat nudged, and an upgrade finder that re-runs it for every gear swap.
        </p>
        <ul className="sim-target" aria-label="The fixed encounter">
          <li>
            <b>Target</b>
            {target.name.replace(/\s*\(Level \d+\)$/, '')}
          </li>
          <li>
            <b>Level</b>
            {target.level}
          </li>
          <li>
            <b>Armor</b>
            {formatNumber(target.armor)}
          </li>
          <li>
            <b>Targets</b>1
          </li>
        </ul>
        <p className="sim-small">
          A fixed encounter, with nothing to set. The armor is a common generic TBC raid-boss figure, not one boss&apos;s tooltip; real
          bosses vary{target.needsVerification ? ', and the data flags it to be verified' : ''}.
        </p>
      </section>

      <Panel
        title="What to do next"
        eyebrow="From the model, on your character"
        className="sim-next"
        accentColor={getRoleAccentColor(getRoleForSpec(character.className, character.spec))}
      >
        <p className="sim-who" data-testid="simulation-who">
          <span>
            {character.race} {character.spec} {character.className} · {filled} of {slots.length} slots
            {split ? ` · talents ${split}` : ''} · {plural(buffCount, 'buff')} · {plural(consumableCount, 'consumable')}
            {debuffCount > 0 ? ` · ${plural(debuffCount, 'target debuff')}` : ''}
          </span>
          <button type="button" className="sim-link" onClick={onOpenPlanner}>
            Change it on the Character Planner
          </button>
        </p>

        {/*
          Above everything, not under the number. Every participant who ran the simulator in the
          2026-09-21 usability study had no weapon equipped and was shown a confident 28 to 76 DPS
          anyway, and two took it for a broken tool. On this tab a missing weapon is also, plainly, the
          first thing to do next.
        */}
        {result.missingWeaponNote && (
          <p className="simulation-missing-weapon" data-testid="simulation-missing-weapon">
            {result.missingWeaponNote}
          </p>
        )}

        <div className="sim-steps">
          <StatPriority weights={weights} />
          <BestUpgrades character={character} gear={gear} report={upgrades} onEquip={onEquip} />
          <TheEstimate character={character} result={result} />
        </div>
      </Panel>

      <WhatIsModelled />
    </>
  )
}
