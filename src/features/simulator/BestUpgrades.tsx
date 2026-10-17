import { useRef, useState, type MouseEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById } from '../../domain/gems/sampleGems'
import { animateEquipFeedback } from '../../lib/animations'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, isEmptySlotItem } from '../gear/gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from '../gear/gearTypes'
import { ItemIcon } from '../gear/ItemIcon'
import type { UpgradeCandidate, UpgradeReport } from './findUpgrades'
import { formatNumber, formatSigned, metricUnit } from './simFormat'

/** How many upgrades the step shows before "Show all", as the decided design does. */
const SHOWN = 8

function itemOrigin(item: GearItem) {
  return [item.instance, item.boss, item.vendor, item.reputation, item.craftedBy, item.zone].filter(Boolean).join(' · ')
}

type BestUpgradesProps = {
  character: CharacterProfile
  gear: EquippedGear
  report: UpgradeReport
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

/**
 * Step 2 of "What to do next": the upgrade finder's swaps, best first, each with Equip.
 *
 * Equip applies exactly the gems and enchant the score assumed, so the estimate moves by the delta
 * the row promised. The row then leaves the list (the finder re-runs on the new gear), so focus goes
 * back to this step's heading and a line says what was equipped, rather than dropping to the page.
 */
export function BestUpgrades({ character, gear, report, onEquip }: BestUpgradesProps) {
  const [showAll, setShowAll] = useState(false)
  const [equipped, setEquipped] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const unit = metricUnit(report.metricLabel)
  const slotName = (slot: GearSlot) => getGearSlotDisplayName(slot, character.className, character.spec)
  const best = report.candidates[0]
  const shown = showAll ? report.candidates : report.candidates.slice(0, SHOWN)

  function equip(event: MouseEvent<HTMLButtonElement>, candidate: UpgradeCandidate) {
    animateEquipFeedback(event.currentTarget)
    onEquip(candidate.slot, {
      item: candidate.item,
      // Gems and enchant must both match what findUpgrades scored, or the realised gain won't equal
      // the delta shown on this row.
      gemIds: [...candidate.gemIds],
      enchantId: candidate.enchantId,
    })
    setEquipped(`${slotName(candidate.slot)}: equipped ${candidate.item.name}. The Character Planner wears it too.`)
    heading.current?.focus()
  }

  return (
    <section className="sim-step" aria-labelledby="sim-step-upgrades">
      <h3 id="sim-step-upgrades" ref={heading} tabIndex={-1}>
        <span className="sim-step-n" aria-hidden="true">
          2
        </span>
        Your best upgrades
      </h3>
      {best && (
        <p className="sim-lead">
          The biggest single gain is <b>{best.item.name}</b> in {slotName(best.slot)}: {formatSigned(best.scoreDelta)} {unit}.
        </p>
      )}
      <p className="sim-status" role="status">
        {equipped}
      </p>

      {report.candidates.length === 0 ? (
        <p className="sim-small" data-testid="upgrades-empty">
          Nothing in the catalogue beats what you wear for this spec. That usually means the set is already the best this catalogue
          offers, not that the character is finished.
        </p>
      ) : (
        <ol className="upgrade-list" data-testid="upgrade-list">
          {shown.map((candidate) => (
            <li className="upgrade-row" key={`${candidate.slot}-${candidate.item.id}`}>
              <span className={`upgrade-icon loot-icon loot-icon-${candidate.item.quality.toLowerCase()}`} aria-hidden="true">
                <ItemIcon wowItemId={candidate.item.wowItemId} fallback="" />
              </span>
              <span className="upgrade-main">
                <b style={{ color: getQualityColor(candidate.item.quality) }}>{candidate.item.name}</b>{' '}
                <span className="upgrade-slot">{slotName(candidate.slot)}</span>
                <span className="upgrade-meta">
                  {isEmptySlotItem(gear[candidate.slot]?.item) ? 'fills an empty slot' : `replaces ${candidate.replacesName}`}
                  {itemOrigin(candidate.item) ? ` · ${itemOrigin(candidate.item)}` : ''}
                </span>
                {candidate.assumesGemming && (
                  <span className="upgrade-socket-note">
                    Assumes {candidate.gemIds.filter(Boolean).map((gemId) => getGemById(gemId)?.name ?? gemId).join(' + ')}
                  </span>
                )}
                {candidate.dataQuality !== 'sourced' && (
                  <span className={`upgrade-data-note upgrade-data-note-${candidate.dataQuality}`}>
                    {candidate.dataQuality === 'skewed'
                      ? 'Compares a sourced item against an estimated one: this gain is likely overstated'
                      : 'Both items carry estimated stats, so this gain is approximate'}
                  </span>
                )}
              </span>
              <span className="upgrade-delta">
                <strong>+{Math.round(candidate.scoreDelta * 10) / 10}</strong> {unit}
                <span>{formatSigned(candidate.percentDelta)}%</span>
              </span>
              <Button className="upgrade-equip" onClick={(event) => equip(event, candidate)}>
                Equip
              </Button>
            </li>
          ))}
        </ol>
      )}
      {report.candidates.length > SHOWN && (
        <button type="button" className="sim-more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? `Show the best ${SHOWN}` : `Show all ${formatNumber(report.candidates.length)}`}
        </button>
      )}
      <p className="sim-small">
        Every legal item in the catalogue, simulated as a straight swap with the best colour-matched gems and the slot&apos;s enchant where
        it stays legal, ranked by how much it moves the estimate. Two at most per slot, so one weak slot cannot fill the list.
      </p>
    </section>
  )
}
