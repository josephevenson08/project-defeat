import { CheckCircle2 } from 'lucide-react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import { getBisListForSpec, type RankedGearEntry } from '../../domain/bis'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { gearSlots, type GearSlot } from '../../domain/gear/gearSlots'
import { getPairedGearSlots, isItemBlockedByUniqueInGear, isPairedGearSlot } from '../../domain/gear/slotCompatibility'
import { getGemById } from '../../domain/gems/sampleGems'
import { animateEquipFeedback } from '../../lib/animations'
import type { CharacterProfile } from '../character/characterTypes'
import { getItemById } from '../gear/gearData'
import type { EquippedGear, EquippedSlot, GearItem } from '../gear/gearTypes'

type BisPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
}

function entriesBySlot(entries: readonly RankedGearEntry[]) {
  const groups = new Map<GearSlot, RankedGearEntry[]>()

  entries.forEach((entry) => {
    const slotEntries = groups.get(entry.slot) ?? []
    slotEntries.push(entry)
    groups.set(entry.slot, slotEntries)
  })

  groups.forEach((slotEntries) => slotEntries.sort((a, b) => a.rank - b.rank))
  return groups
}

function itemLocation(item: GearItem) {
  return [item.source, item.zone, item.instance, item.boss, item.vendor, item.reputation, item.craftedBy]
    .filter(Boolean)
    .join(' / ')
}

function sourceDetails(entry: RankedGearEntry, item: GearItem | undefined) {
  const source = entry.source

  return {
    sourceType: source?.type ?? item?.source,
    instance: source?.instance ?? item?.instance ?? item?.zone,
    bossOrVendor: source?.boss ?? source?.vendor ?? source?.reputation ?? source?.craftedBy ?? item?.boss ?? item?.vendor ?? item?.reputation ?? item?.craftedBy,
    phase: source?.phase ?? item?.phase,
    notes: source?.notes,
    needsVerification: source?.needsVerification === true || entry.needsVerification === true || item?.needsVerification === true,
  }
}

function recommendationsFor(entry: RankedGearEntry) {
  const enchant = getEnchantById(entry.recommendedEnchantId)
  const gems = entry.recommendedGemIds?.map(getGemById).filter((gem) => gem !== undefined) ?? []

  return {
    enchantName: enchant?.name,
    gemNames: gems.map((gem) => gem.name),
  }
}

function equippedSlotFor(entry: RankedGearEntry, item: GearItem): EquippedSlot {
  return {
    item,
    enchantId: entry.recommendedEnchantId,
    gemIds: item.sockets?.map((_, index) => entry.recommendedGemIds?.[index] ?? '') ?? [],
  }
}

export function BisPanel({ character, gear, onEquip }: BisPanelProps) {
  const bisList = getBisListForSpec(character.className, character.spec)

  if (!bisList) {
    return (
      <Panel title="BiS / Ranked Gear" eyebrow="Guide list" className="bis-panel-shell">
        <div className="bis-empty" data-testid="bis-empty-state">
          <strong>No ranked list yet for {character.spec} {character.className}.</strong>
          <p>Enhancement Shaman Phase 2 is the current starter proof of concept. More lists can plug into this same panel as they are audited.</p>
        </div>
      </Panel>
    )
  }

  const groupedEntries = entriesBySlot(bisList.entries)

  return (
    <Panel title="BiS / Ranked Gear" eyebrow={`Phase ${bisList.phase} guide list`} className="bis-panel-shell">
      <div className="bis-panel" data-testid="bis-panel">
        <div className="bis-summary">
          <strong>{bisList.title}</strong>
          <span>{bisList.sourceName}</span>
        </div>

        <div className="bis-slot-list">
          {gearSlots.map((slot) => {
            const entries = groupedEntries.get(slot)
            if (!entries) return null

            return (
              <section className="bis-slot-group" key={slot} aria-label={`${slot} ranked items`}>
                <div className="bis-slot-heading">
                  <h3>{slot}</h3>
                  <span>{entries.length} ranked</span>
                </div>

                <div className="bis-entry-list">
                  {entries.map((entry) => {
                    const item = getItemById(entry.itemId)
                    const { enchantName, gemNames } = recommendationsFor(entry)
                    const targetSlots = getPairedGearSlots(entry.slot)
                    const isPairedItem = isPairedGearSlot(entry.slot)
                    const wowItemId = entry.wowItemId ?? item?.wowItemId
                    const source = sourceDetails(entry, item)

                    return (
                      <article className="bis-entry" key={`${entry.slot}-${entry.rank}-${entry.itemId}`}>
                        <div className="bis-entry-main">
                          <span className="bis-rank">#{entry.rank}</span>
                          <div>
                            <h4>{item?.name ?? entry.itemId}</h4>
                            <p>
                              {wowItemId ? `Item ID ${wowItemId}` : 'Item ID pending audit'} · {entry.slot}
                            </p>
                          </div>
                        </div>

                        <dl className="bis-entry-details">
                          <div>
                            <dt>Source</dt>
                            <dd>{source.sourceType ?? (item ? itemLocation(item) || item.source : entry.sourceName)}</dd>
                          </div>
                          {(source.instance || source.bossOrVendor || source.phase) && (
                            <div>
                              <dt>Farm</dt>
                              <dd>
                                {[source.instance, source.bossOrVendor, source.phase ? `Phase ${source.phase}` : undefined].filter(Boolean).join(' · ')}
                              </dd>
                            </div>
                          )}
                          {source.needsVerification && (
                            <div className="bis-verification-warning">
                              <dt>Verification</dt>
                              <dd>{source.notes ?? 'Needs source/rank verification before treating as final.'}</dd>
                            </div>
                          )}
                          {entry.notes && (
                            <div>
                              <dt>Notes</dt>
                              <dd>{entry.notes}</dd>
                            </div>
                          )}
                          {(enchantName || gemNames.length > 0) && (
                            <div>
                              <dt>Recommended</dt>
                              <dd>
                                {[enchantName, gemNames.length > 0 ? gemNames.join(', ') : undefined].filter(Boolean).join(' · ')}
                              </dd>
                            </div>
                          )}
                        </dl>

                        {item ? (
                          <div className="bis-equip-actions">
                            {targetSlots.map((targetSlot) => {
                              const isEquipped = gear[targetSlot].item.id === entry.itemId
                              const blockedByUnique = isItemBlockedByUniqueInGear(item, targetSlot, gear)

                              return (
                                <Button
                                  className="bis-equip-button"
                                  disabled={isEquipped || blockedByUnique}
                                  key={targetSlot}
                                  onClick={(event) => {
                                    animateEquipFeedback(event.currentTarget)
                                    onEquip(targetSlot, equippedSlotFor(entry, item))
                                  }}
                                >
                                  <CheckCircle2 aria-hidden="true" size={16} />
                                  {isEquipped
                                    ? `Equipped ${targetSlot}`
                                    : blockedByUnique
                                      ? 'Unique equipped'
                                      : isPairedItem
                                        ? `Equip ${targetSlot}`
                                        : `Equip ${item.name}`}
                                </Button>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="bis-missing-item">Missing registry item</span>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
