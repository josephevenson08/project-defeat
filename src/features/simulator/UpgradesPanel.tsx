import { CheckCircle2 } from 'lucide-react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById } from '../../domain/gems/sampleGems'
import { animateEquipFeedback } from '../../lib/animations'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName } from '../gear/gearData'
import type { EquippedSlot, GearItem, GearSlot } from '../gear/gearTypes'
import type { UpgradeReport } from './findUpgrades'

type UpgradesPanelProps = {
  character: CharacterProfile
  report: UpgradeReport
  role: CharacterRole
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

function itemOrigin(item: GearItem) {
  return [item.instance, item.boss, item.vendor, item.reputation, item.craftedBy, item.zone].filter(Boolean).join(' · ')
}

export function UpgradesPanel({ character, report, role, onEquip }: UpgradesPanelProps) {
  return (
    <Panel title="Upgrade Finder" eyebrow="Ranked gear swaps" accentColor={getRoleAccentColor(role)} className="upgrades-panel-shell">
      <p className="panel-copy">
        Every legal item for every slot, simulated as a straight swap and ranked by how much it moves the result.
        Sockets are filled with the best colour-matched gem for this character, so a delta is what the item is worth{' '}
        <strong>once gemmed</strong>; the slot&apos;s current enchant carries over whenever it stays legal. Equipping
        applies exactly the gems and enchant the score assumed. Almost all of this catalog is sourced from real data
        now — about 3% of items still carry estimated stats — and a row says so when its comparison rests on one,
        because a sourced item measured against an estimated one reads high in a predictable direction.
      </p>

      {report.candidates.length === 0 ? (
        <div className="simulation-empty" data-testid="upgrades-empty">
          No item in the catalog beats what&apos;s already equipped for this spec. That usually means the current set is
          already the best this (still sample-sized) catalog can offer, not that the character is finished.
        </div>
      ) : (
        <div className="upgrade-list" data-testid="upgrade-list">
          {report.candidates.map((candidate) => {
            const displaySlot = getGearSlotDisplayName(candidate.slot, character.className, character.spec)

            return (
              <article className="upgrade-row" key={`${candidate.slot}-${candidate.item.id}`}>
                <div className="upgrade-main">
                  <span className="upgrade-slot">{displaySlot}</span>
                  <h4 style={{ color: getQualityColor(candidate.item.quality) }}>{candidate.item.name}</h4>
                  <p>
                    replaces {candidate.replacesName}
                    {itemOrigin(candidate.item) ? ` · ${itemOrigin(candidate.item)}` : ''}
                  </p>
                  {candidate.assumesGemming && (
                    <small className="upgrade-socket-note">
                      Assumes {candidate.gemIds.filter(Boolean).map((gemId) => getGemById(gemId)?.name ?? gemId).join(' + ')}
                    </small>
                  )}

                  {candidate.dataQuality !== 'sourced' && (
                    <small className={`upgrade-data-note upgrade-data-note-${candidate.dataQuality}`}>
                      {candidate.dataQuality === 'skewed'
                        ? 'Compares a sourced item against an estimated one — this gain is likely overstated'
                        : 'Both items carry estimated stats, so this gain is approximate'}
                    </small>
                  )}
                </div>

                <div className="upgrade-delta">
                  <strong>+{Math.round(candidate.scoreDelta * 10) / 10}</strong>
                  <span>+{candidate.percentDelta.toFixed(1)}%</span>
                </div>

                <Button
                  className="upgrade-equip-button"
                  onClick={(event) => {
                    animateEquipFeedback(event.currentTarget)
                    onEquip(candidate.slot, {
                      item: candidate.item,
                      // Gems and enchant must both match what findUpgrades scored, or the realised
                      // gain won't equal the delta shown on this row.
                      gemIds: [...candidate.gemIds],
                      enchantId: candidate.enchantId,
                    })
                  }}
                >
                  <CheckCircle2 aria-hidden="true" size={16} />
                  Equip
                </Button>
              </article>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
